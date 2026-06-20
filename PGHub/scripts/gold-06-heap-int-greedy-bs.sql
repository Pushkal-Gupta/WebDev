-- Gold upgrade: heap (4) + intervals (4) + greedy (4) + binary-search (4)
BEGIN;

-- ============== heap ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code>-th largest element in the array. Note that it is the <code>k</code>-th largest element in the sorted order, not the <code>k</code>-th distinct element.</p>
<p>Can you solve it without sorting?</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [3,2,1,5,6,4], k = 2
Output: 5</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [3,2,3,1,2,4,5,5,6], k = 4
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= k &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Min-heap of size k: scan the array, push each value, and pop when size exceeds k. The heap top at the end is the answer.',
    'O(n log k) time, O(k) space — strictly better than sorting when k is small.',
    'Quickselect gets you O(n) average time but O(n^2) worst case. Pick whichever the interviewer wants.'
  ]
WHERE id = 'kth-largest-element';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an array of integers <code>stones</code> where <code>stones[i]</code> is the weight of the <code>i</code>-th stone. Each turn, choose the two heaviest stones and smash them together. If they''re equal, both are destroyed; otherwise the difference becomes a new stone. Return the weight of the last remaining stone (or 0 if none remain).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  stones = [2,7,4,1,8,1]
Output: 1
Explanation: 8 vs 7 → 1; 4 vs 2 → 2; 2 vs 1 → 1; 1 vs 1 → 0; 1 vs 1 → 0. Last stone: 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  stones = [1]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= stones.length &lt;= 30</code></li>
  <li><code>1 &lt;= stones[i] &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'You repeatedly need the two largest elements — that''s a max-heap''s job.',
    'Python''s heapq is a min-heap; negate the values when pushing so the smallest negative is the largest original.',
    'Loop until the heap has 0 or 1 stones. Push the difference back if it''s nonzero.'
  ]
WHERE id = 'last-stone-weight';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array of <code>points</code> where <code>points[i] = [xi, yi]</code> represents a point on the X-Y plane and an integer <code>k</code>, return the <code>k</code> closest points to the origin <code>(0, 0)</code>.</p>
<p>The distance between two points on the X-Y plane is the Euclidean distance (i.e., <code>sqrt((x1 - x2)^2 + (y1 - y2)^2)</code>). The answer can be returned in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  points = [[1,3],[-2,2]], k = 1
Output: [[-2,2]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  points = [[3,3],[5,-1],[-2,4]], k = 2
Output: [[3,3],[-2,4]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= k &lt;= points.length &lt;= 10<sup>4</sup></code></li>
  <li><code>-10<sup>4</sup> &lt;= xi, yi &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'You don''t need real distances — comparing x^2 + y^2 is enough since sqrt is monotonic.',
    'Max-heap of size k keyed by squared distance: keep popping when size exceeds k so the heap holds the k smallest seen so far.',
    'O(n log k) time, O(k) space. Quickselect gives O(n) average if you need it.'
  ]
WHERE id = 'k-closest-points';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an array of CPU <code>tasks</code>, each represented by a letter A through Z, and a non-negative integer <code>n</code> that represents the cooldown period between two same tasks. Return the minimum number of intervals required to finish all tasks.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  tasks = ["A","A","A","B","B","B"], n = 2
Output: 8
Explanation: A → B → idle → A → B → idle → A → B.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  tasks = ["A","C","A","B","D","B"], n = 1
Output: 6
Explanation: No idles needed.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= tasks.length &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= n &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'Always schedule the task with the highest remaining count — that''s a max-heap on counts.',
    'Use a queue of "cooling down" tasks alongside the heap. After scheduling a task, push (count - 1, ready_time = now + n + 1) into the queue.',
    'Closed form: answer = max(len(tasks), (max_freq - 1) * (n + 1) + (number of tasks with max_freq)).'
  ]
WHERE id = 'task-scheduler';

-- ============== intervals ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an array of non-overlapping intervals <code>intervals</code> where <code>intervals[i] = [start_i, end_i]</code>, sorted in ascending order by <code>start_i</code>. You are also given an interval <code>newInterval = [start, end]</code>. Insert <code>newInterval</code> into <code>intervals</code> such that <code>intervals</code> is still sorted and still has no overlapping intervals (merging overlapping intervals if necessary).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output: [[1,2],[3,10],[12,16]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code></li>
  <li><code>intervals[i].length == 2</code></li>
</ul>
$$,
  hints = ARRAY[
    'Three phases: (1) push everything that ends before newInterval starts — they''re strictly to the left.',
    '(2) merge any interval that overlaps newInterval by extending newInterval''s start/end.',
    '(3) push the (now merged) newInterval, then push all remaining intervals that start after it.'
  ]
WHERE id = 'insert-interval';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array of <code>intervals</code> where <code>intervals[i] = [start_i, end_i]</code>, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  intervals = [[1,4],[4,5]]
Output: [[1,5]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= intervals.length &lt;= 10<sup>4</sup></code></li>
  <li><code>intervals[i].length == 2</code></li>
</ul>
$$,
  hints = ARRAY[
    'Sort the intervals by start time. After sorting, two intervals overlap iff the next one''s start is <= the current one''s end.',
    'Walk through them; if the current interval overlaps the last interval in your result, extend the last interval''s end to max(last.end, current.end).',
    'Otherwise append the current interval as a new entry. O(n log n) total dominated by the sort.'
  ]
WHERE id = 'merge-intervals';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array of intervals <code>intervals</code> where <code>intervals[i] = [start_i, end_i]</code>, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Explanation: Removing [1,3] makes the rest non-overlapping.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  intervals = [[1,2],[1,2],[1,2]]
Output: 2</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= intervals.length &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'This is the classic activity-selection problem in disguise: maximize the number kept, then return total - kept.',
    'Sort intervals by END time, then greedily keep the next one whose start is >= the last kept interval''s end.',
    'Sorting by END (not start) is the key insight that makes the greedy choice optimal.'
  ]
WHERE id = 'non-overlapping-intervals';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array of meeting time intervals consisting of start and end times <code>[[s1,e1],[s2,e2],...]</code>, determine if a person could attend all meetings. In other words, return <code>true</code> if no two meetings overlap.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  intervals = [[0,30],[5,10],[15,20]]
Output: false
Explanation: [0,30] overlaps with both [5,10] and [15,20].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  intervals = [[7,10],[2,4]]
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Sort intervals by start time.',
    'Walk through the sorted list; if any interval starts before the previous one ends, return false.',
    'Otherwise return true. O(n log n) for the sort, O(1) extra space (besides the sort).'
  ]
WHERE id = 'meeting-rooms';

-- ============== greedy ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code>, find the contiguous <strong>subarray</strong> (containing at least one number) which has the largest sum, and return its sum.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [1]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Kadane''s algorithm: track currentMax = the best subarray sum that ENDS at the current index.',
    'currentMax at index i = max(nums[i], currentMax_prev + nums[i]). If extending hurts, start fresh at nums[i].',
    'Track globalMax = max(globalMax, currentMax) as you go. O(n) time, O(1) space.'
  ]
WHERE id = 'max-subarray';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an integer array <code>nums</code>. You are initially positioned at the array''s first index, and each element in the array represents your maximum jump length at that position. Return <code>true</code> if you can reach the last index, or <code>false</code> otherwise.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 with max jump 0.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= nums[i] &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Greedy: track the farthest index you can currently reach.',
    'Walk left to right; at each index i, if i > farthest you''re stuck — return false. Otherwise update farthest = max(farthest, i + nums[i]).',
    'If you finish the loop, the last index is reachable. O(n) time.'
  ]
WHERE id = 'jump-game';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There are <code>n</code> gas stations along a circular route, where the amount of gas at the <code>i</code>-th station is <code>gas[i]</code>. You have a car with an unlimited gas tank and it costs <code>cost[i]</code> of gas to travel from the <code>i</code>-th station to the <code>(i + 1)</code>-th station. Return the starting gas station''s index if you can travel around the circuit once in the clockwise direction, otherwise return <code>-1</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  gas = [1,2,3,4,5], cost = [3,4,5,1,2]
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  gas = [2,3,4], cost = [3,4,3]
Output: -1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == gas.length == cost.length</code></li>
  <li><code>1 &lt;= n &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'If sum(gas) < sum(cost) the trip is impossible — return -1 immediately.',
    'Otherwise a valid start exists; walk through the stations tracking a running tank.',
    'Whenever the tank dips below zero, all stations from the current candidate to here are bad starts. Reset start to i + 1 and tank to 0.'
  ]
WHERE id = 'gas-station';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Alice has some number of cards and she wants to rearrange them into groups so that each group is of size <code>groupSize</code>, and consists of <code>groupSize</code> consecutive cards. Given an integer array <code>hand</code> where <code>hand[i]</code> is the value on the <code>i</code>-th card and an integer <code>groupSize</code>, return <code>true</code> if she can rearrange the cards, or <code>false</code> otherwise.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  hand = [1,2,3,6,2,3,4,7,8], groupSize = 3
Output: true
Explanation: Groups [1,2,3], [2,3,4], [6,7,8].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  hand = [1,2,3,4,5], groupSize = 4
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= hand.length &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= hand[i] &lt;= 10<sup>9</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'If hand.length is not divisible by groupSize, return false immediately.',
    'Count card frequencies in a hash map and sort the unique values, OR use a min-heap.',
    'Pop the smallest value v: it MUST be the start of a run. Check that v, v+1, ..., v+groupSize-1 all have positive counts; decrement them; repeat.'
  ]
WHERE id = 'hand-of-straights';

-- ============== binary-search ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>There is an integer array <code>nums</code> sorted in ascending order (with distinct values). It is rotated at some pivot index unknown to you (e.g. <code>[0,1,2,4,5,6,7]</code> might become <code>[4,5,6,7,0,1,2]</code>). Given the rotated array <code>nums</code> and an integer <code>target</code>, return the index of <code>target</code> if it is in <code>nums</code>, or <code>-1</code> if not. You must write an algorithm with <code>O(log n)</code> runtime complexity.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [4,5,6,7,0,1,2], target = 0
Output: 4</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [4,5,6,7,0,1,2], target = 3
Output: -1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 5000</code></li>
  <li>All values are unique.</li>
</ul>
$$,
  hints = ARRAY[
    'In every binary search step, exactly one half of nums[lo..hi] is sorted. Identify which half by comparing nums[lo] and nums[mid].',
    'If target falls inside the sorted half''s range, recurse there; otherwise recurse into the other half.',
    'Standard while lo <= hi loop, return mid on a hit, return -1 if it falls out.'
  ]
WHERE id = 'search-rotated';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Suppose an array of length <code>n</code> sorted in ascending order is rotated at some pivot. Given the sorted rotated array <code>nums</code> of <strong>unique</strong> elements, return the minimum element of this array. You must write an algorithm that runs in <code>O(log n)</code> time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [3,4,5,1,2]
Output: 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [4,5,6,7,0,1,2]
Output: 0</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == nums.length</code></li>
  <li><code>1 &lt;= n &lt;= 5000</code></li>
</ul>
$$,
  hints = ARRAY[
    'Binary search where the comparison is between nums[mid] and nums[hi] (the right end), not target.',
    'If nums[mid] > nums[hi], the minimum is to the right of mid → lo = mid + 1.',
    'If nums[mid] <= nums[hi], the minimum is at mid or to its left → hi = mid. Loop until lo == hi and return nums[lo].'
  ]
WHERE id = 'find-min-rotated';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Koko loves bananas. There are <code>n</code> piles of bananas, the <code>i</code>-th pile has <code>piles[i]</code> bananas. Koko can decide her per-hour eating speed <code>k</code>. Each hour she chooses a pile and eats <code>k</code> bananas (or all of them, if fewer). She wants to finish all bananas within <code>h</code> hours. Return the minimum integer <code>k</code> such that she can eat all bananas in time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  piles = [3,6,7,11], h = 8
Output: 4</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  piles = [30,11,23,4,20], h = 5
Output: 30</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= piles.length &lt;= 10<sup>4</sup></code></li>
  <li><code>piles.length &lt;= h &lt;= 10<sup>9</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Binary-search on the ANSWER: search k in [1, max(piles)] for the smallest k such that total hours fits in h.',
    'For a given k, total hours = sum(ceil(pile / k) for pile in piles).',
    'If hours <= h, k is feasible — try smaller. If hours > h, k is too small — try larger.'
  ]
WHERE id = 'koko-bananas';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an <code>m x n</code> integer matrix <code>matrix</code> with the following two properties: each row is sorted in non-decreasing order, and the first integer of each row is greater than the last integer of the previous row. Given an integer <code>target</code>, return <code>true</code> if <code>target</code> is in <code>matrix</code> or <code>false</code> otherwise. You must write a solution in <code>O(log(m * n))</code> time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == matrix.length</code>, <code>n == matrix[0].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'Treat the matrix as a single sorted array of length m*n and binary-search across it.',
    'Convert a flat index i into (row, col) = (i / n, i % n) when reading.',
    'Standard binary search loop, O(log(m*n)) total.'
  ]
WHERE id = 'search-2d-matrix';

COMMIT;

SELECT topic_id, COUNT(*) FILTER (WHERE position('Example' in description) > 0) AS gold_count, COUNT(*) AS total
FROM public."PGcode_problems"
WHERE topic_id IN ('heap','intervals','greedy','binary-search')
GROUP BY topic_id ORDER BY topic_id;
