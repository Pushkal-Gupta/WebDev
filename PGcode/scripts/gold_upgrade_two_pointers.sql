-- Gold upgrade: two-pointers (10 problems)
BEGIN;

UPDATE public."PGcode_problems" SET
  description = $$
<p>A phrase is a <strong>palindrome</strong> if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.</p>
<p>Given a string <code>s</code>, return <code>true</code> if it is a palindrome, or <code>false</code> otherwise.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 2 * 10<sup>5</sup></code></li>
  <li><code>s</code> consists only of printable ASCII characters.</li>
</ul>
$$,
  hints = ARRAY[
    'Use two pointers — one at the left end, one at the right — and compare lowercase versions of the characters they point at.',
    'Skip non-alphanumeric characters by advancing the relevant pointer without comparing.',
    'Stop as soon as the pointers cross. No need to build a cleaned copy of the string — saves O(n) space.'
  ]
WHERE id = 'valid-palindrome';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a <strong>1-indexed</strong> array of integers <code>numbers</code> that is already sorted in non-decreasing order, find two numbers such that they add up to a specific <code>target</code> number.</p>
<p>Return the indices of the two numbers, <code>index1</code> and <code>index2</code>, added by one as an integer array <code>[index1, index2]</code> of length 2. The tests are generated such that there is exactly one solution. You may not use the same element twice.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  numbers = [2,7,11,15], target = 9
Output: [1,2]
Explanation: numbers[0] + numbers[1] == 9, so we return [1, 2].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  numbers = [2,3,4], target = 6
Output: [1,3]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>2 &lt;= numbers.length &lt;= 3 * 10<sup>4</sup></code></li>
  <li><code>numbers</code> is sorted in non-decreasing order.</li>
  <li>Your solution must use only constant extra space.</li>
</ul>
$$,
  hints = ARRAY[
    'Two pointers from both ends — left starts at 0, right starts at len-1.',
    'If numbers[left] + numbers[right] is too small, advance left; if too big, retreat right; if equal, you found it.',
    'Because the array is sorted, this converges in O(n) time and O(1) space — strictly better than the hash-map approach for unsorted Two Sum.'
  ]
WHERE id = 'two-sum-ii';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code>, return all the triplets <code>[nums[i], nums[j], nums[k]]</code> such that <code>i != j</code>, <code>i != k</code>, and <code>j != k</code>, and <code>nums[i] + nums[j] + nums[k] == 0</code>. The solution set must not contain duplicate triplets.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0,1,1]
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>3 &lt;= nums.length &lt;= 3000</code></li>
  <li><code>-10<sup>5</sup> &lt;= nums[i] &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Sort the array first — that lets you skip duplicates and use two pointers for the inner search.',
    'For each index i, run a two-pointer sweep on the subarray to its right looking for sum == -nums[i].',
    'Skip over duplicate values for the outer loop AND for both inner pointers, otherwise you''ll emit duplicate triplets.'
  ]
WHERE id = 'three-sum';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an integer array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the <code>i</code>-th line are <code>(i, 0)</code> and <code>(i, height[i])</code>.</p>
<p>Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The vertical lines at index 1 (height 8) and index 8 (height 7) form a container of area min(8,7) * (8-1) = 49.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  height = [1,1]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == height.length</code></li>
  <li><code>2 &lt;= n &lt;= 10<sup>5</sup></code></li>
  <li><code>0 &lt;= height[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Two pointers, one at each end. The area is min(height[l], height[r]) * (r - l).',
    'Always move the pointer that points to the SHORTER line — moving the taller one can never increase the min height, so it can only shrink the area.',
    'Track the best area seen so far and stop when the pointers cross. Total time O(n).'
  ]
WHERE id = 'container-most-water';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is <code>1</code>, compute how much water it can trap after raining.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: 6 units of water are trapped between the bars.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  height = [4,2,0,3,2,5]
Output: 9</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == height.length</code></li>
  <li><code>1 &lt;= n &lt;= 2 * 10<sup>4</sup></code></li>
  <li><code>0 &lt;= height[i] &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Water trapped at index i equals min(maxLeft[i], maxRight[i]) - height[i] (if positive).',
    'Two-pointer trick: maintain left, right, leftMax, rightMax. Always advance the side whose current bar is shorter — that side''s leftMax/rightMax is the binding constraint.',
    'No need to precompute the prefix max arrays — the two-pointer version uses O(1) extra space.'
  ]
WHERE id = 'trapping-rain-water';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code> sorted in non-decreasing order, remove the duplicates <strong>in-place</strong> such that each unique element appears only <strong>once</strong>. The relative order of the elements should be kept the same. Then return the number of unique elements in <code>nums</code>.</p>
<p>The first <code>k</code> elements of <code>nums</code> should hold the unique values; what you leave beyond index <code>k</code> doesn''t matter.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,1,2]
Output: 2, nums = [1,2,_]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 3 * 10<sup>4</sup></code></li>
  <li><code>-100 &lt;= nums[i] &lt;= 100</code></li>
  <li><code>nums</code> is sorted in non-decreasing order.</li>
</ul>
$$,
  hints = ARRAY[
    'Two pointers: slow tracks the next write position; fast scans the array.',
    'Whenever nums[fast] != nums[slow], advance slow and copy nums[fast] there.',
    'At the end, slow + 1 is the count of unique elements. O(n) time and O(1) extra space.'
  ]
WHERE id = 'remove-duplicates-sorted';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code>, move all <code>0</code>''s to the end of it while maintaining the relative order of the non-zero elements. You must do this <strong>in-place</strong> without making a copy of the array.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [0,1,0,3,12]
Output: [1,3,12,0,0]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0]
Output: [0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
  <li><code>-2<sup>31</sup> &lt;= nums[i] &lt;= 2<sup>31</sup> - 1</code></li>
</ul>
$$,
  hints = ARRAY[
    'Slow pointer = next write position for non-zero elements. Fast pointer scans every element.',
    'Whenever nums[fast] != 0, swap nums[slow] and nums[fast], then advance slow.',
    'Or two-pass: copy non-zeros forward in one pass, then fill the tail with zeros in a second pass.'
  ]
WHERE id = 'move-zeroes';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array <code>nums</code> with <code>n</code> objects colored red (<code>0</code>), white (<code>1</code>), or blue (<code>2</code>), sort them in-place so that objects of the same color are adjacent, in the order red, white, and blue. You must solve this problem without using the library''s sort function.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [2,0,2,1,1,0]
Output: [0,0,1,1,2,2]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [2,0,1]
Output: [0,1,2]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == nums.length</code></li>
  <li><code>1 &lt;= n &lt;= 300</code></li>
  <li><code>nums[i]</code> is <code>0</code>, <code>1</code>, or <code>2</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Dutch National Flag: three pointers — low (next 0 slot), mid (current scan), high (next 2 slot).',
    'If nums[mid] == 0, swap with low and advance both. If 2, swap with high and decrement high (do NOT advance mid). If 1, just advance mid.',
    'Single pass, O(n) time, O(1) extra space — and a classic interview question on partition logic.'
  ]
WHERE id = 'sort-colors';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code> sorted in <strong>non-decreasing</strong> order, return an array of the squares of each number sorted in non-decreasing order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [-4,-1,0,3,10]
Output: [0,1,9,16,100]
Explanation: After squaring, the array becomes [16,1,0,9,100]. After sorting, [0,1,9,16,100].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [-7,-3,2,3,11]
Output: [4,9,9,49,121]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
  <li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
  <li><code>nums</code> is sorted in non-decreasing order.</li>
</ul>
$$,
  hints = ARRAY[
    'After squaring, the largest values are at the EXTREMES of the original array — either far left (very negative) or far right (very positive).',
    'Two pointers from both ends; at each step pick the larger square and write it to the END of the result array, then move that pointer inward.',
    'Single O(n) pass, no sort needed.'
  ]
WHERE id = 'squares-sorted-array';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>s</code> is a <strong>subsequence</strong> of <code>t</code>, or <code>false</code> otherwise.</p>
<p>A subsequence of a string is a new string formed from the original by deleting some (can be none) of the characters without disturbing the relative positions of the remaining characters.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "abc", t = "ahbgdc"
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "axc", t = "ahbgdc"
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= s.length &lt;= 100</code></li>
  <li><code>0 &lt;= t.length &lt;= 10<sup>4</sup></code></li>
  <li><code>s</code> and <code>t</code> consist only of lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Two pointers, one in s and one in t. Always advance the pointer in t.',
    'Advance the pointer in s only when the current characters match.',
    'When the s pointer reaches len(s), every character has been matched in order — return true. If t is exhausted first, return false.'
  ]
WHERE id = 'is-subsequence';

COMMIT;

SELECT id, position('Example' in description) > 0 AS ex, array_length(hints,1) AS h, LENGTH(description) AS dlen
FROM public."PGcode_problems"
WHERE topic_id='two-pointers'
ORDER BY id;
