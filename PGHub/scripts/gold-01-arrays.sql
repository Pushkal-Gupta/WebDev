-- ============================================================
-- GOLD UPGRADE: arrays topic
-- Upgrades description (Example/Constraints) + hints (3 each)
-- for the 5 arrays problems that aren't already gold.
-- Leaves test_cases / signatures intact (already populated).
-- Adds starter templates if missing.
-- Idempotent.
-- ============================================================

BEGIN;

-- ============ encode-decode-strings ============
UPDATE public."PGcode_problems" SET
  description = $DESC$
<p>Design an algorithm to <strong>encode</strong> a list of strings into a single string and a matching algorithm to <strong>decode</strong> that single string back to the original list of strings. The encoding/decoding pair should work for any list of strings, including empty strings and strings containing any characters.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  ["lint","code","love","you"]
Output: ["lint","code","love","you"]
Explanation: One possible encoding is "4#lint4#code4#love3#you".</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  ["we","say",":","yes"]
Output: ["we","say",":","yes"]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= strs.length &lt;= 200</code></li>
  <li><code>0 &lt;= strs[i].length &lt;= 200</code></li>
  <li><code>strs[i]</code> contains any possible characters out of 256 valid ASCII characters.</li>
</ul>
$DESC$,
  hints = ARRAY[
    'Length-prefix each string: write its length, a delimiter you wouldn''t confuse with the content (e.g. "#"), then the string itself.',
    'Decoding becomes deterministic: read digits up to "#", parse them as length L, then take exactly L characters.',
    'Don''t use a separator character alone — strings can contain anything, so "abc,def" would be ambiguous. The length prefix sidesteps that.'
  ]
WHERE id = 'encode-decode-strings';

-- Add test cases (none currently)
UPDATE public."PGcode_problems" SET
  method_name = COALESCE(method_name, 'encode'),
  params = COALESCE(params, '[{"name":"strs","type":"List[str]"}]'::jsonb),
  return_type = COALESCE(return_type, 'List[str]'),
  test_cases = COALESCE(test_cases, '[
    {"inputs":["[\"lint\",\"code\",\"love\",\"you\"]"],"expected":"[\"lint\",\"code\",\"love\",\"you\"]"},
    {"inputs":["[\"we\",\"say\",\":\",\"yes\"]"],"expected":"[\"we\",\"say\",\":\",\"yes\"]"},
    {"inputs":["[]"],"expected":"[]"},
    {"inputs":["[\"\"]"],"expected":"[\"\"]"},
    {"inputs":["[\"a\",\"\",\"b\"]"],"expected":"[\"a\",\"\",\"b\"]"},
    {"inputs":["[\"hello world\",\"#5#test\"]"],"expected":"[\"hello world\",\"#5#test\"]"}
  ]'::jsonb)
WHERE id = 'encode-decode-strings';

-- ============ group-anagrams ============
UPDATE public."PGcode_problems" SET
  description = $DESC$
<p>Given an array of strings <code>strs</code>, group the <strong>anagrams</strong> together. You can return the answer in any order.</p>
<p>An <strong>anagram</strong> is a word formed by rearranging the letters of another word, using all original letters exactly once.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  strs = [""]
Output: [[""]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= strs.length &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= strs[i].length &lt;= 100</code></li>
  <li><code>strs[i]</code> consists of lowercase English letters.</li>
</ul>
$DESC$,
  hints = ARRAY[
    'Two strings are anagrams iff they have the exact same character counts. Build a key per string from those counts.',
    'Use a tuple of 26 ints (a..z counts) as the dictionary key — O(n) per string instead of O(n log n) sorting.',
    'Sorted strings also work as keys ("eat" -> "aet"); slightly slower but cleaner code if input is small.'
  ]
WHERE id = 'group-anagrams';

-- ============ longest-consecutive ============
UPDATE public."PGcode_problems" SET
  description = $DESC$
<p>Given an unsorted array of integers <code>nums</code>, return the length of the longest consecutive elements sequence.</p>
<p>You must write an algorithm that runs in <strong>O(n)</strong> time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [100,4,200,1,3,2]
Output: 4
Explanation: The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0,3,7,2,5,8,4,6,0,1]
Output: 9</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
</ul>
$DESC$,
  hints = ARRAY[
    'Throw the array into a hash set so membership lookups are O(1).',
    'Only start counting a streak from numbers x where x - 1 is NOT in the set — those are the true left endpoints.',
    'From each left endpoint, walk x, x+1, x+2, ... in the set. Each number is visited at most twice across the whole algorithm, so total work is O(n).'
  ]
WHERE id = 'longest-consecutive';

-- ============ product-except-self ============
UPDATE public."PGcode_problems" SET
  description = $DESC$
<p>Given an integer array <code>nums</code>, return an array <code>answer</code> such that <code>answer[i]</code> is equal to the product of all the elements of <code>nums</code> except <code>nums[i]</code>.</p>
<p>The product of any prefix or suffix of <code>nums</code> is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in <strong>O(n)</strong> time and <strong>without using the division</strong> operation.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,2,3,4]
Output: [24,12,8,6]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>2 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>-30 &lt;= nums[i] &lt;= 30</code></li>
</ul>
$DESC$,
  hints = ARRAY[
    'answer[i] = (product of everything to the left of i) * (product of everything to the right of i).',
    'First pass left-to-right: fill answer[i] with the prefix product (everything to the left).',
    'Second pass right-to-left: keep a running suffix product and multiply it into answer[i] in place — O(1) extra space.'
  ]
WHERE id = 'product-except-self';

-- ============ top-k-frequent ============
UPDATE public."PGcode_problems" SET
  description = $DESC$
<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code> most frequent elements. You may return the answer in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,1,1,2,2,3], k = 2
Output: [1,2]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [1], k = 1
Output: [1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>k</code> is in the range <code>[1, the number of unique elements in the array]</code>.</li>
  <li>Your algorithm''s time complexity must be better than O(n log n).</li>
</ul>
$DESC$,
  hints = ARRAY[
    'Step 1: count frequencies in a hash map (O(n)).',
    'Step 2: bucket sort by frequency — buckets[f] is the list of values seen exactly f times. There are at most n+1 buckets.',
    'Step 3: walk buckets from highest frequency down, collecting values until you have k of them. Total time O(n).'
  ]
WHERE id = 'top-k-frequent';


-- ------------------------------------------------------------
-- Starter templates for the 5 (insert only if missing)
-- ------------------------------------------------------------
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code)
SELECT * FROM (VALUES
  ('encode-decode-strings', 'python',
$PY$class Solution:
    def encode(self, strs: List[str]) -> str:
        # Write your code here
        pass

    def decode(self, s: str) -> List[str]:
        # Write your code here
        pass
$PY$),
  ('encode-decode-strings', 'javascript',
$JS$/**
 * @param {string[]} strs
 * @return {string}
 */
var encode = function(strs) {
    // Write your code here
};

/**
 * @param {string} s
 * @return {string[]}
 */
var decode = function(s) {
    // Write your code here
};
$JS$),
  ('encode-decode-strings', 'java',
$JAVA$class Solution {
    public String encode(List<String> strs) {
        // Write your code here
        return "";
    }

    public List<String> decode(String s) {
        // Write your code here
        return new ArrayList<>();
    }
}
$JAVA$),

  ('group-anagrams', 'python',
$PY$class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # Write your code here
        pass
$PY$),
  ('group-anagrams', 'javascript',
$JS$/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    // Write your code here
};
$JS$),
  ('group-anagrams', 'java',
$JAVA$class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        // Write your code here
        return new ArrayList<>();
    }
}
$JAVA$),

  ('longest-consecutive', 'python',
$PY$class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        # Write your code here
        pass
$PY$),
  ('longest-consecutive', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    // Write your code here
};
$JS$),
  ('longest-consecutive', 'java',
$JAVA$class Solution {
    public int longestConsecutive(int[] nums) {
        // Write your code here
        return 0;
    }
}
$JAVA$),

  ('product-except-self', 'python',
$PY$class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        # Write your code here
        pass
$PY$),
  ('product-except-self', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
    // Write your code here
};
$JS$),
  ('product-except-self', 'java',
$JAVA$class Solution {
    public int[] productExceptSelf(int[] nums) {
        // Write your code here
        return new int[0];
    }
}
$JAVA$),

  ('top-k-frequent', 'python',
$PY$class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        # Write your code here
        pass
$PY$),
  ('top-k-frequent', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var topKFrequent = function(nums, k) {
    // Write your code here
};
$JS$),
  ('top-k-frequent', 'java',
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        // Write your code here
        return new int[0];
    }
}
$JAVA$)
) AS new_templates(problem_id, language, code)
WHERE NOT EXISTS (
  SELECT 1 FROM public."PGcode_problem_templates" t
  WHERE t.problem_id = new_templates.problem_id AND t.language = new_templates.language
);

COMMIT;

-- Verification
SELECT id,
       (position('Example' in description) > 0) AS has_example,
       (position('Constraint' in description) > 0) AS has_constraint,
       array_length(hints,1) AS hint_count,
       LENGTH(description) AS desc_len
FROM public."PGcode_problems"
WHERE id IN ('encode-decode-strings','group-anagrams','longest-consecutive','product-except-self','top-k-frequent')
ORDER BY id;
