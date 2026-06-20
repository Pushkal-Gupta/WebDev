-- ============================================================
-- PILOT: Real problems for "strings" and "two-pointers" topics
-- ------------------------------------------------------------
-- Shape mirrors scripts/seed_300_500.sql + scripts/add_problem_metadata.sql.
-- After this file is applied, run scripts/delete_placeholders.sql first
-- to ensure no placeholder rows collide with these IDs.
--
-- Tables touched:
--   PGcode_problems         (INSERT problem rows, then UPDATE with test_cases)
--   PGcode_problem_templates (INSERT python/javascript/java starters)
-- ============================================================

-- ------------------------------------------------------------
-- 1) Problem rows (id, topic_id, name, difficulty, description,
--    solution_video_url, hints, roadmap_set, leetcode_url)
-- ------------------------------------------------------------
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url)
VALUES
-- ===== Strings (10 new) =====
('length-of-last-word', 'strings', 'Length of Last Word', 'Easy',
 '<p>Given a string <code>s</code> consisting of words and spaces, return the length of the <strong>last</strong> word in the string.</p>',
 '3OamzN90kPg',
 ARRAY['Scan from the right, skip trailing spaces first', 'Count characters until the next space'],
 '200', 'https://leetcode.com/problems/length-of-last-word/'),

('longest-common-prefix', 'strings', 'Longest Common Prefix', 'Easy',
 '<p>Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string <code>""</code>.</p>',
 '0sWShKIJoo4',
 ARRAY['Compare characters column by column', 'Stop when any string differs or ends'],
 '200', 'https://leetcode.com/problems/longest-common-prefix/'),

('roman-to-integer', 'strings', 'Roman to Integer', 'Easy',
 '<p>Convert a Roman numeral to an integer. Subtract the current value if it is smaller than the next one, otherwise add it.</p>',
 '3jdxYj3DD98',
 ARRAY['Map each symbol to its value', 'If current < next, subtract; else add'],
 '200', 'https://leetcode.com/problems/roman-to-integer/'),

('find-needle-haystack', 'strings', 'Find the Index of the First Occurrence in a String', 'Easy',
 '<p>Given two strings <code>needle</code> and <code>haystack</code>, return the index of the first occurrence of <code>needle</code> in <code>haystack</code>, or <code>-1</code> if not found.</p>',
 'SuSfMdbvowM',
 ARRAY['Slide a window of length len(needle) across haystack'],
 '200', 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/'),

('reverse-words-in-string', 'strings', 'Reverse Words in a String', 'Medium',
 '<p>Given an input string <code>s</code>, reverse the order of the <strong>words</strong>. Words are separated by at least one space. The returned string should have only a single space between words and no leading/trailing spaces.</p>',
 '3OamzN90kPg',
 ARRAY['Split on whitespace, filter empties, reverse, join with single space'],
 '200', 'https://leetcode.com/problems/reverse-words-in-a-string/'),

('longest-palindromic-substring', 'strings', 'Longest Palindromic Substring', 'Medium',
 '<p>Given a string <code>s</code>, return the longest palindromic substring in <code>s</code>.</p>',
 'XYQecbcd6_c',
 ARRAY['Expand around each center (odd and even length palindromes)', 'Track the best seen so far'],
 '200', 'https://leetcode.com/problems/longest-palindromic-substring/'),

('palindromic-substrings', 'strings', 'Palindromic Substrings', 'Medium',
 '<p>Given a string, return the <strong>number</strong> of palindromic substrings in it. A substring is palindromic if it reads the same forward and backward.</p>',
 '4RACzI5-du8',
 ARRAY['Expand around center for every index', 'Count each palindrome you extend'],
 '200', 'https://leetcode.com/problems/palindromic-substrings/'),

('string-to-integer-atoi', 'strings', 'String to Integer (atoi)', 'Medium',
 '<p>Implement the <code>myAtoi(string s)</code> function which converts a string to a 32-bit signed integer following the atoi rules: skip leading whitespace, read optional sign, read digits, clamp to the 32-bit range.</p>',
 '3OamzN90kPg',
 ARRAY['Handle whitespace, sign, digits, overflow clamp to INT32 range in that order'],
 '200', 'https://leetcode.com/problems/string-to-integer-atoi/'),

('add-binary', 'strings', 'Add Binary', 'Easy',
 '<p>Given two binary strings <code>a</code> and <code>b</code>, return their sum as a binary string.</p>',
 '6kU8X8BeUZs',
 ARRAY['Add digit by digit from the right with carry, like elementary school addition'],
 '200', 'https://leetcode.com/problems/add-binary/'),

('count-and-say', 'strings', 'Count and Say', 'Medium',
 '<p>The count-and-say sequence is defined recursively. Given <code>n</code>, return the <code>n</code>-th term. Each term describes the previous one by counting runs of identical digits.</p>',
 '3OamzN90kPg',
 ARRAY['Iteratively build term i+1 from term i', 'Use a run-length scan of the previous term'],
 '200', 'https://leetcode.com/problems/count-and-say/'),

-- ===== Two-pointers (5 new) =====
('remove-duplicates-sorted', 'two-pointers', 'Remove Duplicates from Sorted Array', 'Easy',
 '<p>Given a sorted array <code>nums</code>, remove duplicates <strong>in-place</strong> so each element appears only once. Return the modified array (the unique prefix).</p>',
 'DEJAZBq0FDA',
 ARRAY['Slow pointer tracks the write position, fast pointer scans', 'Write only when nums[fast] != nums[slow]'],
 '200', 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/'),

('move-zeroes', 'two-pointers', 'Move Zeroes', 'Easy',
 '<p>Given an integer array <code>nums</code>, move all <code>0</code>s to the end while maintaining the relative order of the non-zero elements.</p>',
 'aayNRwUN3Do',
 ARRAY['Slow pointer = write position for non-zeros', 'After scanning, fill the remainder with 0s'],
 '200', 'https://leetcode.com/problems/move-zeroes/'),

('sort-colors', 'two-pointers', 'Sort Colors', 'Medium',
 '<p>Given an array <code>nums</code> with <code>n</code> objects colored red (0), white (1), or blue (2), sort them in-place so the same colors are adjacent in the order red, white, blue.</p>',
 '4xbWSRZHqac',
 ARRAY['Dutch national flag with three pointers: low, mid, high', 'Swap 0 to low, 2 to high, advance mid otherwise'],
 '200', 'https://leetcode.com/problems/sort-colors/'),

('squares-sorted-array', 'two-pointers', 'Squares of a Sorted Array', 'Easy',
 '<p>Given a sorted integer array <code>nums</code> (can be negative), return an array of the squares of each number sorted in non-decreasing order.</p>',
 'FPCZsG_AkUg',
 ARRAY['Two pointers from both ends', 'Compare absolute values, fill result from the end'],
 '200', 'https://leetcode.com/problems/squares-of-a-sorted-array/'),

('is-subsequence', 'two-pointers', 'Is Subsequence', 'Easy',
 '<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>s</code> is a subsequence of <code>t</code>.</p>',
 '99RVfqklbCE',
 ARRAY['Two pointers, advance in s only on match, always advance in t', 's is exhausted means true'],
 '200', 'https://leetcode.com/problems/is-subsequence/')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 2) Signatures + test cases (method_name, params, return_type, test_cases)
-- ------------------------------------------------------------

-- ===== Strings =====

UPDATE public."PGcode_problems" SET
  method_name = 'lengthOfLastWord',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"Hello World\""],"expected":"5"},
    {"inputs":["\"   fly me   to   the moon  \""],"expected":"4"},
    {"inputs":["\"luffy is still joyboy\""],"expected":"6"},
    {"inputs":["\"a\""],"expected":"1"}
  ]'::jsonb
WHERE id = 'length-of-last-word';

UPDATE public."PGcode_problems" SET
  method_name = 'longestCommonPrefix',
  params = '[{"name":"strs","type":"List[str]"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["[\"flower\",\"flow\",\"flight\"]"],"expected":"\"fl\""},
    {"inputs":["[\"dog\",\"racecar\",\"car\"]"],"expected":"\"\""},
    {"inputs":["[\"interspecies\",\"interstellar\",\"interstate\"]"],"expected":"\"inters\""},
    {"inputs":["[\"a\"]"],"expected":"\"a\""}
  ]'::jsonb
WHERE id = 'longest-common-prefix';

UPDATE public."PGcode_problems" SET
  method_name = 'romanToInt',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"III\""],"expected":"3"},
    {"inputs":["\"LVIII\""],"expected":"58"},
    {"inputs":["\"MCMXCIV\""],"expected":"1994"},
    {"inputs":["\"IV\""],"expected":"4"},
    {"inputs":["\"IX\""],"expected":"9"}
  ]'::jsonb
WHERE id = 'roman-to-integer';

UPDATE public."PGcode_problems" SET
  method_name = 'strStr',
  params = '[{"name":"haystack","type":"str"},{"name":"needle","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"sadbutsad\"","\"sad\""],"expected":"0"},
    {"inputs":["\"leetcode\"","\"leeto\""],"expected":"-1"},
    {"inputs":["\"hello\"","\"ll\""],"expected":"2"},
    {"inputs":["\"a\"","\"a\""],"expected":"0"}
  ]'::jsonb
WHERE id = 'find-needle-haystack';

UPDATE public."PGcode_problems" SET
  method_name = 'reverseWords',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["\"the sky is blue\""],"expected":"\"blue is sky the\""},
    {"inputs":["\"  hello world  \""],"expected":"\"world hello\""},
    {"inputs":["\"a good   example\""],"expected":"\"example good a\""}
  ]'::jsonb
WHERE id = 'reverse-words-in-string';

UPDATE public."PGcode_problems" SET
  method_name = 'longestPalindrome',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["\"babad\""],"expected":"\"bab\""},
    {"inputs":["\"cbbd\""],"expected":"\"bb\""},
    {"inputs":["\"a\""],"expected":"\"a\""},
    {"inputs":["\"ac\""],"expected":"\"a\""}
  ]'::jsonb
WHERE id = 'longest-palindromic-substring';

UPDATE public."PGcode_problems" SET
  method_name = 'countSubstrings',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"abc\""],"expected":"3"},
    {"inputs":["\"aaa\""],"expected":"6"},
    {"inputs":["\"aba\""],"expected":"4"}
  ]'::jsonb
WHERE id = 'palindromic-substrings';

UPDATE public."PGcode_problems" SET
  method_name = 'myAtoi',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["\"42\""],"expected":"42"},
    {"inputs":["\"   -42\""],"expected":"-42"},
    {"inputs":["\"4193 with words\""],"expected":"4193"},
    {"inputs":["\"words and 987\""],"expected":"0"},
    {"inputs":["\"-91283472332\""],"expected":"-2147483648"}
  ]'::jsonb
WHERE id = 'string-to-integer-atoi';

UPDATE public."PGcode_problems" SET
  method_name = 'addBinary',
  params = '[{"name":"a","type":"str"},{"name":"b","type":"str"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["\"11\"","\"1\""],"expected":"\"100\""},
    {"inputs":["\"1010\"","\"1011\""],"expected":"\"10101\""},
    {"inputs":["\"0\"","\"0\""],"expected":"\"0\""}
  ]'::jsonb
WHERE id = 'add-binary';

UPDATE public."PGcode_problems" SET
  method_name = 'countAndSay',
  params = '[{"name":"n","type":"int"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["1"],"expected":"\"1\""},
    {"inputs":["4"],"expected":"\"1211\""},
    {"inputs":["6"],"expected":"\"312211\""}
  ]'::jsonb
WHERE id = 'count-and-say';

-- ===== Two-pointers =====

UPDATE public."PGcode_problems" SET
  method_name = 'removeDuplicates',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[1,1,2]"],"expected":"2"},
    {"inputs":["[0,0,1,1,1,2,2,3,3,4]"],"expected":"5"},
    {"inputs":["[1]"],"expected":"1"}
  ]'::jsonb
WHERE id = 'remove-duplicates-sorted';

UPDATE public."PGcode_problems" SET
  method_name = 'moveZeroes',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[0,1,0,3,12]"],"expected":"[1,3,12,0,0]"},
    {"inputs":["[0]"],"expected":"[0]"},
    {"inputs":["[1,2,3]"],"expected":"[1,2,3]"},
    {"inputs":["[0,0,1]"],"expected":"[1,0,0]"}
  ]'::jsonb
WHERE id = 'move-zeroes';

UPDATE public."PGcode_problems" SET
  method_name = 'sortColors',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[2,0,2,1,1,0]"],"expected":"[0,0,1,1,2,2]"},
    {"inputs":["[2,0,1]"],"expected":"[0,1,2]"},
    {"inputs":["[0]"],"expected":"[0]"},
    {"inputs":["[1]"],"expected":"[1]"}
  ]'::jsonb
WHERE id = 'sort-colors';

UPDATE public."PGcode_problems" SET
  method_name = 'sortedSquares',
  params = '[{"name":"nums","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[-4,-1,0,3,10]"],"expected":"[0,1,9,16,100]"},
    {"inputs":["[-7,-3,2,3,11]"],"expected":"[4,9,9,49,121]"},
    {"inputs":["[1,2,3]"],"expected":"[1,4,9]"}
  ]'::jsonb
WHERE id = 'squares-sorted-array';

UPDATE public."PGcode_problems" SET
  method_name = 'isSubsequence',
  params = '[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,
  return_type = 'bool',
  test_cases = '[
    {"inputs":["\"abc\"","\"ahbgdc\""],"expected":"true"},
    {"inputs":["\"axc\"","\"ahbgdc\""],"expected":"false"},
    {"inputs":["\"\"","\"ahbgdc\""],"expected":"true"},
    {"inputs":["\"ace\"","\"abcde\""],"expected":"true"}
  ]'::jsonb
WHERE id = 'is-subsequence';


-- ------------------------------------------------------------
-- 3) Starter code templates (python / javascript / java)
-- ------------------------------------------------------------
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code)
VALUES
-- length-of-last-word
('length-of-last-word','python','class Solution:
    def lengthOfLastWord(self, s: str) -> int:
        pass'),
('length-of-last-word','javascript','var lengthOfLastWord = function(s) {

};'),
('length-of-last-word','java','class Solution {
    public int lengthOfLastWord(String s) {

    }
}'),

-- longest-common-prefix
('longest-common-prefix','python','class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        pass'),
('longest-common-prefix','javascript','var longestCommonPrefix = function(strs) {

};'),
('longest-common-prefix','java','class Solution {
    public String longestCommonPrefix(String[] strs) {

    }
}'),

-- roman-to-integer
('roman-to-integer','python','class Solution:
    def romanToInt(self, s: str) -> int:
        pass'),
('roman-to-integer','javascript','var romanToInt = function(s) {

};'),
('roman-to-integer','java','class Solution {
    public int romanToInt(String s) {

    }
}'),

-- find-needle-haystack
('find-needle-haystack','python','class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        pass'),
('find-needle-haystack','javascript','var strStr = function(haystack, needle) {

};'),
('find-needle-haystack','java','class Solution {
    public int strStr(String haystack, String needle) {

    }
}'),

-- reverse-words-in-string
('reverse-words-in-string','python','class Solution:
    def reverseWords(self, s: str) -> str:
        pass'),
('reverse-words-in-string','javascript','var reverseWords = function(s) {

};'),
('reverse-words-in-string','java','class Solution {
    public String reverseWords(String s) {

    }
}'),

-- longest-palindromic-substring
('longest-palindromic-substring','python','class Solution:
    def longestPalindrome(self, s: str) -> str:
        pass'),
('longest-palindromic-substring','javascript','var longestPalindrome = function(s) {

};'),
('longest-palindromic-substring','java','class Solution {
    public String longestPalindrome(String s) {

    }
}'),

-- palindromic-substrings
('palindromic-substrings','python','class Solution:
    def countSubstrings(self, s: str) -> int:
        pass'),
('palindromic-substrings','javascript','var countSubstrings = function(s) {

};'),
('palindromic-substrings','java','class Solution {
    public int countSubstrings(String s) {

    }
}'),

-- string-to-integer-atoi
('string-to-integer-atoi','python','class Solution:
    def myAtoi(self, s: str) -> int:
        pass'),
('string-to-integer-atoi','javascript','var myAtoi = function(s) {

};'),
('string-to-integer-atoi','java','class Solution {
    public int myAtoi(String s) {

    }
}'),

-- add-binary
('add-binary','python','class Solution:
    def addBinary(self, a: str, b: str) -> str:
        pass'),
('add-binary','javascript','var addBinary = function(a, b) {

};'),
('add-binary','java','class Solution {
    public String addBinary(String a, String b) {

    }
}'),

-- count-and-say
('count-and-say','python','class Solution:
    def countAndSay(self, n: int) -> str:
        pass'),
('count-and-say','javascript','var countAndSay = function(n) {

};'),
('count-and-say','java','class Solution {
    public String countAndSay(int n) {

    }
}'),

-- remove-duplicates-sorted
('remove-duplicates-sorted','python','class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        pass'),
('remove-duplicates-sorted','javascript','var removeDuplicates = function(nums) {

};'),
('remove-duplicates-sorted','java','class Solution {
    public int removeDuplicates(int[] nums) {

    }
}'),

-- move-zeroes
('move-zeroes','python','class Solution:
    def moveZeroes(self, nums: List[int]) -> List[int]:
        pass'),
('move-zeroes','javascript','var moveZeroes = function(nums) {

};'),
('move-zeroes','java','class Solution {
    public int[] moveZeroes(int[] nums) {

    }
}'),

-- sort-colors
('sort-colors','python','class Solution:
    def sortColors(self, nums: List[int]) -> List[int]:
        pass'),
('sort-colors','javascript','var sortColors = function(nums) {

};'),
('sort-colors','java','class Solution {
    public int[] sortColors(int[] nums) {

    }
}'),

-- squares-sorted-array
('squares-sorted-array','python','class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        pass'),
('squares-sorted-array','javascript','var sortedSquares = function(nums) {

};'),
('squares-sorted-array','java','class Solution {
    public int[] sortedSquares(int[] nums) {

    }
}'),

-- is-subsequence
('is-subsequence','python','class Solution:
    def isSubsequence(self, s: str, t: str) -> bool:
        pass'),
('is-subsequence','javascript','var isSubsequence = function(s, t) {

};'),
('is-subsequence','java','class Solution {
    public boolean isSubsequence(String s, String t) {

    }
}')
ON CONFLICT (problem_id, language) DO NOTHING;


-- ------------------------------------------------------------
-- 4) Sanity check
-- ------------------------------------------------------------
SELECT topic_id, COUNT(*) AS problem_count
FROM public."PGcode_problems"
WHERE topic_id IN ('strings','two-pointers')
GROUP BY topic_id;
