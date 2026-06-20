-- Gold upgrade: sliding-window (5) + stack remaining (2)
BEGIN;

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i</code>-th day. You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.</p>
<p>Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return <code>0</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= prices.length &lt;= 10<sup>5</sup></code></li>
  <li><code>0 &lt;= prices[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Track the minimum price seen so far as you scan left to right.',
    'For each day, the best profit ending today is prices[today] - min_so_far. Keep the maximum of these.',
    'Single pass, O(n) time, O(1) extra space — no DP table needed.'
  ]
WHERE id = 'best-time-to-buy-sell-stock';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "bbbbb"
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= s.length &lt;= 5 * 10<sup>4</sup></code></li>
  <li><code>s</code> consists of English letters, digits, symbols and spaces.</li>
</ul>
$$,
  hints = ARRAY[
    'Sliding window with two pointers (left, right) and a hash set of characters currently in the window.',
    'Advance right and add s[right] to the set. If it''s already there, advance left, removing s[left] from the set, until the duplicate is gone.',
    'Track max(right - left + 1) at each step. Each character is added and removed at most once → O(n) total.'
  ]
WHERE id = 'longest-substr-no-repeat';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given a string <code>s</code> and an integer <code>k</code>. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most <code>k</code> times.</p>
<p>Return the length of the longest substring containing the same letter you can get after performing the above operations.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "ABAB", k = 2
Output: 4
Explanation: Replace the two 'A's with 'B's or vice versa.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "AABABBA", k = 1
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>5</sup></code></li>
  <li><code>s</code> consists of only uppercase English letters.</li>
  <li><code>0 &lt;= k &lt;= s.length</code></li>
</ul>
$$,
  hints = ARRAY[
    'A window is "valid" if (window length - count of the most frequent letter in the window) <= k.',
    'Slide a window with a 26-int frequency table and track maxCount = max frequency seen in the window.',
    'When the window becomes invalid, shrink from the left. Crucially, you do NOT need to recompute maxCount on shrink — it can only grow over time and the answer still works.'
  ]
WHERE id = 'longest-repeating-char';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>s</code> and <code>t</code> of lengths <code>m</code> and <code>n</code> respectively, return the <strong>minimum window substring</strong> of <code>s</code> such that every character in <code>t</code> (including duplicates) is included in the window. If there is no such substring, return the empty string <code>""</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
Explanation: The minimum window substring "BANC" includes 'A', 'B', and 'C' from t.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "a", t = "a"
Output: "a"</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == s.length</code>, <code>n == t.length</code></li>
  <li><code>1 &lt;= m, n &lt;= 10<sup>5</sup></code></li>
  <li><code>s</code> and <code>t</code> consist of uppercase and lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'Build a need[] frequency table from t. Track how many distinct chars are still missing (call it required).',
    'Slide a right pointer to grow the window; when it includes all required chars, slide a left pointer to shrink while still valid.',
    'During each "valid" state, record the smallest window seen so far. O(m + n) total.'
  ]
WHERE id = 'min-window-substring';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>s1</code> and <code>s2</code>, return <code>true</code> if <code>s2</code> contains a permutation of <code>s1</code>, or <code>false</code> otherwise. In other words, return <code>true</code> if one of <code>s1</code>''s permutations is the substring of <code>s2</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s1 = "ab", s2 = "eidbaooo"
Output: true
Explanation: s2 contains one permutation of s1 ("ba").</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s1 = "ab", s2 = "eidboaoo"
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s1.length, s2.length &lt;= 10<sup>4</sup></code></li>
  <li><code>s1</code> and <code>s2</code> consist of lowercase English letters.</li>
</ul>
$$,
  hints = ARRAY[
    'A permutation of s1 inside s2 is a window in s2 of length len(s1) whose character counts match s1''s counts.',
    'Maintain two 26-int arrays — one for s1, one for the current window — and slide the window across s2.',
    'After each slide, compare the two arrays in O(26) = O(1). Total time O(len(s2)).'
  ]
WHERE id = 'permutation-in-string';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
<p>An input string is valid if: open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "()[]{}"
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "(]"
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>4</sup></code></li>
  <li><code>s</code> consists of parentheses only <code>'()[]{}'</code>.</li>
</ul>
$$,
  hints = ARRAY[
    'Use a stack. Push every open bracket onto it.',
    'When you see a close bracket, the top of the stack must be the matching open bracket — otherwise return false.',
    'At the end the stack must be empty. Use a small map of close → open to make the matching check a one-liner.'
  ]
WHERE id = 'valid-parentheses';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There are <code>n</code> cars going to the same destination along a one-lane road. The destination is <code>target</code> miles away. You are given two arrays: <code>position[i]</code> is the starting position of the <code>i</code>-th car (in miles) and <code>speed[i]</code> is its speed (miles per hour).</p>
<p>A car can never pass another car. A faster car catches up to a slower one and forms a <strong>fleet</strong>; the fleet then moves at the slower car''s speed. Return the number of fleets that arrive at the destination.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]
Output: 3
Explanation: The cars at positions 10 and 8 form a fleet (arriving at time 1). The car at position 0 forms a fleet by itself. The cars at 5 and 3 form a fleet.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  target = 10, position = [3], speed = [3]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == position.length == speed.length</code></li>
  <li><code>1 &lt;= n &lt;= 10<sup>5</sup></code></li>
  <li><code>0 &lt;= position[i] &lt; target &lt;= 10<sup>6</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Sort the cars by starting position (descending — the closest car to target processed first).',
    'Compute each car''s arrival time = (target - position) / speed and walk through them in that order.',
    'If the next car''s arrival time is <= the current fleet''s arrival time, it joins the fleet (no new fleet); otherwise it starts a new fleet. Use a stack of fleet times for clarity.'
  ]
WHERE id = 'car-fleet';

COMMIT;

SELECT id, topic_id, position('Example' in description) > 0 AS ex, array_length(hints,1) AS h
FROM public."PGcode_problems"
WHERE topic_id IN ('sliding-window','stack')
ORDER BY topic_id, id;
