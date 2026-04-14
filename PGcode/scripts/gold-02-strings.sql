-- Gold upgrade: strings (9 problems). Updates description + hints only.
BEGIN;

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a string <code>s</code> consisting of words and spaces, return the length of the <strong>last</strong> word in the string. A word is a maximal substring consisting of non-space characters only.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "Hello World"
Output: 5
Explanation: The last word is "World" with length 5.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "   fly me   to   the moon  "
Output: 4
Explanation: The last word is "moon" with length 4.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>4</sup></code></li>
  <li><code>s</code> consists of only English letters and spaces.</li>
  <li>There will be at least one word in <code>s</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Walk from the right end of the string and skip any trailing spaces first.',
    'Then count characters until you hit a space or the start of the string — that count is your answer.',
    'No need to split or allocate substrings; a single right-to-left scan is O(n) time and O(1) extra space.'
  ]
WHERE id = 'length-of-last-word';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string <code>""</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  strs = ["flower","flow","flight"]
Output: "fl"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= strs.length &lt;= 200</code></li>
  <li><code>0 &lt;= strs[i].length &lt;= 200</code></li>
  <li><code>strs[i]</code> consists of only lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Compare strings column-by-column: at index i, every string must agree on the same character.',
    'Stop the moment any string ends or a character mismatches — return the prefix accumulated so far.',
    'Alternative: take strs[0] as the answer and shrink it against each subsequent string until it is a prefix of that string.'
  ]
WHERE id = 'longest-common-prefix';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Roman numerals are represented by seven different symbols: <code>I</code>, <code>V</code>, <code>X</code>, <code>L</code>, <code>C</code>, <code>D</code>, and <code>M</code> (1, 5, 10, 50, 100, 500, 1000). Given a roman numeral, convert it to an integer.</p>
<p>The general rule is to add symbol values, but when a smaller value comes <em>before</em> a larger value, subtract it instead (e.g., <code>IV</code> = 4, <code>IX</code> = 9, <code>XL</code> = 40).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "III"
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "MCMXCIV"
Output: 1994
Explanation: M = 1000, CM = 900, XC = 90, IV = 4.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 15</code></li>
  <li><code>s</code> contains only the characters <code>('I', 'V', 'X', 'L', 'C', 'D', 'M')</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Build a map from each Roman symbol to its integer value.',
    'Walk left to right: if the current symbol is smaller than the next one, subtract it; otherwise add it.',
    'Equivalent trick: add every value, then subtract twice the value of any symbol that is smaller than its right neighbor.'
  ]
WHERE id = 'roman-to-integer';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>needle</code> and <code>haystack</code>, return the index of the first occurrence of <code>needle</code> in <code>haystack</code>, or <code>-1</code> if <code>needle</code> is not part of <code>haystack</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  haystack = "sadbutsad", needle = "sad"
Output: 0
Explanation: "sad" occurs at index 0 and 6. The first occurrence is at index 0.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  haystack = "leetcode", needle = "leeto"
Output: -1
Explanation: "leeto" did not occur in "leetcode".</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= haystack.length, needle.length &lt;= 10<sup>4</sup></code></li>
  <li><code>haystack</code> and <code>needle</code> consist of only lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Brute force: try every starting index i in haystack and compare haystack[i:i+len(needle)] to needle.',
    'Stop the inner comparison at the first mismatch — no need to compare the rest.',
    'For an O(n+m) optimal solution look up the KMP failure-function approach; brute force is fast enough for the given constraints.'
  ]
WHERE id = 'find-needle-haystack';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an input string <code>s</code>, reverse the order of the <strong>words</strong>. A word is a sequence of non-space characters. Words are separated by at least one space.</p>
<p>Return a string of the words in reverse order concatenated by a <strong>single space</strong>. The returned string should not contain any leading or trailing spaces.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "the sky is blue"
Output: "blue is sky the"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "  hello world  "
Output: "world hello"
Explanation: Your reversed string should not contain leading or trailing spaces.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>4</sup></code></li>
  <li><code>s</code> contains English letters, digits, and spaces.</li>
  <li>There is at least one word in <code>s</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'The simplest approach: split on whitespace (which collapses runs of spaces and trims), reverse the list, join with one space.',
    'In-place trick: reverse the entire string, then reverse each word individually back to its original orientation.',
    'Watch the edge cases: leading spaces, trailing spaces, multiple spaces between words.'
  ]
WHERE id = 'reverse-words-in-string';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a string <code>s</code>, return the <strong>number</strong> of palindromic substrings in it. A string is a palindrome when it reads the same backward as forward. A substring is a contiguous sequence of characters within the string.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "abc"
Output: 3
Explanation: Three palindromic strings: "a", "b", "c".</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "aaa"
Output: 6
Explanation: Six palindromic strings: "a","a","a","aa","aa","aaa".</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 1000</code></li>
  <li><code>s</code> consists of lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Every palindrome has a center. There are 2n - 1 centers: n single characters (odd-length) and n - 1 between-character gaps (even-length).',
    'For each center, expand two pointers outward while characters match — increment your counter for each successful expansion.',
    'Total work is O(n^2) which is fine for n <= 1000. DP works too but uses O(n^2) extra space.'
  ]
WHERE id = 'palindromic-substrings';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Implement the <code>myAtoi(string s)</code> function which converts a string to a 32-bit signed integer (similar to C/C++''s <code>atoi</code>).</p>
<p>The algorithm is: skip leading whitespace, read an optional <code>+</code> or <code>-</code> sign, read digits until a non-digit or end of string, ignore trailing characters, and clamp the result to the 32-bit signed integer range <code>[-2<sup>31</sup>, 2<sup>31</sup> - 1]</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "42"
Output: 42</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "   -42"
Output: -42</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= s.length &lt;= 200</code></li>
  <li><code>s</code> consists of English letters (lower-case and upper-case), digits (0-9), <code>' '</code>, <code>'+'</code>, <code>'-'</code>, and <code>'.'</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Process the string in four phases in this exact order: skip whitespace, read optional sign, read digits, stop at first non-digit.',
    'Build the result digit by digit (result = result * 10 + digit). Do not call int(...) on the entire substring — it doesn''t handle the clamp.',
    'Clamp to INT32_MAX (2^31 - 1) or INT32_MIN (-2^31) before returning. The clamp should happen as soon as you detect overflow, not after.'
  ]
WHERE id = 'string-to-integer-atoi';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two binary strings <code>a</code> and <code>b</code>, return their sum as a binary string.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  a = "11", b = "1"
Output: "100"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  a = "1010", b = "1011"
Output: "10101"</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= a.length, b.length &lt;= 10<sup>4</sup></code></li>
  <li><code>a</code> and <code>b</code> consist only of <code>'0'</code> or <code>'1'</code> characters.</li>
  <li>Each string does not contain leading zeros except for the zero itself.</li>
</ul>
$$,
  hints = ARRAY[
    'Walk both strings from the rightmost (least-significant) digit toward the left, like elementary school addition.',
    'Track a single carry bit. At each position, sum = a_digit + b_digit + carry; output bit is sum % 2 and new carry is sum // 2.',
    'Don''t forget to append a final 1 if a carry remains after the longest input is exhausted, then reverse the collected bits.'
  ]
WHERE id = 'add-binary';

UPDATE public."PGcode_problems" SET
  description = $$
<p>The <strong>count-and-say</strong> sequence is a sequence of digit strings defined recursively:</p>
<ul>
  <li><code>countAndSay(1) = "1"</code></li>
  <li><code>countAndSay(n)</code> is the way you would "count" the digit string of <code>countAndSay(n - 1)</code>, then convert that count into a digit string.</li>
</ul>
<p>To "count" a string, replace each contiguous run of the same digit with its run length followed by the digit. For example, <code>"3322251"</code> becomes <code>"23 32 25 11"</code> &rarr; <code>"23322511"</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 1
Output: "1"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 4
Output: "1211"
Explanation:
countAndSay(1) = "1"
countAndSay(2) = "11"   (one 1)
countAndSay(3) = "21"   (two 1s)
countAndSay(4) = "1211" (one 2, one 1)</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= n &lt;= 30</code></li>
</ul>
$$,
  hints = ARRAY[
    'Iteratively build term i+1 from term i — no need for recursion, since you only need the previous term.',
    'To "count and say" a term, scan it left to right and group runs of identical digits using two pointers.',
    'For each run, append the run length and then the digit. The result becomes the next term.'
  ]
WHERE id = 'count-and-say';

COMMIT;

SELECT id, position('Example' in description) > 0 AS ex, array_length(hints,1) AS h, LENGTH(description) AS dlen
FROM public."PGcode_problems"
WHERE topic_id='strings'
ORDER BY id;
