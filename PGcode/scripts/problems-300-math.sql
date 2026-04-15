-- Grow catalog 200 → 300: math topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'sqrtx','excel-column-number','palindrome-number','count-primes','fraction-to-decimal','super-pow'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'sqrtx','excel-column-number','palindrome-number','count-primes','fraction-to-decimal','super-pow'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'sqrtx','excel-column-number','palindrome-number','count-primes','fraction-to-decimal','super-pow'
);

-- ============================================================
-- 1) sqrtx (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('sqrtx', 'math', 'Sqrt(x)', 'Easy',
$$<p>Given a non-negative integer <code>x</code>, return the integer square root of <code>x</code> (the largest integer <code>r</code> with <code>r * r &lt;= x</code>). Do not use built-in sqrt.</p>$$,
'', ARRAY[
  'Binary search over [0, x]. The answer is the largest r where r * r <= x.',
  'Use long arithmetic for mid * mid to avoid overflow when x is near INT_MAX.',
  'Newton iteration converges in O(log x) with only multiplications and divisions — optional alternative.'
], '300', 'https://leetcode.com/problems/sqrtx/',
'mySqrt',
'[{"name":"x","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["4"],"expected":"2"},
  {"inputs":["8"],"expected":"2"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["2147395599"],"expected":"46339"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('sqrtx', 'python',
$PY$class Solution:
    def mySqrt(self, x: int) -> int:
        $PY$),
('sqrtx', 'javascript',
$JS$var mySqrt = function(x) {

};$JS$),
('sqrtx', 'java',
$JAVA$class Solution {
    public int mySqrt(int x) {

    }
}$JAVA$),
('sqrtx', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mySqrt(int x) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('sqrtx', 1, 'Binary Search',
'The function f(r) = r * r is monotonic on non-negative integers, so the largest r with r * r <= x can be found with binary search on [0, x]. Use long arithmetic for the squared comparison to dodge overflow.',
'["If x < 2, return x.","lo = 1, hi = x, answer = 0.","While lo <= hi: mid = (lo + hi) / 2; if mid * mid <= x, answer = mid; lo = mid + 1; else hi = mid - 1.","Return answer."]'::jsonb,
$PY$class Solution:
    def mySqrt(self, x: int) -> int:
        if x < 2:
            return x
        lo, hi, answer = 1, x, 0
        while lo <= hi:
            mid = (lo + hi) // 2
            if mid * mid <= x:
                answer = mid
                lo = mid + 1
            else:
                hi = mid - 1
        return answer
$PY$,
$JS$var mySqrt = function(x) {
    if (x < 2) return x;
    let lo = 1, hi = x, answer = 0;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (mid * mid <= x) { answer = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return answer;
};
$JS$,
$JAVA$class Solution {
    public int mySqrt(int x) {
        if (x < 2) return x;
        long lo = 1, hi = x, answer = 0;
        while (lo <= hi) {
            long mid = (lo + hi) / 2;
            if (mid * mid <= x) { answer = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int) answer;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int mySqrt(int x) {
        if (x < 2) return x;
        long long lo = 1, hi = x, answer = 0;
        while (lo <= hi) {
            long long mid = (lo + hi) / 2;
            if (mid * mid <= (long long)x) { answer = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int)answer;
    }
};
$CPP$,
'O(log x)', 'O(1)');

-- ============================================================
-- 2) excel-column-number (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('excel-column-number', 'math', 'Excel Sheet Column Number', 'Easy',
$$<p>Given a string <code>columnTitle</code> representing a column title as it appears in an Excel sheet (<code>A, B, C, ..., Z, AA, AB, ...</code>), return its corresponding column number. <code>A</code> is 1.</p>$$,
'', ARRAY[
  'The scheme is base-26 with digits A..Z mapped to 1..26 (there is no zero).',
  'Walk left to right: result = result * 26 + (letter - A + 1).',
  'Handles any valid input in one pass.'
], '300', 'https://leetcode.com/problems/excel-sheet-column-number/',
'titleToNumber',
'[{"name":"columnTitle","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"A\""],"expected":"1"},
  {"inputs":["\"AB\""],"expected":"28"},
  {"inputs":["\"ZY\""],"expected":"701"},
  {"inputs":["\"FXSHRXW\""],"expected":"2147483647"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('excel-column-number', 'python',
$PY$class Solution:
    def titleToNumber(self, columnTitle: str) -> int:
        $PY$),
('excel-column-number', 'javascript',
$JS$var titleToNumber = function(columnTitle) {

};$JS$),
('excel-column-number', 'java',
$JAVA$class Solution {
    public int titleToNumber(String columnTitle) {

    }
}$JAVA$),
('excel-column-number', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int titleToNumber(string& columnTitle) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('excel-column-number', 1, 'Base-26 with 1-Indexed Digits',
'Column names are base-26 but use the digit range 1..26 instead of 0..25 — there is no "zero digit". Walking left-to-right and multiplying the running total by 26 before adding the new letter value handles the offset cleanly.',
'["Initialize result = 0.","For each char c in columnTitle: result = result * 26 + (c - A + 1).","Return result."]'::jsonb,
$PY$class Solution:
    def titleToNumber(self, columnTitle: str) -> int:
        result = 0
        for c in columnTitle:
            result = result * 26 + (ord(c) - ord('A') + 1)
        return result
$PY$,
$JS$var titleToNumber = function(columnTitle) {
    let result = 0;
    for (const c of columnTitle) {
        result = result * 26 + (c.charCodeAt(0) - 64);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int titleToNumber(String columnTitle) {
        int result = 0;
        for (int i = 0; i < columnTitle.length(); i++) {
            result = result * 26 + (columnTitle.charAt(i) - 'A' + 1);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int titleToNumber(string& columnTitle) {
        int result = 0;
        for (char c : columnTitle) {
            result = result * 26 + (c - 'A' + 1);
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) palindrome-number (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('palindrome-number', 'math', 'Palindrome Number', 'Easy',
$$<p>Given an integer <code>x</code>, return <code>true</code> iff it reads the same forward and backward in its base-10 representation. Solve without converting to a string.</p>$$,
'', ARRAY[
  'Negative numbers are never palindromes because of the leading minus sign.',
  'Reverse only half of the digits: repeatedly pop the last digit into a growing reversed value until the original is <= reversed.',
  'For even length, original == reversed. For odd length, original == reversed / 10. Either passes iff palindrome.'
], '300', 'https://leetcode.com/problems/palindrome-number/',
'isPalindrome',
'[{"name":"x","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["121"],"expected":"true"},
  {"inputs":["-121"],"expected":"false"},
  {"inputs":["10"],"expected":"false"},
  {"inputs":["0"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('palindrome-number', 'python',
$PY$class Solution:
    def isPalindrome(self, x: int) -> bool:
        $PY$),
('palindrome-number', 'javascript',
$JS$var isPalindrome = function(x) {

};$JS$),
('palindrome-number', 'java',
$JAVA$class Solution {
    public boolean isPalindrome(int x) {

    }
}$JAVA$),
('palindrome-number', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('palindrome-number', 1, 'Reverse Half the Digits',
'Reversing the whole number risks overflow; reversing only half sidesteps that. Stop peeling digits once the remaining original is less than or equal to the growing reversed half — at that point their comparison tells us whether the number is a palindrome.',
'["If x < 0 or (x != 0 and x % 10 == 0), return false.","reversed = 0.","While x > reversed: reversed = reversed * 10 + x % 10; x //= 10.","Return x == reversed (even length) or x == reversed // 10 (odd length)."]'::jsonb,
$PY$class Solution:
    def isPalindrome(self, x: int) -> bool:
        if x < 0 or (x != 0 and x % 10 == 0):
            return False
        reversed_half = 0
        while x > reversed_half:
            reversed_half = reversed_half * 10 + x % 10
            x //= 10
        return x == reversed_half or x == reversed_half // 10
$PY$,
$JS$var isPalindrome = function(x) {
    if (x < 0 || (x !== 0 && x % 10 === 0)) return false;
    let reversedHalf = 0;
    while (x > reversedHalf) {
        reversedHalf = reversedHalf * 10 + x % 10;
        x = Math.floor(x / 10);
    }
    return x === reversedHalf || x === Math.floor(reversedHalf / 10);
};
$JS$,
$JAVA$class Solution {
    public boolean isPalindrome(int x) {
        if (x < 0 || (x != 0 && x % 10 == 0)) return false;
        int reversedHalf = 0;
        while (x > reversedHalf) {
            reversedHalf = reversedHalf * 10 + x % 10;
            x /= 10;
        }
        return x == reversedHalf || x == reversedHalf / 10;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0 || (x != 0 && x % 10 == 0)) return false;
        int reversedHalf = 0;
        while (x > reversedHalf) {
            reversedHalf = reversedHalf * 10 + x % 10;
            x /= 10;
        }
        return x == reversedHalf || x == reversedHalf / 10;
    }
};
$CPP$,
'O(log10(x))', 'O(1)');

-- ============================================================
-- 4) count-primes (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('count-primes', 'math', 'Count Primes', 'Medium',
$$<p>Given an integer <code>n</code>, return the number of prime numbers strictly less than <code>n</code>.</p>$$,
'', ARRAY[
  'Trial dividing every k < n by all smaller numbers is O(n * sqrt(n)) — too slow.',
  'Sieve of Eratosthenes: start with isPrime[2..n-1] = true; for i = 2 up to sqrt(n - 1), if i is prime mark every multiple i*i, i*i + i, ... up to n - 1 as composite.',
  'Count the trues; O(n log log n) overall.'
], '300', 'https://leetcode.com/problems/count-primes/',
'countPrimes',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["10"],"expected":"4"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["1"],"expected":"0"},
  {"inputs":["100"],"expected":"25"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('count-primes', 'python',
$PY$class Solution:
    def countPrimes(self, n: int) -> int:
        $PY$),
('count-primes', 'javascript',
$JS$var countPrimes = function(n) {

};$JS$),
('count-primes', 'java',
$JAVA$class Solution {
    public int countPrimes(int n) {

    }
}$JAVA$),
('count-primes', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimes(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('count-primes', 1, 'Sieve of Eratosthenes',
'Every composite k has a prime factor p <= sqrt(k). So iterating primes up to sqrt(n) and marking their multiples sieves out every composite in near-linear time.',
'["If n <= 2, return 0.","Create isPrime[0..n-1] = true; set isPrime[0] = isPrime[1] = false.","For i from 2 while i * i < n: if isPrime[i], mark j = i * i, i * i + i, ... < n as false.","Return the number of true entries in isPrime."]'::jsonb,
$PY$class Solution:
    def countPrimes(self, n: int) -> int:
        if n <= 2:
            return 0
        is_prime = [True] * n
        is_prime[0] = is_prime[1] = False
        i = 2
        while i * i < n:
            if is_prime[i]:
                for j in range(i * i, n, i):
                    is_prime[j] = False
            i += 1
        return sum(is_prime)
$PY$,
$JS$var countPrimes = function(n) {
    if (n <= 2) return 0;
    const isPrime = new Array(n).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let i = 2; i * i < n; i++) {
        if (isPrime[i]) {
            for (let j = i * i; j < n; j += i) isPrime[j] = false;
        }
    }
    let count = 0;
    for (let i = 2; i < n; i++) if (isPrime[i]) count++;
    return count;
};
$JS$,
$JAVA$class Solution {
    public int countPrimes(int n) {
        if (n <= 2) return 0;
        boolean[] isPrime = new boolean[n];
        Arrays.fill(isPrime, true);
        isPrime[0] = isPrime[1] = false;
        for (int i = 2; (long) i * i < n; i++) {
            if (isPrime[i]) {
                for (int j = i * i; j < n; j += i) isPrime[j] = false;
            }
        }
        int count = 0;
        for (int i = 2; i < n; i++) if (isPrime[i]) count++;
        return count;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int countPrimes(int n) {
        if (n <= 2) return 0;
        vector<bool> isPrime(n, true);
        isPrime[0] = isPrime[1] = false;
        for (long long i = 2; i * i < n; i++) {
            if (isPrime[i]) {
                for (long long j = i * i; j < n; j += i) isPrime[j] = false;
            }
        }
        int count = 0;
        for (int i = 2; i < n; i++) if (isPrime[i]) count++;
        return count;
    }
};
$CPP$,
'O(n log log n)', 'O(n)');

-- ============================================================
-- 5) fraction-to-decimal (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('fraction-to-decimal', 'math', 'Fraction to Recurring Decimal', 'Medium',
$$<p>Given two integers <code>numerator</code> and <code>denominator</code>, return the fraction as a string. If the fractional part is repeating, enclose the repeating section in parentheses.</p>$$,
'', ARRAY[
  'Handle sign and the integer quotient separately; simulate long division for the fractional part.',
  'Track each remainder in a hash map: the first time you see a remainder you have already recorded, the division has started to repeat from there.',
  'Insert a "(" at that earlier index and append ")" at the end.'
], '300', 'https://leetcode.com/problems/fraction-to-recurring-decimal/',
'fractionToDecimal',
'[{"name":"numerator","type":"int"},{"name":"denominator","type":"int"}]'::jsonb,
'str',
'[
  {"inputs":["1","2"],"expected":"\"0.5\""},
  {"inputs":["2","1"],"expected":"\"2\""},
  {"inputs":["4","333"],"expected":"\"0.(012)\""},
  {"inputs":["-50","8"],"expected":"\"-6.25\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('fraction-to-decimal', 'python',
$PY$class Solution:
    def fractionToDecimal(self, numerator: int, denominator: int) -> str:
        $PY$),
('fraction-to-decimal', 'javascript',
$JS$var fractionToDecimal = function(numerator, denominator) {

};$JS$),
('fraction-to-decimal', 'java',
$JAVA$class Solution {
    public String fractionToDecimal(int numerator, int denominator) {

    }
}$JAVA$),
('fraction-to-decimal', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string fractionToDecimal(int numerator, int denominator) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('fraction-to-decimal', 1, 'Long Division + Remainder Map',
'Long division produces one digit per step; the only way for the process to repeat is when a remainder recurs. Keeping a map of remainder → position lets us detect the repetition and wrap exactly the repeating block in parentheses.',
'["Handle zero numerator → \"0\". Compute sign via XOR of the signs.","Work with abs values in 64-bit. Integer quotient goes before the decimal.","If remainder == 0, return the integer part (with sign).","Append \".\"; loop while remainder != 0. If remainder is in seen, insert \"(\" at seen[remainder] and append \")\"; break.","seen[remainder] = len(result); remainder *= 10; append remainder / denom; remainder %= denom."]'::jsonb,
$PY$class Solution:
    def fractionToDecimal(self, numerator: int, denominator: int) -> str:
        if numerator == 0:
            return "0"
        sign = "-" if (numerator < 0) ^ (denominator < 0) else ""
        n, d = abs(numerator), abs(denominator)
        integer_part = n // d
        remainder = n % d
        if remainder == 0:
            return sign + str(integer_part)
        result = [sign + str(integer_part), "."]
        seen = {}
        while remainder != 0:
            if remainder in seen:
                idx = seen[remainder]
                result.insert(idx, "(")
                result.append(")")
                break
            seen[remainder] = len(result)
            remainder *= 10
            result.append(str(remainder // d))
            remainder %= d
        return "".join(result)
$PY$,
$JS$var fractionToDecimal = function(numerator, denominator) {
    if (numerator === 0) return "0";
    const sign = ((numerator < 0) !== (denominator < 0)) ? "-" : "";
    let n = Math.abs(numerator);
    const d = Math.abs(denominator);
    const integerPart = Math.floor(n / d);
    let remainder = n % d;
    if (remainder === 0) return sign + integerPart;
    const result = [sign + integerPart, "."];
    const seen = new Map();
    while (remainder !== 0) {
        if (seen.has(remainder)) {
            const idx = seen.get(remainder);
            result.splice(idx, 0, "(");
            result.push(")");
            break;
        }
        seen.set(remainder, result.length);
        remainder *= 10;
        result.push(String(Math.floor(remainder / d)));
        remainder %= d;
    }
    return result.join("");
};
$JS$,
$JAVA$class Solution {
    public String fractionToDecimal(int numerator, int denominator) {
        if (numerator == 0) return "0";
        StringBuilder sb = new StringBuilder();
        if ((numerator < 0) ^ (denominator < 0)) sb.append("-");
        long n = Math.abs((long) numerator);
        long d = Math.abs((long) denominator);
        sb.append(n / d);
        long remainder = n % d;
        if (remainder == 0) return sb.toString();
        sb.append(".");
        Map<Long, Integer> seen = new HashMap<>();
        while (remainder != 0) {
            if (seen.containsKey(remainder)) {
                sb.insert(seen.get(remainder), "(");
                sb.append(")");
                break;
            }
            seen.put(remainder, sb.length());
            remainder *= 10;
            sb.append(remainder / d);
            remainder %= d;
        }
        return sb.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string fractionToDecimal(int numerator, int denominator) {
        if (numerator == 0) return "0";
        string result;
        if ((numerator < 0) ^ (denominator < 0)) result += "-";
        long long n = llabs((long long)numerator);
        long long d = llabs((long long)denominator);
        result += to_string(n / d);
        long long remainder = n % d;
        if (remainder == 0) return result;
        result += ".";
        unordered_map<long long, int> seen;
        while (remainder != 0) {
            auto it = seen.find(remainder);
            if (it != seen.end()) {
                result.insert(it->second, "(");
                result += ")";
                break;
            }
            seen[remainder] = result.size();
            remainder *= 10;
            result += to_string(remainder / d);
            remainder %= d;
        }
        return result;
    }
};
$CPP$,
'O(d) worst case (bounded by denominator)', 'O(d)');

-- ============================================================
-- 6) super-pow (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('super-pow', 'math', 'Super Pow', 'Hard',
$$<p>Given a positive integer <code>a</code> and a very large non-negative integer <code>b</code> represented as a digit array, return <code>a^b mod 1337</code>.</p>$$,
'', ARRAY[
  'Exponent laws: a^(10k + d) = (a^k)^10 * a^d. Process digits of b left to right folding this rule.',
  'Use modular fast exponentiation inside the fold so every intermediate fits in 32-bit math.',
  'Work everything mod 1337.'
], '300', 'https://leetcode.com/problems/super-pow/',
'superPow',
'[{"name":"a","type":"int"},{"name":"b","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["2","[3]"],"expected":"8"},
  {"inputs":["2","[1,0]"],"expected":"1024"},
  {"inputs":["1","[4,3,3,8,5,2]"],"expected":"1"},
  {"inputs":["2147483647","[2,0,0]"],"expected":"1198"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('super-pow', 'python',
$PY$class Solution:
    def superPow(self, a: int, b: List[int]) -> int:
        $PY$),
('super-pow', 'javascript',
$JS$var superPow = function(a, b) {

};$JS$),
('super-pow', 'java',
$JAVA$class Solution {
    public int superPow(int a, int[] b) {

    }
}$JAVA$),
('super-pow', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int superPow(int a, vector<int>& b) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('super-pow', 1, 'Digit Fold with Fast Power',
'The identity a^(10k + d) = (a^k)^10 * a^d lets us consume b''s decimal digits one at a time: at each step raise the running answer to the 10th power and multiply by a^(current digit), all mod 1337. Fast exponentiation for both the 10-th power and a^d keeps every intermediate small.',
'["Define powMod(x, e, mod) using iterative fast exponentiation.","result = 1.","For each digit d in b: result = powMod(result, 10, 1337) * powMod(a mod 1337, d, 1337) mod 1337.","Return result."]'::jsonb,
$PY$class Solution:
    def superPow(self, a: int, b: List[int]) -> int:
        MOD = 1337
        def pow_mod(x, e):
            x %= MOD
            result = 1
            while e > 0:
                if e & 1:
                    result = result * x % MOD
                x = x * x % MOD
                e >>= 1
            return result
        result = 1
        for d in b:
            result = pow_mod(result, 10) * pow_mod(a, d) % MOD
        return result
$PY$,
$JS$var superPow = function(a, b) {
    const MOD = 1337n;
    const powMod = (x, e) => {
        x = ((BigInt(x) % MOD) + MOD) % MOD;
        let result = 1n;
        let ee = BigInt(e);
        while (ee > 0n) {
            if (ee & 1n) result = (result * x) % MOD;
            x = (x * x) % MOD;
            ee >>= 1n;
        }
        return result;
    };
    let result = 1n;
    for (const d of b) {
        result = (powMod(result, 10n) * powMod(a, d)) % MOD;
    }
    return Number(result);
};
$JS$,
$JAVA$class Solution {
    private static final int MOD = 1337;
    public int superPow(int a, int[] b) {
        long result = 1;
        for (int d : b) {
            result = (powMod(result, 10) * powMod(a, d)) % MOD;
        }
        return (int) result;
    }
    private long powMod(long x, long e) {
        x %= MOD;
        long result = 1;
        while (e > 0) {
            if ((e & 1) == 1) result = result * x % MOD;
            x = x * x % MOD;
            e >>= 1;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
    static const int MOD = 1337;
    long long powMod(long long x, long long e) {
        x %= MOD;
        long long result = 1;
        while (e > 0) {
            if (e & 1) result = result * x % MOD;
            x = x * x % MOD;
            e >>= 1;
        }
        return result;
    }
public:
    int superPow(int a, vector<int>& b) {
        long long result = 1;
        for (int d : b) {
            result = (powMod(result, 10) * powMod(a, d)) % MOD;
        }
        return (int) result;
    }
};
$CPP$,
'O(|b| log 10)', 'O(1)');

COMMIT;
