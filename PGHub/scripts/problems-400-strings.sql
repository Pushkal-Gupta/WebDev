-- Grow catalog 300 -> 400: strings topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'repeated-substring-pattern','detect-capital','excel-sheet-column-title',
  'zigzag-conversion','string-compression','longest-repeating-character-replacement',
  'compare-version-numbers','text-justification'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'repeated-substring-pattern','detect-capital','excel-sheet-column-title',
  'zigzag-conversion','string-compression','longest-repeating-character-replacement',
  'compare-version-numbers','text-justification'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'repeated-substring-pattern','detect-capital','excel-sheet-column-title',
  'zigzag-conversion','string-compression','longest-repeating-character-replacement',
  'compare-version-numbers','text-justification'
);

-- ============================================================
-- 1) repeated-substring-pattern (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('repeated-substring-pattern','strings','Repeated Substring Pattern','Easy',
$$<p>Given a string <code>s</code>, check if it can be constructed by taking a substring of it and appending multiple copies of the substring together.</p>$$,
'',ARRAY[
  'If s can be formed by repeating a substring, that substring length must divide len(s).',
  'Try all divisors d of len(s) from 1 to len(s)/2. Check if s[:d] repeated len(s)/d times equals s.',
  'A clever trick: check if s is in (s + s)[1:-1].'
],'400','https://leetcode.com/problems/repeated-substring-pattern/',
'repeatedSubstringPattern','[{"name":"s","type":"str"}]'::jsonb,'bool',
'[
  {"inputs":["\"abab\""],"expected":"true"},
  {"inputs":["\"aba\""],"expected":"false"},
  {"inputs":["\"abcabcabc\""],"expected":"true"},
  {"inputs":["\"a\""],"expected":"false"},
  {"inputs":["\"aaaa\""],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('repeated-substring-pattern','python',
$PY$class Solution:
    def repeatedSubstringPattern(self, s: str) -> bool:
        $PY$),
('repeated-substring-pattern','javascript',
$JS$/**
 * @param {string} s
 * @return {boolean}
 */
var repeatedSubstringPattern = function(s) {

};$JS$),
('repeated-substring-pattern','java',
$JAVA$class Solution {
    public boolean repeatedSubstringPattern(String s) {

    }
}$JAVA$),
('repeated-substring-pattern','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool repeatedSubstringPattern(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('repeated-substring-pattern',1,'Double String Trick',
'If s is made of repeated copies of some substring, then s will appear inside (s + s) when you remove the first and last characters. This is because the repeated pattern creates overlapping occurrences.',
$ALGO$["Concatenate s with itself to form doubled.","Remove the first and last character from doubled.","Check if s exists as a substring of the trimmed doubled string.","Return true if found, false otherwise."]$ALGO$::jsonb,
$PY$class Solution:
    def repeatedSubstringPattern(self, s: str) -> bool:
        doubled = s + s
        return s in doubled[1:-1]
$PY$,
$JS$var repeatedSubstringPattern = function(s) {
    const doubled = s + s;
    return doubled.slice(1, doubled.length - 1).includes(s);
};
$JS$,
$JAVA$class Solution {
    public boolean repeatedSubstringPattern(String s) {
        String doubled = s + s;
        return doubled.substring(1, doubled.length() - 1).contains(s);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool repeatedSubstringPattern(string s) {
        string doubled = s + s;
        return doubled.substr(1, doubled.size() - 2).find(s) != string::npos;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 2) detect-capital (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('detect-capital','strings','Detect Capital','Easy',
$$<p>We define the usage of capitals in a word to be right when one of the following cases holds:</p><ul><li>All letters in this word are capitals, like <code>"USA"</code>.</li><li>All letters in this word are not capitals, like <code>"leetcode"</code>.</li><li>Only the first letter in this word is capital, like <code>"Google"</code>.</li></ul><p>Given a string <code>word</code>, return <code>true</code> if the usage of capitals in it is right.</p>$$,
'',ARRAY[
  'Count the number of uppercase letters in the word.',
  'The usage is correct if the count is 0 (all lower), equals len(word) (all upper), or is 1 and the first letter is upper.',
  'Alternatively check word == word.upper() or word == word.lower() or word == word.capitalize().'
],'400','https://leetcode.com/problems/detect-capital/',
'detectCapitalUse','[{"name":"word","type":"str"}]'::jsonb,'bool',
'[
  {"inputs":["\"USA\""],"expected":"true"},
  {"inputs":["\"FlaG\""],"expected":"false"},
  {"inputs":["\"leetcode\""],"expected":"true"},
  {"inputs":["\"Google\""],"expected":"true"},
  {"inputs":["\"gooGle\""],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('detect-capital','python',
$PY$class Solution:
    def detectCapitalUse(self, word: str) -> bool:
        $PY$),
('detect-capital','javascript',
$JS$/**
 * @param {string} word
 * @return {boolean}
 */
var detectCapitalUse = function(word) {

};$JS$),
('detect-capital','java',
$JAVA$class Solution {
    public boolean detectCapitalUse(String word) {

    }
}$JAVA$),
('detect-capital','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool detectCapitalUse(string word) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('detect-capital',1,'Count Uppercase Letters',
'There are only three valid patterns. Counting uppercase letters and checking a simple condition covers all three: count == 0, count == n, or count == 1 with the first letter being uppercase.',
$ALGO$["Count the number of uppercase letters in the word.","If count equals 0 (all lowercase), return true.","If count equals the length of the word (all uppercase), return true.","If count equals 1 and the first character is uppercase (title case), return true.","Otherwise return false."]$ALGO$::jsonb,
$PY$class Solution:
    def detectCapitalUse(self, word: str) -> bool:
        upper = sum(1 for c in word if c.isupper())
        return upper == 0 or upper == len(word) or (upper == 1 and word[0].isupper())
$PY$,
$JS$var detectCapitalUse = function(word) {
    let upper = 0;
    for (const ch of word) if (ch >= 'A' && ch <= 'Z') upper++;
    return upper === 0 || upper === word.length || (upper === 1 && word[0] >= 'A' && word[0] <= 'Z');
};
$JS$,
$JAVA$class Solution {
    public boolean detectCapitalUse(String word) {
        int upper = 0;
        for (char c : word.toCharArray()) if (Character.isUpperCase(c)) upper++;
        return upper == 0 || upper == word.length() || (upper == 1 && Character.isUpperCase(word.charAt(0)));
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool detectCapitalUse(string word) {
        int upper = 0;
        for (char c : word) if (isupper(c)) upper++;
        int n = word.size();
        return upper == 0 || upper == n || (upper == 1 && isupper(word[0]));
    }
};
$CPP$,'O(n)','O(1)');

-- ============================================================
-- 3) excel-sheet-column-title (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('excel-sheet-column-title','strings','Excel Sheet Column Title','Easy',
$$<p>Given an integer <code>columnNumber</code>, return its corresponding column title as it appears in an Excel sheet.</p><p>For example: <code>1 -> A</code>, <code>2 -> B</code>, ..., <code>26 -> Z</code>, <code>27 -> AA</code>, <code>28 -> AB</code>, ...</p>$$,
'',ARRAY[
  'This is essentially a base-26 conversion, but 1-indexed instead of 0-indexed.',
  'In each iteration, decrement columnNumber by 1 to make it 0-indexed, then take mod 26 to get the current letter.',
  'Build the result in reverse and flip at the end.'
],'400','https://leetcode.com/problems/excel-sheet-column-title/',
'convertToTitle','[{"name":"columnNumber","type":"int"}]'::jsonb,'str',
'[
  {"inputs":["1"],"expected":"\"A\""},
  {"inputs":["28"],"expected":"\"AB\""},
  {"inputs":["701"],"expected":"\"ZY\""},
  {"inputs":["26"],"expected":"\"Z\""},
  {"inputs":["52"],"expected":"\"AZ\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('excel-sheet-column-title','python',
$PY$class Solution:
    def convertToTitle(self, columnNumber: int) -> str:
        $PY$),
('excel-sheet-column-title','javascript',
$JS$/**
 * @param {number} columnNumber
 * @return {string}
 */
var convertToTitle = function(columnNumber) {

};$JS$),
('excel-sheet-column-title','java',
$JAVA$class Solution {
    public String convertToTitle(int columnNumber) {

    }
}$JAVA$),
('excel-sheet-column-title','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string convertToTitle(int columnNumber) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('excel-sheet-column-title',1,'Base-26 Conversion',
'This is a 1-indexed base-26 system. By decrementing by 1 before each modulo operation, we convert to 0-indexed (A=0, B=1, ..., Z=25), extract the letter, and divide to move to the next digit.',
$ALGO$["Initialise an empty result string.","While columnNumber > 0: decrement by 1, compute remainder = columnNumber mod 26, prepend the character (A + remainder), then set columnNumber = columnNumber / 26.","Return the result."]$ALGO$::jsonb,
$PY$class Solution:
    def convertToTitle(self, columnNumber: int) -> str:
        res = []
        while columnNumber > 0:
            columnNumber -= 1
            res.append(chr(ord('A') + columnNumber % 26))
            columnNumber //= 26
        return ''.join(reversed(res))
$PY$,
$JS$var convertToTitle = function(columnNumber) {
    let res = '';
    while (columnNumber > 0) {
        columnNumber--;
        res = String.fromCharCode(65 + columnNumber % 26) + res;
        columnNumber = Math.floor(columnNumber / 26);
    }
    return res;
};
$JS$,
$JAVA$class Solution {
    public String convertToTitle(int columnNumber) {
        StringBuilder sb = new StringBuilder();
        while (columnNumber > 0) {
            columnNumber--;
            sb.append((char)('A' + columnNumber % 26));
            columnNumber /= 26;
        }
        return sb.reverse().toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string convertToTitle(int columnNumber) {
        string res;
        while (columnNumber > 0) {
            columnNumber--;
            res += (char)('A' + columnNumber % 26);
            columnNumber /= 26;
        }
        reverse(res.begin(), res.end());
        return res;
    }
};
$CPP$,'O(log n)','O(log n)');

-- ============================================================
-- 4) zigzag-conversion (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('zigzag-conversion','strings','Zigzag Conversion','Medium',
$$<p>The string <code>"PAYPALISHIRING"</code> is written in a zigzag pattern on a given number of rows like this:</p><pre>P   A   H   N
A P L S I I G
Y   I   R</pre><p>And then read line by line: <code>"PAHNAPLSIIGYIR"</code>.</p><p>Write the code that will take a string and make this conversion given a number of rows.</p>$$,
'',ARRAY[
  'Create an array of strings, one per row. Walk through the input and place each character in the correct row.',
  'Use a variable to track the current row and a direction flag to know whether you are going down or up.',
  'Reverse direction when you reach row 0 or row numRows - 1.'
],'400','https://leetcode.com/problems/zigzag-conversion/',
'convert','[{"name":"s","type":"str"},{"name":"numRows","type":"int"}]'::jsonb,'str',
'[
  {"inputs":["\"PAYPALISHIRING\"","3"],"expected":"\"PAHNAPLSIIGYIR\""},
  {"inputs":["\"PAYPALISHIRING\"","4"],"expected":"\"PINALSIGYAHRPI\""},
  {"inputs":["\"A\"","1"],"expected":"\"A\""},
  {"inputs":["\"AB\"","1"],"expected":"\"AB\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('zigzag-conversion','python',
$PY$class Solution:
    def convert(self, s: str, numRows: int) -> str:
        $PY$),
('zigzag-conversion','javascript',
$JS$/**
 * @param {string} s
 * @param {number} numRows
 * @return {string}
 */
var convert = function(s, numRows) {

};$JS$),
('zigzag-conversion','java',
$JAVA$class Solution {
    public String convert(String s, int numRows) {

    }
}$JAVA$),
('zigzag-conversion','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string convert(string s, int numRows) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('zigzag-conversion',1,'Row Buckets',
'We simulate the zigzag by distributing characters into row buckets. We walk down from row 0 to numRows-1, then bounce back up to row 0, and repeat. Finally we concatenate all buckets.',
$ALGO$["If numRows is 1 or >= len(s), return s directly.","Create numRows empty strings (buckets).","Iterate through s with a current row pointer and a step direction (down = 1, up = -1).","Append each character to its row bucket. Reverse direction at row 0 and row numRows - 1.","Concatenate all buckets and return."]$ALGO$::jsonb,
$PY$class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        rows = [''] * numRows
        cur, step = 0, 1
        for ch in s:
            rows[cur] += ch
            if cur == 0:
                step = 1
            elif cur == numRows - 1:
                step = -1
            cur += step
        return ''.join(rows)
$PY$,
$JS$var convert = function(s, numRows) {
    if (numRows === 1 || numRows >= s.length) return s;
    const rows = new Array(numRows).fill('');
    let cur = 0, step = 1;
    for (const ch of s) {
        rows[cur] += ch;
        if (cur === 0) step = 1;
        else if (cur === numRows - 1) step = -1;
        cur += step;
    }
    return rows.join('');
};
$JS$,
$JAVA$class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) return s;
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();
        int cur = 0, step = 1;
        for (char ch : s.toCharArray()) {
            rows[cur].append(ch);
            if (cur == 0) step = 1;
            else if (cur == numRows - 1) step = -1;
            cur += step;
        }
        StringBuilder res = new StringBuilder();
        for (StringBuilder row : rows) res.append(row);
        return res.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= (int)s.size()) return s;
        vector<string> rows(numRows);
        int cur = 0, step = 1;
        for (char ch : s) {
            rows[cur] += ch;
            if (cur == 0) step = 1;
            else if (cur == numRows - 1) step = -1;
            cur += step;
        }
        string res;
        for (auto& r : rows) res += r;
        return res;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 5) string-compression (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('string-compression','strings','String Compression','Medium',
$$<p>Given an array of characters <code>chars</code>, compress it using the following algorithm:</p><p>Begin with an empty string <code>s</code>. For each group of consecutive repeating characters in <code>chars</code>:</p><ul><li>If the group length is 1, append the character to <code>s</code>.</li><li>Otherwise, append the character followed by the group length.</li></ul><p>Return the length of the compressed string. Note: group lengths of 10 or longer will be split into multiple characters in <code>chars</code>.</p>$$,
'',ARRAY[
  'Use two pointers: one read pointer and one write pointer.',
  'For each group of consecutive equal characters, write the character and then the count digits if count > 1.',
  'Return the write pointer position as the new length.'
],'400','https://leetcode.com/problems/string-compression/',
'compress','[{"name":"chars","type":"List[str]"}]'::jsonb,'int',
'[
  {"inputs":["[\"a\",\"a\",\"b\",\"b\",\"c\",\"c\",\"c\"]"],"expected":"6"},
  {"inputs":["[\"a\"]"],"expected":"1"},
  {"inputs":["[\"a\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\"]"],"expected":"4"},
  {"inputs":["[\"a\",\"a\",\"a\",\"a\",\"a\",\"a\",\"a\",\"a\",\"a\",\"a\"]"],"expected":"3"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('string-compression','python',
$PY$class Solution:
    def compress(self, chars: List[str]) -> int:
        $PY$),
('string-compression','javascript',
$JS$/**
 * @param {character[]} chars
 * @return {number}
 */
var compress = function(chars) {

};$JS$),
('string-compression','java',
$JAVA$class Solution {
    public int compress(char[] chars) {

    }
}$JAVA$),
('string-compression','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compress(vector<char>& chars) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('string-compression',1,'Two Pointers In-Place',
'We scan through groups of consecutive equal characters. For each group, we write the character and then each digit of the count (if count > 1) at the write pointer. This compresses in-place using O(1) extra space.',
$ALGO$["Initialise read pointer i = 0 and write pointer w = 0.","While i < n, record the current character and count consecutive occurrences.","Write the character at position w and increment w.","If count > 1, convert count to a string and write each digit.","Return w."]$ALGO$::jsonb,
$PY$class Solution:
    def compress(self, chars: List[str]) -> int:
        i, w = 0, 0
        while i < len(chars):
            ch = chars[i]
            count = 0
            while i < len(chars) and chars[i] == ch:
                i += 1
                count += 1
            chars[w] = ch
            w += 1
            if count > 1:
                for digit in str(count):
                    chars[w] = digit
                    w += 1
        return w
$PY$,
$JS$var compress = function(chars) {
    let i = 0, w = 0;
    while (i < chars.length) {
        const ch = chars[i];
        let count = 0;
        while (i < chars.length && chars[i] === ch) { i++; count++; }
        chars[w++] = ch;
        if (count > 1) {
            for (const d of String(count)) chars[w++] = d;
        }
    }
    return w;
};
$JS$,
$JAVA$class Solution {
    public int compress(char[] chars) {
        int i = 0, w = 0;
        while (i < chars.length) {
            char ch = chars[i];
            int count = 0;
            while (i < chars.length && chars[i] == ch) { i++; count++; }
            chars[w++] = ch;
            if (count > 1) {
                for (char d : String.valueOf(count).toCharArray()) {
                    chars[w++] = d;
                }
            }
        }
        return w;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int compress(vector<char>& chars) {
        int i = 0, w = 0;
        while (i < (int)chars.size()) {
            char ch = chars[i];
            int count = 0;
            while (i < (int)chars.size() && chars[i] == ch) { i++; count++; }
            chars[w++] = ch;
            if (count > 1) {
                string s = to_string(count);
                for (char d : s) chars[w++] = d;
            }
        }
        return w;
    }
};
$CPP$,'O(n)','O(1)');

-- ============================================================
-- 6) longest-repeating-character-replacement (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('longest-repeating-character-replacement','strings','Longest Repeating Character Replacement','Medium',
$$<p>You are given a string <code>s</code> and an integer <code>k</code>. You can choose any character of the string and change it to any other uppercase English letter. You can perform this operation at most <code>k</code> times.</p><p>Return the length of the longest substring containing the same letter you can get after performing the above operations.</p>$$,
'',ARRAY[
  'Use a sliding window. Keep a frequency map of characters in the current window.',
  'The key insight: window_length - max_frequency <= k means the window is valid (we can change the rest to match the most frequent character).',
  'When the window becomes invalid, shrink from the left.'
],'400','https://leetcode.com/problems/longest-repeating-character-replacement/',
'characterReplacement','[{"name":"s","type":"str"},{"name":"k","type":"int"}]'::jsonb,'int',
'[
  {"inputs":["\"ABAB\"","2"],"expected":"4"},
  {"inputs":["\"AABABBA\"","1"],"expected":"4"},
  {"inputs":["\"AAAA\"","0"],"expected":"4"},
  {"inputs":["\"ABCDE\"","1"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('longest-repeating-character-replacement','python',
$PY$class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        $PY$),
('longest-repeating-character-replacement','javascript',
$JS$/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var characterReplacement = function(s, k) {

};$JS$),
('longest-repeating-character-replacement','java',
$JAVA$class Solution {
    public int characterReplacement(String s, int k) {

    }
}$JAVA$),
('longest-repeating-character-replacement','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int characterReplacement(string s, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('longest-repeating-character-replacement',1,'Sliding Window',
'Maintain a window where the number of characters that need changing (window size minus the count of the most frequent character in the window) is at most k. We never need to shrink maxFreq because a smaller maxFreq cannot produce a longer valid window.',
$ALGO$["Initialise left = 0, maxFreq = 0, result = 0, and a frequency array of size 26.","Expand right pointer from 0 to n-1. Increment freq of s[right]. Update maxFreq = max(maxFreq, freq[s[right]]).","If (right - left + 1) - maxFreq > k, decrement freq of s[left] and increment left.","Update result = max(result, right - left + 1).","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        freq = {}
        left = 0
        max_freq = 0
        res = 0
        for right in range(len(s)):
            freq[s[right]] = freq.get(s[right], 0) + 1
            max_freq = max(max_freq, freq[s[right]])
            if (right - left + 1) - max_freq > k:
                freq[s[left]] -= 1
                left += 1
            res = max(res, right - left + 1)
        return res
$PY$,
$JS$var characterReplacement = function(s, k) {
    const freq = new Array(26).fill(0);
    let left = 0, maxFreq = 0, res = 0;
    for (let right = 0; right < s.length; right++) {
        freq[s.charCodeAt(right) - 65]++;
        maxFreq = Math.max(maxFreq, freq[s.charCodeAt(right) - 65]);
        if ((right - left + 1) - maxFreq > k) {
            freq[s.charCodeAt(left) - 65]--;
            left++;
        }
        res = Math.max(res, right - left + 1);
    }
    return res;
};
$JS$,
$JAVA$class Solution {
    public int characterReplacement(String s, int k) {
        int[] freq = new int[26];
        int left = 0, maxFreq = 0, res = 0;
        for (int right = 0; right < s.length(); right++) {
            freq[s.charAt(right) - 'A']++;
            maxFreq = Math.max(maxFreq, freq[s.charAt(right) - 'A']);
            if ((right - left + 1) - maxFreq > k) {
                freq[s.charAt(left) - 'A']--;
                left++;
            }
            res = Math.max(res, right - left + 1);
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int characterReplacement(string s, int k) {
        int freq[26] = {0};
        int left = 0, maxFreq = 0, res = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            freq[s[right] - 'A']++;
            maxFreq = max(maxFreq, freq[s[right] - 'A']);
            if ((right - left + 1) - maxFreq > k) {
                freq[s[left] - 'A']--;
                left++;
            }
            res = max(res, right - left + 1);
        }
        return res;
    }
};
$CPP$,'O(n)','O(1)');

-- ============================================================
-- 7) compare-version-numbers (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('compare-version-numbers','strings','Compare Version Numbers','Medium',
$$<p>Given two version numbers, <code>version1</code> and <code>version2</code>, compare them.</p><p>Version numbers consist of one or more revisions joined by a dot <code>.</code>. Each revision is treated as an integer and compared left to right. Leading zeroes in each revision should be ignored.</p><p>Return <code>-1</code> if version1 < version2, <code>1</code> if version1 > version2, and <code>0</code> if they are equal. If one version has fewer revisions, treat the missing revisions as <code>0</code>.</p>$$,
'',ARRAY[
  'Split both version strings by the dot character.',
  'Compare corresponding revision integers. If one version has fewer parts, treat missing parts as 0.',
  'Return -1, 0, or 1 based on the first differing revision.'
],'400','https://leetcode.com/problems/compare-version-numbers/',
'compareVersion','[{"name":"version1","type":"str"},{"name":"version2","type":"str"}]'::jsonb,'int',
'[
  {"inputs":["\"1.2\"","\"1.10\""],"expected":"-1"},
  {"inputs":["\"1.01\"","\"1.001\""],"expected":"0"},
  {"inputs":["\"1.0\"","\"1.0.0.0\""],"expected":"0"},
  {"inputs":["\"0.1\"","\"1.1\""],"expected":"-1"},
  {"inputs":["\"1.0.1\"","\"1\""],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('compare-version-numbers','python',
$PY$class Solution:
    def compareVersion(self, version1: str, version2: str) -> int:
        $PY$),
('compare-version-numbers','javascript',
$JS$/**
 * @param {string} version1
 * @param {string} version2
 * @return {number}
 */
var compareVersion = function(version1, version2) {

};$JS$),
('compare-version-numbers','java',
$JAVA$class Solution {
    public int compareVersion(String version1, String version2) {

    }
}$JAVA$),
('compare-version-numbers','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compareVersion(string version1, string version2) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('compare-version-numbers',1,'Split and Compare',
'Split both version strings by dot, convert each part to an integer (which naturally strips leading zeros), and compare part by part. Missing parts are treated as 0.',
$ALGO$["Split version1 and version2 by the dot character.","Determine the maximum length of the two split arrays.","For each index i up to that maximum, get the integer value from each version (default 0 if past the end).","If v1 part > v2 part return 1. If v1 part < v2 part return -1.","If all parts are equal, return 0."]$ALGO$::jsonb,
$PY$class Solution:
    def compareVersion(self, version1: str, version2: str) -> int:
        v1 = version1.split('.')
        v2 = version2.split('.')
        n = max(len(v1), len(v2))
        for i in range(n):
            a = int(v1[i]) if i < len(v1) else 0
            b = int(v2[i]) if i < len(v2) else 0
            if a > b:
                return 1
            if a < b:
                return -1
        return 0
$PY$,
$JS$var compareVersion = function(version1, version2) {
    const v1 = version1.split('.');
    const v2 = version2.split('.');
    const n = Math.max(v1.length, v2.length);
    for (let i = 0; i < n; i++) {
        const a = i < v1.length ? parseInt(v1[i]) : 0;
        const b = i < v2.length ? parseInt(v2[i]) : 0;
        if (a > b) return 1;
        if (a < b) return -1;
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public int compareVersion(String version1, String version2) {
        String[] v1 = version1.split("\\.");
        String[] v2 = version2.split("\\.");
        int n = Math.max(v1.length, v2.length);
        for (int i = 0; i < n; i++) {
            int a = i < v1.length ? Integer.parseInt(v1[i]) : 0;
            int b = i < v2.length ? Integer.parseInt(v2[i]) : 0;
            if (a > b) return 1;
            if (a < b) return -1;
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int compareVersion(string version1, string version2) {
        istringstream s1(version1), s2(version2);
        string t1, t2;
        while (s1.good() || s2.good()) {
            getline(s1, t1, '.');
            getline(s2, t2, '.');
            int a = t1.empty() ? 0 : stoi(t1);
            int b = t2.empty() ? 0 : stoi(t2);
            if (a > b) return 1;
            if (a < b) return -1;
            t1.clear();
            t2.clear();
        }
        return 0;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 8) text-justification (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('text-justification','strings','Text Justification','Hard',
$$<p>Given an array of strings <code>words</code> and a width <code>maxWidth</code>, format the text such that each line has exactly <code>maxWidth</code> characters and is fully (left and right) justified.</p><p>Pack as many words as you can in each line. Pad extra spaces between words to ensure each line has <code>maxWidth</code> characters.</p><p>Extra spaces between words should be distributed as evenly as possible. If the number of spaces on a line does not divide evenly, the left slots get one more space than the right slots.</p><p>The last line should be left-justified with no extra space inserted between words.</p>$$,
'',ARRAY[
  'Greedily pack as many words as possible into each line.',
  'For non-last lines, distribute spaces evenly. Use integer division for base spaces and modulo for extra spaces on the left.',
  'For the last line and single-word lines, left-justify and pad with trailing spaces.'
],'400','https://leetcode.com/problems/text-justification/',
'fullJustify','[{"name":"words","type":"List[str]"},{"name":"maxWidth","type":"int"}]'::jsonb,'List[str]',
'[
  {"inputs":["[\"This\",\"is\",\"an\",\"example\",\"of\",\"text\",\"justification.\"]","16"],"expected":"[\"This    is    an\",\"example  of text\",\"justification.  \"]"},
  {"inputs":["[\"What\",\"must\",\"be\",\"acknowledgment\",\"shall\",\"be\"]","16"],"expected":"[\"What   must   be\",\"acknowledgment  \",\"shall be        \"]"},
  {"inputs":["[\"Science\",\"is\",\"what\",\"we\",\"understand\",\"well\",\"enough\",\"to\",\"explain\",\"to\",\"a\",\"computer.\",\"Art\",\"is\",\"everything\",\"else\",\"we\",\"do\"]","20"],"expected":"[\"Science  is  what we\",\"understand      well\",\"enough to explain to\",\"a  computer.  Art is\",\"everything  else  we\",\"do                  \"]"},
  {"inputs":["[\"a\"]","1"],"expected":"[\"a\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('text-justification','python',
$PY$class Solution:
    def fullJustify(self, words: List[str], maxWidth: int) -> List[str]:
        $PY$),
('text-justification','javascript',
$JS$/**
 * @param {string[]} words
 * @param {number} maxWidth
 * @return {string[]}
 */
var fullJustify = function(words, maxWidth) {

};$JS$),
('text-justification','java',
$JAVA$class Solution {
    public List<String> fullJustify(String[] words, int maxWidth) {

    }
}$JAVA$),
('text-justification','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> fullJustify(vector<string>& words, int maxWidth) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('text-justification',1,'Greedy Line Packing',
'Pack words greedily into lines. For each line (except the last), distribute extra spaces evenly across the gaps between words, with leftmost gaps getting one more space if it does not divide evenly. The last line is simply left-justified.',
$ALGO$["Initialise an index i = 0 and a result list.","While i < len(words), greedily pick words for the current line until adding the next word would exceed maxWidth.","If this is the last line or contains only one word, left-justify: join words with a single space and pad the right with spaces.","Otherwise, compute total spaces needed, divide evenly among gaps, and distribute the remainder one extra space to the leftmost gaps.","Append the line to the result and continue."]$ALGO$::jsonb,
$PY$class Solution:
    def fullJustify(self, words: List[str], maxWidth: int) -> List[str]:
        res = []
        i = 0
        while i < len(words):
            j = i
            line_len = 0
            while j < len(words) and line_len + len(words[j]) + (j - i) <= maxWidth:
                line_len += len(words[j])
                j += 1
            gaps = j - i - 1
            if j == len(words) or gaps == 0:
                line = ' '.join(words[i:j])
                line += ' ' * (maxWidth - len(line))
            else:
                total_spaces = maxWidth - line_len
                base = total_spaces // gaps
                extra = total_spaces % gaps
                line = ''
                for k in range(i, j):
                    line += words[k]
                    if k < j - 1:
                        line += ' ' * (base + (1 if k - i < extra else 0))
            res.append(line)
            i = j
        return res
$PY$,
$JS$var fullJustify = function(words, maxWidth) {
    const res = [];
    let i = 0;
    while (i < words.length) {
        let j = i, lineLen = 0;
        while (j < words.length && lineLen + words[j].length + (j - i) <= maxWidth) {
            lineLen += words[j].length;
            j++;
        }
        const gaps = j - i - 1;
        let line = '';
        if (j === words.length || gaps === 0) {
            line = words.slice(i, j).join(' ');
            line += ' '.repeat(maxWidth - line.length);
        } else {
            const totalSpaces = maxWidth - lineLen;
            const base = Math.floor(totalSpaces / gaps);
            const extra = totalSpaces % gaps;
            for (let k = i; k < j; k++) {
                line += words[k];
                if (k < j - 1) line += ' '.repeat(base + (k - i < extra ? 1 : 0));
            }
        }
        res.push(line);
        i = j;
    }
    return res;
};
$JS$,
$JAVA$class Solution {
    public List<String> fullJustify(String[] words, int maxWidth) {
        List<String> res = new ArrayList<>();
        int i = 0;
        while (i < words.length) {
            int j = i, lineLen = 0;
            while (j < words.length && lineLen + words[j].length() + (j - i) <= maxWidth) {
                lineLen += words[j].length();
                j++;
            }
            int gaps = j - i - 1;
            StringBuilder line = new StringBuilder();
            if (j == words.length || gaps == 0) {
                for (int k = i; k < j; k++) {
                    if (k > i) line.append(' ');
                    line.append(words[k]);
                }
                while (line.length() < maxWidth) line.append(' ');
            } else {
                int totalSpaces = maxWidth - lineLen;
                int base = totalSpaces / gaps;
                int extra = totalSpaces % gaps;
                for (int k = i; k < j; k++) {
                    line.append(words[k]);
                    if (k < j - 1) {
                        int spaces = base + (k - i < extra ? 1 : 0);
                        for (int s = 0; s < spaces; s++) line.append(' ');
                    }
                }
            }
            res.add(line.toString());
            i = j;
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> fullJustify(vector<string>& words, int maxWidth) {
        vector<string> res;
        int i = 0;
        while (i < (int)words.size()) {
            int j = i, lineLen = 0;
            while (j < (int)words.size() && lineLen + (int)words[j].size() + (j - i) <= maxWidth) {
                lineLen += words[j].size();
                j++;
            }
            int gaps = j - i - 1;
            string line;
            if (j == (int)words.size() || gaps == 0) {
                for (int k = i; k < j; k++) {
                    if (k > i) line += ' ';
                    line += words[k];
                }
                line += string(maxWidth - line.size(), ' ');
            } else {
                int totalSpaces = maxWidth - lineLen;
                int base = totalSpaces / gaps;
                int extra = totalSpaces % gaps;
                for (int k = i; k < j; k++) {
                    line += words[k];
                    if (k < j - 1) {
                        int spaces = base + (k - i < extra ? 1 : 0);
                        line += string(spaces, ' ');
                    }
                }
            }
            res.push_back(line);
            i = j;
        }
        return res;
    }
};
$CPP$,'O(n)','O(n)');

COMMIT;
