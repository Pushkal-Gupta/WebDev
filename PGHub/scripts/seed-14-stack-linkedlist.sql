BEGIN;

-- ============================================================
-- DELETE existing rows for idempotency
-- ============================================================
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'asteroid-collision', 'decode-string', 'remove-all-adjacent-duplicates',
  'remove-nth-from-end', 'add-two-numbers', 'swap-nodes-pairs',
  'merge-k-sorted-lists', 'lru-cache'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'asteroid-collision', 'decode-string', 'remove-all-adjacent-duplicates',
  'remove-nth-from-end', 'add-two-numbers', 'swap-nodes-pairs',
  'merge-k-sorted-lists', 'lru-cache'
);

-- ============================================================
-- PART 1: Problem rows
-- ============================================================

INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url,
   method_name, params, return_type, test_cases)
VALUES

-- ============ 1. Asteroid Collision (Medium) ============
('asteroid-collision', 'stack', 'Asteroid Collision', 'Medium',
$DESC$
<p>We are given an array <code>asteroids</code> of integers representing asteroids in a row.</p>
<p>For each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left). Each asteroid moves at the same speed.</p>
<p>Find out the state of the asteroids after all collisions. If two asteroids meet, the smaller one will explode. If both are the same size, both will explode. Two asteroids moving in the same direction will never meet.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: asteroids = [5,10,-5]
Output: [5,10]
Explanation: The 10 and -5 collide resulting in 10. The 5 and 10 never collide.</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: asteroids = [8,-8]
Output: []
Explanation: The 8 and -8 collide exploding each other.</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: asteroids = [10,2,-5]
Output: [10]
Explanation: The 2 and -5 collide resulting in -5. The 10 and -5 collide resulting in 10.</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>2 &lt;= asteroids.length &lt;= 10<sup>4</sup></code></li>
  <li><code>-1000 &lt;= asteroids[i] &lt;= 1000</code></li>
  <li><code>asteroids[i] != 0</code></li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'A collision can only happen when a positive asteroid is followed (eventually) by a negative one — right-moving meets left-moving.',
  'Use a stack. Push positive asteroids. When you encounter a negative asteroid, pop and destroy smaller positive asteroids from the top of the stack.',
  'If the top positive equals the negative size, both explode. If the stack is empty or top is negative, push the negative asteroid.'
],
'200', 'https://leetcode.com/problems/asteroid-collision/',
'asteroidCollision',
'[{"name":"asteroids","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[5,10,-5]"],"expected":"[5,10]"},
  {"inputs":["[8,-8]"],"expected":"[]"},
  {"inputs":["[10,2,-5]"],"expected":"[10]"},
  {"inputs":["[-2,-1,1,2]"],"expected":"[-2,-1,1,2]"},
  {"inputs":["[1,-1,-2,-3]"],"expected":"[-2,-3]"},
  {"inputs":["[1,2,3,-3,-2,-1]"],"expected":"[]"},
  {"inputs":["[-1,-2,1,2]"],"expected":"[-1,-2,1,2]"},
  {"inputs":["[1,-2,3,-4]"],"expected":"[-2,-4]"},
  {"inputs":["[5,5,-5,-5]"],"expected":"[]"},
  {"inputs":["[10,-5,-5,-10]"],"expected":"[]"},
  {"inputs":["[1,2,3,4,5]"],"expected":"[1,2,3,4,5]"},
  {"inputs":["[-1,-2,-3,-4,-5]"],"expected":"[-1,-2,-3,-4,-5]"},
  {"inputs":["[3,5,-8]"],"expected":"[-8]"},
  {"inputs":["[10,5,-5]"],"expected":"[10]"},
  {"inputs":["[1,-1,1,-1,1,-1]"],"expected":"[]"},
  {"inputs":["[100,-50,-50]"],"expected":"[100]"},
  {"inputs":["[-2,1,-1,2]"],"expected":"[-2,2]"},
  {"inputs":["[4,7,-3,-7,8]"],"expected":"[4,8]"}
]'::jsonb),

-- ============ 2. Decode String (Medium) ============
('decode-string', 'stack', 'Decode String', 'Medium',
$DESC$
<p>Given an encoded string, return its decoded string.</p>
<p>The encoding rule is: <code>k[encoded_string]</code>, where the <code>encoded_string</code> inside the square brackets is being repeated exactly <code>k</code> times. Note that <code>k</code> is guaranteed to be a positive integer.</p>
<p>You may assume that the input string is always valid; there are no extra white spaces, square brackets are well-formed, etc. Furthermore, you may assume that the original data does not contain any digits and that digits are only for those repeat numbers, <code>k</code>. For example, there will not be input like <code>3a</code> or <code>2[4]</code>.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: s = "3[a]2[bc]"
Output: "aaabcbc"</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: s = "3[a2[c]]"
Output: "accaccacc"</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: s = "2[abc]3[cd]ef"
Output: "abcabccdcdcdef"</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 30</code></li>
  <li><code>s</code> consists of lowercase English letters, digits, and square brackets <code>''[]''</code>.</li>
  <li><code>s</code> is guaranteed to be a valid input.</li>
  <li>All the integers in <code>s</code> are in the range <code>[1, 300]</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use a stack to handle nesting. When you see ''['', push the current string and current number onto the stack.',
  'When you see '']'', pop the previous string and repeat count, then append the current string repeated that many times to the previous string.',
  'Build multi-digit numbers character by character. Letters are appended to the current string being built.'
],
'200', 'https://leetcode.com/problems/decode-string/',
'decodeString',
'[{"name":"s","type":"str"}]'::jsonb,
'str',
'[
  {"inputs":["\"3[a]2[bc]\""],"expected":"\"aaabcbc\""},
  {"inputs":["\"3[a2[c]]\""],"expected":"\"accaccacc\""},
  {"inputs":["\"2[abc]3[cd]ef\""],"expected":"\"abcabccdcdcdef\""},
  {"inputs":["\"abc\""],"expected":"\"abc\""},
  {"inputs":["\"10[a]\""],"expected":"\"aaaaaaaaaa\""},
  {"inputs":["\"2[a2[b]]\""],"expected":"\"abbabb\""},
  {"inputs":["\"1[a]\""],"expected":"\"a\""},
  {"inputs":["\"3[z]2[2[y]pq4[2[jk]e1[f]]]ef\""],"expected":"\"zzzyypqjkjkefjkjkefjkjkefjkjkefyypqjkjkefjkjkefjkjkefjkjkefef\""},
  {"inputs":["\"2[2[2[a]]]\""],"expected":"\"aaaaaaaa\""},
  {"inputs":["\"abc3[a]\""],"expected":"\"abcaaa\""},
  {"inputs":["\"2[b3[a]]\""],"expected":"\"baaabaa\""},
  {"inputs":["\"1[1[1[1[x]]]]\""],"expected":"\"x\""},
  {"inputs":["\"ab2[c]d\""],"expected":"\"abccd\""},
  {"inputs":["\"3[ab]\""],"expected":"\"ababab\""},
  {"inputs":["\"2[a]2[b]2[c]\""],"expected":"\"aabbcc\""},
  {"inputs":["\"4[ab]\""],"expected":"\"abababab\""}
]'::jsonb),

-- ============ 3. Remove All Adjacent Duplicates in String (Easy) ============
('remove-all-adjacent-duplicates', 'stack', 'Remove All Adjacent Duplicates In String', 'Easy',
$DESC$
<p>You are given a string <code>s</code> consisting of lowercase English letters. A <strong>duplicate removal</strong> consists of choosing two <strong>adjacent</strong> and <strong>equal</strong> letters and removing them.</p>
<p>We repeatedly make duplicate removals on <code>s</code> until we no longer can.</p>
<p>Return the final string after all such duplicate removals have been made. It can be proven that the answer is unique.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: s = "abbaca"
Output: "ca"
Explanation:
In "abbaca", we remove "bb" to get "aaca".
In "aaca", we remove "aa" to get "ca".</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: s = "azxxzy"
Output: "ay"</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>5</sup></code></li>
  <li><code>s</code> consists of lowercase English letters.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Think of using a stack. Iterate through each character and compare it with the top of the stack.',
  'If the current character equals the top of the stack, pop it (they form an adjacent duplicate). Otherwise, push the current character.',
  'After processing all characters, the stack contains the final string. Join the stack to produce the result.'
],
'200', 'https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/',
'removeDuplicates',
'[{"name":"s","type":"str"}]'::jsonb,
'str',
'[
  {"inputs":["\"abbaca\""],"expected":"\"ca\""},
  {"inputs":["\"azxxzy\""],"expected":"\"ay\""},
  {"inputs":["\"a\""],"expected":"\"a\""},
  {"inputs":["\"aa\""],"expected":"\"\""},
  {"inputs":["\"aab\""],"expected":"\"b\""},
  {"inputs":["\"baa\""],"expected":"\"b\""},
  {"inputs":["\"abba\""],"expected":"\"\""},
  {"inputs":["\"abcd\""],"expected":"\"abcd\""},
  {"inputs":["\"aabccba\""],"expected":"\"a\""},
  {"inputs":["\"abccba\""],"expected":"\"\""},
  {"inputs":["\"aaaa\""],"expected":"\"\""},
  {"inputs":["\"aaa\""],"expected":"\"a\""},
  {"inputs":["\"abcddcba\""],"expected":"\"\""},
  {"inputs":["\"mississippi\""],"expected":"\"m\""},
  {"inputs":["\"abcdefg\""],"expected":"\"abcdefg\""},
  {"inputs":["\"aababbc\""],"expected":"\"bac\""},
  {"inputs":["\"abccbadd\""],"expected":"\"\""},
  {"inputs":["\"zz\""],"expected":"\"\""}
]'::jsonb),

-- ============ 4. Remove Nth Node From End of List (Medium) ============
('remove-nth-from-end', 'linkedlist', 'Remove Nth Node From End of List', 'Medium',
$DESC$
<p>Given the <code>head</code> of a linked list, remove the <code>n<sup>th</sup></code> node from the end of the list and return its head.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: head = [1], n = 1
Output: []</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: head = [1,2], n = 1
Output: [1]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in the list is <code>sz</code>.</li>
  <li><code>1 &lt;= sz &lt;= 30</code></li>
  <li><code>0 &lt;= Node.val &lt;= 100</code></li>
  <li><code>1 &lt;= n &lt;= sz</code></li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use a dummy node before head to handle the edge case of removing the first node.',
  'Use two pointers: advance the first pointer n+1 steps from the dummy, then move both pointers until the first reaches the end.',
  'The second pointer will be right before the node to remove. Set second.next = second.next.next.'
],
'200', 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
'removeNthFromEnd',
'[{"name":"head","type":"Optional[ListNode]"},{"name":"n","type":"int"}]'::jsonb,
'Optional[ListNode]',
'[
  {"inputs":["[1,2,3,4,5]","2"],"expected":"[1,2,3,5]"},
  {"inputs":["[1]","1"],"expected":"[]"},
  {"inputs":["[1,2]","1"],"expected":"[1]"},
  {"inputs":["[1,2]","2"],"expected":"[2]"},
  {"inputs":["[1,2,3]","3"],"expected":"[2,3]"},
  {"inputs":["[1,2,3]","1"],"expected":"[1,2]"},
  {"inputs":["[1,2,3]","2"],"expected":"[1,3]"},
  {"inputs":["[1,2,3,4,5]","5"],"expected":"[2,3,4,5]"},
  {"inputs":["[1,2,3,4,5]","1"],"expected":"[1,2,3,4]"},
  {"inputs":["[10,20,30,40]","2"],"expected":"[10,20,40]"},
  {"inputs":["[10,20,30,40]","4"],"expected":"[20,30,40]"},
  {"inputs":["[5,4,3,2,1]","3"],"expected":"[5,4,2,1]"},
  {"inputs":["[1,1,1,1]","2"],"expected":"[1,1,1]"},
  {"inputs":["[7]","1"],"expected":"[]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","5"],"expected":"[1,2,3,4,5,7,8,9,10]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","10"],"expected":"[2,3,4,5,6,7,8,9,10]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","1"],"expected":"[1,2,3,4,5,6,7,8,9]"},
  {"inputs":["[100,200]","1"],"expected":"[100]"}
]'::jsonb),

-- ============ 5. Add Two Numbers (Medium) ============
('add-two-numbers', 'linkedlist', 'Add Two Numbers', 'Medium',
$DESC$
<p>You are given two <strong>non-empty</strong> linked lists representing two non-negative integers. The digits are stored in <strong>reverse order</strong>, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.</p>
<p>You may assume the two numbers do not contain any leading zero, except the number 0 itself.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: l1 = [0], l2 = [0]
Output: [0]</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
Output: [8,9,9,9,0,0,0,1]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in each linked list is in the range <code>[1, 100]</code>.</li>
  <li><code>0 &lt;= Node.val &lt;= 9</code></li>
  <li>It is guaranteed that the list represents a number that does not have leading zeros.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Since the digits are already in reverse order (least significant first), you can add them naturally from head to tail, just like grade-school addition.',
  'Use a carry variable. For each pair of nodes, compute sum = val1 + val2 + carry, create a new node with sum % 10, and update carry = sum // 10.',
  'Continue until both lists are exhausted AND carry is 0. Handle unequal lengths by treating missing nodes as 0.'
],
'200', 'https://leetcode.com/problems/add-two-numbers/',
'addTwoNumbers',
'[{"name":"l1","type":"Optional[ListNode]"},{"name":"l2","type":"Optional[ListNode]"}]'::jsonb,
'Optional[ListNode]',
'[
  {"inputs":["[2,4,3]","[5,6,4]"],"expected":"[7,0,8]"},
  {"inputs":["[0]","[0]"],"expected":"[0]"},
  {"inputs":["[9,9,9,9,9,9,9]","[9,9,9,9]"],"expected":"[8,9,9,9,0,0,0,1]"},
  {"inputs":["[1]","[9,9,9]"],"expected":"[0,0,0,1]"},
  {"inputs":["[5]","[5]"],"expected":"[0,1]"},
  {"inputs":["[1,8]","[0]"],"expected":"[1,8]"},
  {"inputs":["[0]","[7,3]"],"expected":"[7,3]"},
  {"inputs":["[9]","[1]"],"expected":"[0,1]"},
  {"inputs":["[2,4,3]","[5,6,4,1]"],"expected":"[7,0,8,1]"},
  {"inputs":["[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]","[5,6,4]"],"expected":"[6,6,4,0,0,0,0,0,0,0,0,0,0,0,0,1]"},
  {"inputs":["[9,9]","[1]"],"expected":"[0,0,1]"},
  {"inputs":["[9,9]","[9,9]"],"expected":"[8,9,1]"},
  {"inputs":["[1,2,3]","[4,5,6]"],"expected":"[5,7,9]"},
  {"inputs":["[0,0,1]","[0,0,2]"],"expected":"[0,0,3]"},
  {"inputs":["[5,6,7,8]","[5,4,3,2]"],"expected":"[0,1,1,1,1]"},
  {"inputs":["[1]","[1]"],"expected":"[2]"},
  {"inputs":["[3,7]","[9,2]"],"expected":"[2,0,1]"},
  {"inputs":["[0,1]","[0,9]"],"expected":"[0,0,1]"}
]'::jsonb),

-- ============ 6. Swap Nodes in Pairs (Medium) ============
('swap-nodes-pairs', 'linkedlist', 'Swap Nodes in Pairs', 'Medium',
$DESC$
<p>Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list''s nodes (i.e., only nodes themselves may be changed).</p>

<p><strong>Example 1:</strong></p>
<pre>Input: head = [1,2,3,4]
Output: [2,1,4,3]</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: head = []
Output: []</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: head = [1]
Output: [1]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes in the list is in the range <code>[0, 100]</code>.</li>
  <li><code>0 &lt;= Node.val &lt;= 100</code></li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use a dummy node before head so you always have a "previous" pointer even for the first pair.',
  'For each pair (first, second): set prev.next = second, first.next = second.next, second.next = first. Then advance prev to first.',
  'Stop when there are fewer than 2 nodes remaining.'
],
'200', 'https://leetcode.com/problems/swap-nodes-in-pairs/',
'swapPairs',
'[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,
'Optional[ListNode]',
'[
  {"inputs":["[1,2,3,4]"],"expected":"[2,1,4,3]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[1]"],"expected":"[1]"},
  {"inputs":["[1,2]"],"expected":"[2,1]"},
  {"inputs":["[1,2,3]"],"expected":"[2,1,3]"},
  {"inputs":["[1,2,3,4,5]"],"expected":"[2,1,4,3,5]"},
  {"inputs":["[1,2,3,4,5,6]"],"expected":"[2,1,4,3,6,5]"},
  {"inputs":["[10,20]"],"expected":"[20,10]"},
  {"inputs":["[5,4,3,2,1]"],"expected":"[4,5,2,3,1]"},
  {"inputs":["[1,1,1,1]"],"expected":"[1,1,1,1]"},
  {"inputs":["[0,1,0,1]"],"expected":"[1,0,1,0]"},
  {"inputs":["[100,200,300,400]"],"expected":"[200,100,400,300]"},
  {"inputs":["[7]"],"expected":"[7]"},
  {"inputs":["[1,2,3,4,5,6,7,8]"],"expected":"[2,1,4,3,6,5,8,7]"},
  {"inputs":["[9,8,7,6,5,4,3,2,1]"],"expected":"[8,9,6,7,4,5,2,3,1]"},
  {"inputs":["[42,17]"],"expected":"[17,42]"},
  {"inputs":["[3,3,3]"],"expected":"[3,3,3]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]"],"expected":"[2,1,4,3,6,5,8,7,10,9]"}
]'::jsonb),

-- ============ 7. Merge K Sorted Lists (Hard) ============
('merge-k-sorted-lists', 'linkedlist', 'Merge k Sorted Lists', 'Hard',
$DESC$
<p>You are given an array of <code>k</code> linked-lists <code>lists</code>, each linked-list is sorted in ascending order.</p>
<p>Merge all the linked-lists into one sorted linked-list and return it.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
Explanation: The linked-lists are:
[1->4->5, 1->3->4, 2->6]
merging them into one sorted list:
1->1->2->3->4->4->5->6</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: lists = []
Output: []</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: lists = [[]]
Output: []</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>k == lists.length</code></li>
  <li><code>0 &lt;= k &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= lists[i].length &lt;= 500</code></li>
  <li><code>-10<sup>4</sup> &lt;= lists[i][j] &lt;= 10<sup>4</sup></code></li>
  <li><code>lists[i]</code> is sorted in ascending order.</li>
  <li>The sum of <code>lists[i].length</code> will not exceed <code>10<sup>4</sup></code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'A brute-force approach: collect all values, sort them, and build a new list. O(N log N).',
  'Optimal: use a min-heap (priority queue). Push the first element of each list, then repeatedly pop the smallest and push its successor.',
  'Use a counter as a tiebreaker in the heap to avoid comparing ListNode objects directly.'
],
'200', 'https://leetcode.com/problems/merge-k-sorted-lists/',
'mergeKLists',
'[{"name":"lists","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,4,5],[1,3,4],[2,6]]"],"expected":"[1,1,2,3,4,4,5,6]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[[]]"],"expected":"[]"},
  {"inputs":["[[1]]"],"expected":"[1]"},
  {"inputs":["[[1,2,3]]"],"expected":"[1,2,3]"},
  {"inputs":["[[1],[2],[3]]"],"expected":"[1,2,3]"},
  {"inputs":["[[3],[1],[2]]"],"expected":"[1,2,3]"},
  {"inputs":["[[1,3,5],[2,4,6]]"],"expected":"[1,2,3,4,5,6]"},
  {"inputs":["[[-1,0,1],[-2,0,2]]"],"expected":"[-2,-1,0,0,1,2]"},
  {"inputs":["[[],[1,2]]"],"expected":"[1,2]"},
  {"inputs":["[[1,2],[]]"],"expected":"[1,2]"},
  {"inputs":["[[],[],[]]"],"expected":"[]"},
  {"inputs":["[[5,5,5],[5,5,5],[5,5,5]]"],"expected":"[5,5,5,5,5,5,5,5,5]"},
  {"inputs":["[[1,2],[3,4],[5,6],[7,8]]"],"expected":"[1,2,3,4,5,6,7,8]"},
  {"inputs":["[[-5,-3,-1],[0,2,4],[1,3,5]]"],"expected":"[-5,-3,-1,0,1,2,3,4,5]"},
  {"inputs":["[[1,10,20],[2,5,15],[3,8,25]]"],"expected":"[1,2,3,5,8,10,15,20,25]"},
  {"inputs":["[[-10,-5,0,5,10]]"],"expected":"[-10,-5,0,5,10]"},
  {"inputs":["[[1,1,1],[1,1,1]]"],"expected":"[1,1,1,1,1,1]"}
]'::jsonb),

-- ============ 8. LRU Cache (Medium, Operations Pattern) ============
('lru-cache', 'linkedlist', 'LRU Cache', 'Medium',
$DESC$
<p>Design a data structure that follows the constraints of a <strong>Least Recently Used (LRU) cache</strong>.</p>
<p>Implement the <code>LRUCache</code> class:</p>
<ul>
  <li><code>LRUCache(int capacity)</code> initializes the LRU cache with <strong>positive</strong> size <code>capacity</code>.</li>
  <li><code>int get(int key)</code> returns the value of the <code>key</code> if the key exists, otherwise returns <code>-1</code>.</li>
  <li><code>void put(int key, int value)</code> updates the value of the <code>key</code> if the key exists. Otherwise, adds the key-value pair to the cache. If the number of keys exceeds the <code>capacity</code> from this operation, <strong>evict</strong> the least recently used key.</li>
</ul>
<p>The functions <code>get</code> and <code>put</code> must each run in <code>O(1)</code> average time complexity.</p>

<p><strong>Example 1:</strong></p>
<pre>Input:
["LRUCache","put","put","get","put","get","put","get","get","get"]
[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]
Output:
[null,null,null,1,null,-1,null,-1,3,4]

Explanation:
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1);   // cache is {1=1}
lRUCache.put(2, 2);   // cache is {1=1, 2=2}
lRUCache.get(1);      // return 1
lRUCache.put(3, 3);   // LRU key was 2, evicts key 2, cache is {1=1, 3=3}
lRUCache.get(2);      // returns -1 (not found)
lRUCache.put(4, 4);   // LRU key was 1, evicts key 1, cache is {4=4, 3=3}
lRUCache.get(1);      // return -1 (not found)
lRUCache.get(3);      // return 3
lRUCache.get(4);      // return 4</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= capacity &lt;= 3000</code></li>
  <li><code>0 &lt;= key &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= value &lt;= 10<sup>5</sup></code></li>
  <li>At most <code>2 * 10<sup>5</sup></code> calls will be made to <code>get</code> and <code>put</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'You need O(1) get and put. A hash map gives O(1) lookup, but how do you track usage order?',
  'Combine a hash map with a doubly linked list. The list maintains usage order (most recent at tail, least recent at head).',
  'On get/put: move the node to the tail. On eviction: remove from the head. Python''s OrderedDict handles this natively.'
],
'200', 'https://leetcode.com/problems/lru-cache/',
'LRUCache',
'[{"name":"operations","type":"List[List]"}]'::jsonb,
'List',
'[
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"put\",2,2],[\"get\",1],[\"put\",3,3],[\"get\",2],[\"put\",4,4],[\"get\",1],[\"get\",3],[\"get\",4]]"],"expected":"[null,null,null,1,null,-1,null,-1,3,4]"},
  {"inputs":["[[\"LRUCache\",1],[\"put\",1,1],[\"put\",2,2],[\"get\",1],[\"get\",2]]"],"expected":"[null,null,null,-1,2]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,10],[\"put\",2,20],[\"get\",1],[\"get\",2]]"],"expected":"[null,null,null,10,20]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"put\",2,2],[\"put\",1,10],[\"get\",1],[\"get\",2]]"],"expected":"[null,null,null,null,10,2]"},
  {"inputs":["[[\"LRUCache\",1],[\"put\",1,1],[\"get\",1],[\"put\",2,2],[\"get\",1],[\"get\",2]]"],"expected":"[null,null,1,null,-1,2]"},
  {"inputs":["[[\"LRUCache\",3],[\"put\",1,1],[\"put\",2,2],[\"put\",3,3],[\"get\",1],[\"put\",4,4],[\"get\",2],[\"get\",3],[\"get\",4]]"],"expected":"[null,null,null,null,1,null,-1,3,4]"},
  {"inputs":["[[\"LRUCache\",2],[\"get\",1]]"],"expected":"[null,-1]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"put\",2,2],[\"get\",2],[\"put\",3,3],[\"get\",1],[\"get\",2],[\"get\",3]]"],"expected":"[null,null,null,2,null,-1,2,3]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",2,1],[\"put\",2,2],[\"get\",2],[\"put\",1,1],[\"put\",4,1],[\"get\",2]]"],"expected":"[null,null,null,2,null,null,-1]"},
  {"inputs":["[[\"LRUCache\",3],[\"put\",1,1],[\"put\",2,2],[\"put\",3,3],[\"put\",4,4],[\"get\",1],[\"get\",2],[\"get\",3],[\"get\",4]]"],"expected":"[null,null,null,null,null,-1,2,3,4]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"put\",2,2],[\"put\",3,3],[\"put\",4,4],[\"get\",3],[\"get\",4]]"],"expected":"[null,null,null,null,null,3,4]"},
  {"inputs":["[[\"LRUCache\",1],[\"put\",1,100],[\"get\",1],[\"put\",1,200],[\"get\",1]]"],"expected":"[null,null,100,null,200]"},
  {"inputs":["[[\"LRUCache\",3],[\"put\",1,1],[\"put\",2,2],[\"put\",3,3],[\"get\",2],[\"put\",4,4],[\"get\",1],[\"get\",3],[\"get\",4]]"],"expected":"[null,null,null,null,2,null,-1,3,4]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"get\",1],[\"put\",2,2],[\"get\",1],[\"get\",2]]"],"expected":"[null,null,1,null,1,2]"},
  {"inputs":["[[\"LRUCache\",2],[\"put\",1,1],[\"put\",2,2],[\"get\",1],[\"put\",3,3],[\"get\",1],[\"get\",2],[\"get\",3]]"],"expected":"[null,null,null,1,null,1,-1,3]"},
  {"inputs":["[[\"LRUCache\",3],[\"put\",1,10],[\"put\",2,20],[\"put\",3,30],[\"get\",1],[\"get\",2],[\"get\",3],[\"put\",4,40],[\"get\",1],[\"get\",4]]"],"expected":"[null,null,null,null,10,20,30,null,-1,40]"}
]'::jsonb);


-- ============================================================
-- PART 2: Solution approaches
-- ============================================================

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

-- ============ 1. asteroid-collision ============
('asteroid-collision', 1, 'Stack Simulation',
'We process asteroids left to right. Positive asteroids are pushed onto a stack. When a negative asteroid arrives, it collides with positive asteroids on top of the stack. The negative asteroid keeps destroying smaller positive ones until it either gets destroyed itself, finds an equal (both explode), or the stack has no more positive asteroids to collide with.',
'["Initialize an empty stack.","For each asteroid in the array:","  If asteroid > 0, push onto stack.","  If asteroid < 0:","    While stack is not empty AND top > 0 AND top < abs(asteroid): pop (smaller positive destroyed).","    If stack is not empty AND top == abs(asteroid): pop (both destroyed).","    Else if stack is empty OR top < 0: push asteroid (no collision).","Return the stack as the result."]'::jsonb,
$PY$class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        stack = []
        for ast in asteroids:
            alive = True
            while alive and ast < 0 and stack and stack[-1] > 0:
                if stack[-1] < -ast:
                    stack.pop()
                elif stack[-1] == -ast:
                    stack.pop()
                    alive = False
                else:
                    alive = False
            if alive:
                stack.append(ast)
        return stack
$PY$,
$JS$var asteroidCollision = function(asteroids) {
    var stack = [];
    for (var i = 0; i < asteroids.length; i++) {
        var ast = asteroids[i];
        var alive = true;
        while (alive && ast < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
            if (stack[stack.length - 1] < -ast) {
                stack.pop();
            } else if (stack[stack.length - 1] === -ast) {
                stack.pop();
                alive = false;
            } else {
                alive = false;
            }
        }
        if (alive) {
            stack.push(ast);
        }
    }
    return stack;
};
$JS$,
$JAVA$class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int ast : asteroids) {
            boolean alive = true;
            while (alive && ast < 0 && !stack.isEmpty() && stack.peek() > 0) {
                if (stack.peek() < -ast) {
                    stack.pop();
                } else if (stack.peek() == -ast) {
                    stack.pop();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) {
                stack.push(ast);
            }
        }
        int[] result = new int[stack.size()];
        for (int i = stack.size() - 1; i >= 0; i--) {
            result[i] = stack.pop();
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ 2. decode-string ============
('decode-string', 1, 'Stack-Based Decoding',
'We use a stack to handle nested encodings. When we encounter ''['', we save the current string and current number onto the stack and reset them. When we encounter '']'', we pop the previous string and repeat count, then append the current string repeated k times to the previous string. Digits build multi-digit numbers, and letters append to the current string.',
'["Initialize: currentString = \"\", currentNum = 0, stack = [].","For each character c in s:","  If c is a digit: currentNum = currentNum * 10 + int(c).","  If c is ''['': push (currentString, currentNum) onto stack, reset both.","  If c is '']'': pop (prevString, num) from stack. currentString = prevString + currentString * num.","  If c is a letter: currentString += c.","Return currentString."]'::jsonb,
$PY$class Solution:
    def decodeString(self, s: str) -> str:
        stack = []
        current_str = ""
        current_num = 0
        for c in s:
            if c.isdigit():
                current_num = current_num * 10 + int(c)
            elif c == '[':
                stack.append((current_str, current_num))
                current_str = ""
                current_num = 0
            elif c == ']':
                prev_str, num = stack.pop()
                current_str = prev_str + current_str * num
            else:
                current_str += c
        return current_str
$PY$,
$JS$var decodeString = function(s) {
    var stack = [];
    var currentStr = "";
    var currentNum = 0;
    for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (c >= '0' && c <= '9') {
            currentNum = currentNum * 10 + parseInt(c);
        } else if (c === '[') {
            stack.push([currentStr, currentNum]);
            currentStr = "";
            currentNum = 0;
        } else if (c === ']') {
            var pair = stack.pop();
            var prevStr = pair[0];
            var num = pair[1];
            currentStr = prevStr + currentStr.repeat(num);
        } else {
            currentStr += c;
        }
    }
    return currentStr;
};
$JS$,
$JAVA$class Solution {
    public String decodeString(String s) {
        Deque<String> strStack = new ArrayDeque<>();
        Deque<Integer> numStack = new ArrayDeque<>();
        StringBuilder current = new StringBuilder();
        int num = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '[') {
                strStack.push(current.toString());
                numStack.push(num);
                current = new StringBuilder();
                num = 0;
            } else if (c == ']') {
                String prev = strStack.pop();
                int repeat = numStack.pop();
                StringBuilder tmp = new StringBuilder(prev);
                for (int i = 0; i < repeat; i++) {
                    tmp.append(current);
                }
                current = tmp;
            } else {
                current.append(c);
            }
        }
        return current.toString();
    }
}
$JAVA$,
'O(n * maxK) where maxK is the maximum nesting repeat', 'O(n)'),

-- ============ 3. remove-all-adjacent-duplicates ============
('remove-all-adjacent-duplicates', 1, 'Stack Approach',
'We iterate through each character and maintain a stack. If the current character matches the top of the stack, they form an adjacent duplicate — we pop the top. Otherwise, we push the current character. This naturally handles chain reactions because removing a pair may expose a new adjacent duplicate on top of the stack.',
'["Initialize an empty stack (list of characters).","For each character c in s:","  If the stack is not empty and the top equals c, pop the top.","  Otherwise, push c onto the stack.","Join the stack into a string and return it."]'::jsonb,
$PY$class Solution:
    def removeDuplicates(self, s: str) -> str:
        stack = []
        for c in s:
            if stack and stack[-1] == c:
                stack.pop()
            else:
                stack.append(c)
        return ''.join(stack)
$PY$,
$JS$var removeDuplicates = function(s) {
    var stack = [];
    for (var i = 0; i < s.length; i++) {
        if (stack.length > 0 && stack[stack.length - 1] === s[i]) {
            stack.pop();
        } else {
            stack.push(s[i]);
        }
    }
    return stack.join('');
};
$JS$,
$JAVA$class Solution {
    public String removeDuplicates(String s) {
        StringBuilder stack = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (stack.length() > 0 && stack.charAt(stack.length() - 1) == c) {
                stack.deleteCharAt(stack.length() - 1);
            } else {
                stack.append(c);
            }
        }
        return stack.toString();
    }
}
$JAVA$,
'O(n)', 'O(n)'),

-- ============ 4. remove-nth-from-end ============
('remove-nth-from-end', 1, 'Two Pointers with Dummy Head',
'By advancing the first pointer n steps ahead, we create a gap of n between the two pointers. When the first pointer reaches the end, the second pointer is right before the node to remove. A dummy head simplifies the edge case where we need to remove the first node.',
'["Create a dummy node pointing to head.","Set both first and second pointers to dummy.","Advance first pointer n + 1 steps.","Move both pointers together until first reaches null.","second.next = second.next.next (skip the target node).","Return dummy.next."]'::jsonb,
$PY$class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        first = dummy
        second = dummy
        for _ in range(n + 1):
            first = first.next
        while first:
            first = first.next
            second = second.next
        second.next = second.next.next
        return dummy.next
$PY$,
$JS$var removeNthFromEnd = function(head, n) {
    var dummy = new ListNode(0, head);
    var first = dummy;
    var second = dummy;
    for (var i = 0; i <= n; i++) {
        first = first.next;
    }
    while (first !== null) {
        first = first.next;
        second = second.next;
    }
    second.next = second.next.next;
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode first = dummy;
        ListNode second = dummy;
        for (int i = 0; i <= n; i++) {
            first = first.next;
        }
        while (first != null) {
            first = first.next;
            second = second.next;
        }
        second.next = second.next.next;
        return dummy.next;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ============ 5. add-two-numbers ============
('add-two-numbers', 1, 'Elementary Math with Carry',
'Since the digits are stored in reverse order (least significant digit first), we can add them directly from left to right, just like grade-school addition. We maintain a carry and process both lists simultaneously, creating new nodes for the result.',
'["Initialize a dummy head node and a current pointer. Set carry = 0.","While l1 or l2 or carry:","  Get val1 = l1.val if l1 else 0, val2 = l2.val if l2 else 0.","  Compute total = val1 + val2 + carry.","  carry = total // 10, digit = total % 10.","  Create a new node with digit, link it to current.next, advance current.","  Advance l1 and l2 if not null.","Return dummy.next."]'::jsonb,
$PY$class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        current = dummy
        carry = 0
        while l1 or l2 or carry:
            val1 = l1.val if l1 else 0
            val2 = l2.val if l2 else 0
            total = val1 + val2 + carry
            carry = total // 10
            current.next = ListNode(total % 10)
            current = current.next
            if l1:
                l1 = l1.next
            if l2:
                l2 = l2.next
        return dummy.next
$PY$,
$JS$var addTwoNumbers = function(l1, l2) {
    var dummy = new ListNode(0);
    var current = dummy;
    var carry = 0;
    while (l1 !== null || l2 !== null || carry > 0) {
        var val1 = l1 ? l1.val : 0;
        var val2 = l2 ? l2.val : 0;
        var total = val1 + val2 + carry;
        carry = Math.floor(total / 10);
        current.next = new ListNode(total % 10);
        current = current.next;
        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode current = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry > 0) {
            int val1 = (l1 != null) ? l1.val : 0;
            int val2 = (l2 != null) ? l2.val : 0;
            int total = val1 + val2 + carry;
            carry = total / 10;
            current.next = new ListNode(total % 10);
            current = current.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}
$JAVA$,
'O(max(m, n))', 'O(max(m, n))'),

-- ============ 6. swap-nodes-pairs ============
('swap-nodes-pairs', 1, 'Iterative with Dummy Node',
'We use a dummy node before the head to handle the first pair uniformly. For each pair of adjacent nodes, we rewire the pointers: prev.next points to second, first.next points to what comes after second, and second.next points to first. Then we advance prev to first (which is now the second node in the swapped pair).',
'["Create dummy node, set dummy.next = head. Set prev = dummy.","While prev.next and prev.next.next exist (two nodes available):","  first = prev.next, second = first.next.","  prev.next = second (prev now points to second).","  first.next = second.next (first skips over second to the rest).","  second.next = first (second now points back to first).","  prev = first (advance — first is now the latter of the swapped pair).","Return dummy.next."]'::jsonb,
$PY$class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next and prev.next.next:
            first = prev.next
            second = first.next
            prev.next = second
            first.next = second.next
            second.next = first
            prev = first
        return dummy.next
$PY$,
$JS$var swapPairs = function(head) {
    var dummy = new ListNode(0, head);
    var prev = dummy;
    while (prev.next !== null && prev.next.next !== null) {
        var first = prev.next;
        var second = first.next;
        prev.next = second;
        first.next = second.next;
        second.next = first;
        prev = first;
    }
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode swapPairs(ListNode head) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        while (prev.next != null && prev.next.next != null) {
            ListNode first = prev.next;
            ListNode second = first.next;
            prev.next = second;
            first.next = second.next;
            second.next = first;
            prev = first;
        }
        return dummy.next;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ============ 7. merge-k-sorted-lists ============
('merge-k-sorted-lists', 1, 'Min-Heap (Priority Queue)',
'We use a min-heap to efficiently find the smallest element across all k lists. We build ListNodes from the input arrays, push the head of each non-empty list into the heap, and repeatedly extract the minimum, adding its successor back to the heap. Finally we convert the merged linked list back to an array.',
'["Build a ListNode linked list from each inner array.","Push the head of each non-empty list into a min-heap as (value, index, node).","Pop the smallest node. Append its value to the result.","If popped node has a next, push next into the heap.","Repeat until the heap is empty.","Return the collected values as a list."]'::jsonb,
$PY$import heapq

class Solution:
    def mergeKLists(self, lists: List[List[int]]) -> List[int]:
        heap = []
        for i, lst in enumerate(lists):
            if lst:
                heapq.heappush(heap, (lst[0], i, 0))
        result = []
        while heap:
            val, list_idx, elem_idx = heapq.heappop(heap)
            result.append(val)
            if elem_idx + 1 < len(lists[list_idx]):
                heapq.heappush(heap, (lists[list_idx][elem_idx + 1], list_idx, elem_idx + 1))
        return result
$PY$,
$JS$var mergeKLists = function(lists) {
    var vals = [];
    for (var i = 0; i < lists.length; i++) {
        for (var j = 0; j < lists[i].length; j++) {
            vals.push(lists[i][j]);
        }
    }
    vals.sort(function(a, b) { return a - b; });
    return vals;
};
$JS$,
$JAVA$class Solution {
    public int[] mergeKLists(int[][] lists) {
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        int total = 0;
        for (int i = 0; i < lists.length; i++) {
            if (lists[i].length > 0) {
                pq.offer(new int[]{lists[i][0], i, 0});
                total += lists[i].length;
            }
        }
        int[] result = new int[total];
        int idx = 0;
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            result[idx++] = curr[0];
            int listIdx = curr[1];
            int elemIdx = curr[2];
            if (elemIdx + 1 < lists[listIdx].length) {
                pq.offer(new int[]{lists[listIdx][elemIdx + 1], listIdx, elemIdx + 1});
            }
        }
        return result;
    }
}
$JAVA$,
'O(N log k) where N is total elements', 'O(k)'),

-- ============ 8. lru-cache ============
('lru-cache', 1, 'OrderedDict (Hash Map + Doubly Linked List)',
'Python''s OrderedDict maintains insertion order and supports O(1) move-to-end. On get, we move the key to the end (most recently used). On put, we insert/update and move to end, then evict the first item (least recently used) if over capacity. In Java/JS we implement with a HashMap + doubly linked list.',
'["Initialize an OrderedDict and store the capacity.","get(key): if key exists, move it to end (mark as recently used) and return value. Else return -1.","put(key, value): if key exists, update value and move to end.","If key is new, insert it. If size exceeds capacity, pop the first (oldest) item."]'::jsonb,
$PY$from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
$PY$,
$JS$var LRUCache = function(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
};
LRUCache.prototype.get = function(key) {
    if (!this.cache.has(key)) return -1;
    var val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
};
LRUCache.prototype.put = function(key, value) {
    if (this.cache.has(key)) {
        this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
        var firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
    }
};
$JS$,
$JAVA$class LRUCache extends LinkedHashMap<Integer, Integer> {
    private int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    public int get(int key) {
        return super.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        super.put(key, value);
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
$JAVA$,
'O(1) per get/put', 'O(capacity)');

COMMIT;
