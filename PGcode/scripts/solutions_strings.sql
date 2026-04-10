-- Solution approaches: strings (10 problems)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'length-of-last-word','longest-common-prefix','roman-to-integer','find-needle-haystack',
  'reverse-words-in-string','longest-palindromic-substring','palindromic-substrings',
  'string-to-integer-atoi','add-binary','count-and-say'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

('length-of-last-word', 1, 'Reverse Scan',
'Walk from the right, skip trailing spaces, then count non-space characters until you hit a space or the start of the string.',
'["Set i = len(s) - 1.","Skip trailing spaces: while i >= 0 and s[i] == '' '', decrement i.","Count characters until the next space or start: while i >= 0 and s[i] != '' '', decrement i and increment length."]'::jsonb,
$PY$class Solution:
    def lengthOfLastWord(self, s: str) -> int:
        i = len(s) - 1
        while i >= 0 and s[i] == ' ':
            i -= 1
        length = 0
        while i >= 0 and s[i] != ' ':
            length += 1
            i -= 1
        return length
$PY$,
$JS$var lengthOfLastWord = function(s) {
    let i = s.length - 1;
    while (i >= 0 && s[i] === ' ') i--;
    let length = 0;
    while (i >= 0 && s[i] !== ' ') { length++; i--; }
    return length;
};
$JS$,
$JAVA$class Solution {
    public int lengthOfLastWord(String s) {
        int i = s.length() - 1;
        while (i >= 0 && s.charAt(i) == ' ') i--;
        int length = 0;
        while (i >= 0 && s.charAt(i) != ' ') { length++; i--; }
        return length;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('longest-common-prefix', 1, 'Vertical Scan',
'Compare characters column by column across all strings. The moment any string ends or a character differs, the answer is the prefix accumulated so far.',
'["If strs is empty, return \"\".","For column i from 0 onward: pick c = strs[0][i].","For each other string, if it is too short or its character at i differs, return strs[0][:i].","If all strings agree on column i, continue until the first string ends."]'::jsonb,
$PY$class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        if not strs:
            return ""
        for i in range(len(strs[0])):
            c = strs[0][i]
            for s in strs[1:]:
                if i >= len(s) or s[i] != c:
                    return strs[0][:i]
        return strs[0]
$PY$,
$JS$var longestCommonPrefix = function(strs) {
    if (!strs.length) return "";
    for (let i = 0; i < strs[0].length; i++) {
        const c = strs[0][i];
        for (let j = 1; j < strs.length; j++) {
            if (i >= strs[j].length || strs[j][i] !== c) {
                return strs[0].slice(0, i);
            }
        }
    }
    return strs[0];
};
$JS$,
$JAVA$class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        for (int i = 0; i < strs[0].length(); i++) {
            char c = strs[0].charAt(i);
            for (int j = 1; j < strs.length; j++) {
                if (i >= strs[j].length() || strs[j].charAt(i) != c) {
                    return strs[0].substring(0, i);
                }
            }
        }
        return strs[0];
    }
}
$JAVA$,
'O(n * m)', 'O(1)'),

('roman-to-integer', 1, 'Left to Right with Lookahead',
'Walk the symbols left to right. When a smaller value precedes a larger one, subtract it; otherwise add it. This is cleaner than handling the six subtractive pairs explicitly.',
'["Build a value map for I, V, X, L, C, D, M.","Initialize total = 0.","For each index i: if i + 1 < n and value[s[i]] < value[s[i+1]], subtract value[s[i]] from total; else add it.","Return total."]'::jsonb,
$PY$class Solution:
    def romanToInt(self, s: str) -> int:
        value = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
        total = 0
        n = len(s)
        for i in range(n):
            if i + 1 < n and value[s[i]] < value[s[i+1]]:
                total -= value[s[i]]
            else:
                total += value[s[i]]
        return total
$PY$,
$JS$var romanToInt = function(s) {
    const value = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
        if (i + 1 < s.length && value[s[i]] < value[s[i+1]]) total -= value[s[i]];
        else total += value[s[i]];
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int romanToInt(String s) {
        Map<Character, Integer> value = Map.of('I',1,'V',5,'X',10,'L',50,'C',100,'D',500,'M',1000);
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int v = value.get(s.charAt(i));
            if (i + 1 < s.length() && v < value.get(s.charAt(i+1))) total -= v;
            else total += v;
        }
        return total;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('find-needle-haystack', 1, 'Brute Force Sliding Window',
'Try every starting position in haystack and compare the length-|needle| window to needle. The first match is the answer.',
'["If needle is empty, return 0.","Loop i from 0 to len(haystack) - len(needle).","Compare haystack[i : i + len(needle)] with needle; if equal return i.","If no match is found, return -1."]'::jsonb,
$PY$class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        if not needle:
            return 0
        n, m = len(haystack), len(needle)
        for i in range(n - m + 1):
            if haystack[i:i+m] == needle:
                return i
        return -1
$PY$,
$JS$var strStr = function(haystack, needle) {
    if (needle === "") return 0;
    const n = haystack.length, m = needle.length;
    for (let i = 0; i <= n - m; i++) {
        if (haystack.slice(i, i + m) === needle) return i;
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int strStr(String haystack, String needle) {
        if (needle.isEmpty()) return 0;
        int n = haystack.length(), m = needle.length();
        for (int i = 0; i <= n - m; i++) {
            if (haystack.substring(i, i + m).equals(needle)) return i;
        }
        return -1;
    }
}
$JAVA$,
'O(n * m)', 'O(1)'),

('reverse-words-in-string', 1, 'Split Reverse Join',
'Split on whitespace (which naturally collapses runs of spaces and trims), reverse the list of tokens, and join them with a single space.',
'["Split s on whitespace to get a list of non-empty words.","Reverse the list.","Join with a single space and return."]'::jsonb,
$PY$class Solution:
    def reverseWords(self, s: str) -> str:
        return ' '.join(reversed(s.split()))
$PY$,
$JS$var reverseWords = function(s) {
    return s.trim().split(/\s+/).reverse().join(' ');
};
$JS$,
$JAVA$class Solution {
    public String reverseWords(String s) {
        String[] words = s.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('longest-palindromic-substring', 1, 'Expand Around Center',
'Every palindrome is centered somewhere. There are 2n - 1 centers (n single chars + n - 1 gaps between chars). Expanding outward from each center in O(n) gives total O(n^2).',
'["Track best = (start, length) seen so far.","For each index i: expand around center (i, i) for odd-length palindromes.","Also expand around center (i, i + 1) for even-length palindromes.","Each expansion walks outward while characters match and updates best.","Return s[start : start + length]."]'::jsonb,
$PY$class Solution:
    def longestPalindrome(self, s: str) -> str:
        start, best = 0, 0
        def expand(l, r):
            nonlocal start, best
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > best:
                    start, best = l, r - l + 1
                l -= 1
                r += 1
        for i in range(len(s)):
            expand(i, i)
            expand(i, i + 1)
        return s[start:start + best]
$PY$,
$JS$var longestPalindrome = function(s) {
    let start = 0, best = 0;
    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) {
            if (r - l + 1 > best) { start = l; best = r - l + 1; }
            l--; r++;
        }
    };
    for (let i = 0; i < s.length; i++) {
        expand(i, i);
        expand(i, i + 1);
    }
    return s.slice(start, start + best);
};
$JS$,
$JAVA$class Solution {
    int start = 0, best = 0;
    public String longestPalindrome(String s) {
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substring(start, start + best);
    }
    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            if (r - l + 1 > best) { start = l; best = r - l + 1; }
            l--; r++;
        }
    }
}
$JAVA$,
'O(n^2)', 'O(1)'),

('palindromic-substrings', 1, 'Expand Around Center',
'Count palindromes by expanding around every possible center. Each successful expansion represents exactly one palindromic substring.',
'["Initialize count = 0.","For each index i: expand around (i, i) and (i, i + 1).","Each expansion increments count and advances outward while s[l] == s[r].","Return count."]'::jsonb,
$PY$class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0
        def expand(l, r):
            nonlocal count
            while l >= 0 and r < len(s) and s[l] == s[r]:
                count += 1
                l -= 1
                r += 1
        for i in range(len(s)):
            expand(i, i)
            expand(i, i + 1)
        return count
$PY$,
$JS$var countSubstrings = function(s) {
    let count = 0;
    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }
    };
    for (let i = 0; i < s.length; i++) {
        expand(i, i);
        expand(i, i + 1);
    }
    return count;
};
$JS$,
$JAVA$class Solution {
    int count = 0;
    public int countSubstrings(String s) {
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return count;
    }
    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { count++; l--; r++; }
    }
}
$JAVA$,
'O(n^2)', 'O(1)'),

('string-to-integer-atoi', 1, 'Sequential State Machine',
'Process the string in fixed phases: skip whitespace, read optional sign, consume digits, clamp to the 32-bit range. Clamping happens as overflow is detected to avoid relying on language-level integer overflow.',
'["Skip leading whitespace.","If next char is + or -, record the sign and advance.","Read digits into result, clamping to INT_MIN or INT_MAX on every step.","Stop at the first non-digit and return sign * result."]'::jsonb,
$PY$class Solution:
    def myAtoi(self, s: str) -> int:
        INT_MAX = 2**31 - 1
        INT_MIN = -2**31
        i, n = 0, len(s)
        while i < n and s[i] == ' ':
            i += 1
        sign = 1
        if i < n and s[i] in '+-':
            sign = -1 if s[i] == '-' else 1
            i += 1
        result = 0
        while i < n and s[i].isdigit():
            result = result * 10 + int(s[i])
            if sign * result > INT_MAX:
                return INT_MAX
            if sign * result < INT_MIN:
                return INT_MIN
            i += 1
        return sign * result
$PY$,
$JS$var myAtoi = function(s) {
    const INT_MAX = 2**31 - 1, INT_MIN = -(2**31);
    let i = 0, n = s.length;
    while (i < n && s[i] === ' ') i++;
    let sign = 1;
    if (i < n && (s[i] === '+' || s[i] === '-')) { sign = s[i] === '-' ? -1 : 1; i++; }
    let result = 0;
    while (i < n && s[i] >= '0' && s[i] <= '9') {
        result = result * 10 + (s.charCodeAt(i) - 48);
        if (sign * result > INT_MAX) return INT_MAX;
        if (sign * result < INT_MIN) return INT_MIN;
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
        long result = 0;
        while (i < n && Character.isDigit(s.charAt(i))) {
            result = result * 10 + (s.charAt(i) - '0');
            if (sign * result > Integer.MAX_VALUE) return Integer.MAX_VALUE;
            if (sign * result < Integer.MIN_VALUE) return Integer.MIN_VALUE;
            i++;
        }
        return (int)(sign * result);
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('add-binary', 1, 'Digit-by-Digit with Carry',
'Walk both strings from right to left, summing digit pairs plus a carry bit, just like elementary school addition in base 2.',
'["Initialize i = len(a) - 1, j = len(b) - 1, carry = 0, result = [].","Loop while i >= 0 or j >= 0 or carry: let total = carry.","Add int(a[i]) (if i valid) and int(b[j]) (if j valid) to total; advance pointers.","Append str(total % 2); carry = total // 2.","Reverse result and join."]'::jsonb,
$PY$class Solution:
    def addBinary(self, a: str, b: str) -> str:
        i, j = len(a) - 1, len(b) - 1
        carry = 0
        result = []
        while i >= 0 or j >= 0 or carry:
            total = carry
            if i >= 0:
                total += int(a[i]); i -= 1
            if j >= 0:
                total += int(b[j]); j -= 1
            result.append(str(total % 2))
            carry = total // 2
        return ''.join(reversed(result))
$PY$,
$JS$var addBinary = function(a, b) {
    let i = a.length - 1, j = b.length - 1, carry = 0;
    const result = [];
    while (i >= 0 || j >= 0 || carry) {
        let total = carry;
        if (i >= 0) total += parseInt(a[i--]);
        if (j >= 0) total += parseInt(b[j--]);
        result.push(String(total % 2));
        carry = Math.floor(total / 2);
    }
    return result.reverse().join('');
};
$JS$,
$JAVA$class Solution {
    public String addBinary(String a, String b) {
        int i = a.length() - 1, j = b.length() - 1, carry = 0;
        StringBuilder sb = new StringBuilder();
        while (i >= 0 || j >= 0 || carry > 0) {
            int total = carry;
            if (i >= 0) total += a.charAt(i--) - '0';
            if (j >= 0) total += b.charAt(j--) - '0';
            sb.append(total % 2);
            carry = total / 2;
        }
        return sb.reverse().toString();
    }
}
$JAVA$,
'O(max(n,m))', 'O(max(n,m))'),

('count-and-say', 1, 'Iterative Run-Length Build',
'Start from "1" and repeatedly build the next term by grouping consecutive identical digits and emitting "count + digit" for each group. Iterate n - 1 times.',
'["Set term = \"1\".","Repeat n - 1 times: scan term with two pointers, counting runs of the same digit.","For each run, append count and the digit to a new string.","Replace term with the new string. Return term."]'::jsonb,
$PY$class Solution:
    def countAndSay(self, n: int) -> str:
        term = "1"
        for _ in range(n - 1):
            next_term = []
            i = 0
            while i < len(term):
                j = i
                while j < len(term) and term[j] == term[i]:
                    j += 1
                next_term.append(str(j - i))
                next_term.append(term[i])
                i = j
            term = ''.join(next_term)
        return term
$PY$,
$JS$var countAndSay = function(n) {
    let term = "1";
    for (let k = 1; k < n; k++) {
        let next = "";
        let i = 0;
        while (i < term.length) {
            let j = i;
            while (j < term.length && term[j] === term[i]) j++;
            next += (j - i) + term[i];
            i = j;
        }
        term = next;
    }
    return term;
};
$JS$,
$JAVA$class Solution {
    public String countAndSay(int n) {
        String term = "1";
        for (int k = 1; k < n; k++) {
            StringBuilder sb = new StringBuilder();
            int i = 0;
            while (i < term.length()) {
                int j = i;
                while (j < term.length() && term.charAt(j) == term.charAt(i)) j++;
                sb.append(j - i).append(term.charAt(i));
                i = j;
            }
            term = sb.toString();
        }
        return term;
    }
}
$JAVA$,
'O(n * L)', 'O(L)');

COMMIT;

SELECT COUNT(*) AS strings_solutions FROM public."PGcode_solution_approaches" sa JOIN public."PGcode_problems" p ON p.id=sa.problem_id WHERE p.topic_id='strings';
