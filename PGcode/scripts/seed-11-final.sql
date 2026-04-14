BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'rotate-array', 'implement-stack-queues', 'power-set-iterative', 'climbing-stairs-k',
  'interval-scheduling-maximization', 'replace-words', 'check-if-straight-line',
  'longest-subarray-ones-deletion', 'count-sorted-vowel-strings', 'remove-k-digits',
  'next-greater-element', 'longest-happy-string'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'rotate-array', 'implement-stack-queues', 'power-set-iterative', 'climbing-stairs-k',
  'interval-scheduling-maximization', 'replace-words', 'check-if-straight-line',
  'longest-subarray-ones-deletion', 'count-sorted-vowel-strings', 'remove-k-digits',
  'next-greater-element', 'longest-happy-string'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'rotate-array', 'implement-stack-queues', 'power-set-iterative', 'climbing-stairs-k',
  'interval-scheduling-maximization', 'replace-words', 'check-if-straight-line',
  'longest-subarray-ones-deletion', 'count-sorted-vowel-strings', 'remove-k-digits',
  'next-greater-element', 'longest-happy-string'
);

-- ============================================================
-- 1. rotate-array (Queue, Medium, LeetCode 189)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'rotate-array', 'queue', 'Rotate Array', 'Medium',
  $DESC$<p>Given an integer array <code>nums</code>, rotate the array to the right by <code>k</code> steps, where <code>k</code> is non-negative.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,2,3,4,5,6,7], k = 3
Output: [5,6,7,1,2,3,4]
Explanation:
rotate 1 step to the right: [7,1,2,3,4,5,6]
rotate 2 step to the right: [6,7,1,2,3,4,5]
rotate 3 steps to the right: [5,6,7,1,2,3,4]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [-1,-100,3,99], k = 2
Output: [3,99,-1,-100]
Explanation:
rotate 1 step to the right: [99,-1,-100,3]
rotate 2 steps to the right: [3,99,-1,-100]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
<li><code>-2<sup>31</sup> &lt;= nums[i] &lt;= 2<sup>31</sup> - 1</code></li>
<li><code>0 &lt;= k &lt;= 10<sup>5</sup></code></li>
</ul>$DESC$,
  '', ARRAY['The trick is to use three reversals: reverse the whole array, then reverse the first k elements, then reverse the rest.', 'Remember to handle k > n by taking k % n.', 'This approach works in O(n) time and O(1) space.'],
  '200', 'https://leetcode.com/problems/rotate-array/',
  'rotate', '[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb, 'List[int]',
  '[{"inputs":["[1,2,3,4,5,6,7]","3"],"expected":"[5,6,7,1,2,3,4]"},{"inputs":["[1,2,3,4,5,6,7]","1"],"expected":"[7,1,2,3,4,5,6]"},{"inputs":["[1,2,3,4,5,6,7]","7"],"expected":"[1,2,3,4,5,6,7]"},{"inputs":["[-1,-100,3,99]","2"],"expected":"[3,99,-1,-100]"},{"inputs":["[1,2]","1"],"expected":"[2,1]"},{"inputs":["[1,2]","3"],"expected":"[2,1]"},{"inputs":["[1]","0"],"expected":"[1]"},{"inputs":["[1]","1"],"expected":"[1]"},{"inputs":["[1,2,3]","2"],"expected":"[2,3,1]"},{"inputs":["[1,2,3]","4"],"expected":"[3,1,2]"},{"inputs":["[1,2,3,4]","2"],"expected":"[3,4,1,2]"},{"inputs":["[1,2,3,4,5]","0"],"expected":"[1,2,3,4,5]"},{"inputs":["[1,2,3,4,5]","5"],"expected":"[1,2,3,4,5]"},{"inputs":["[1,2,3,4,5]","2"],"expected":"[4,5,1,2,3]"},{"inputs":["[0,0,0,1]","1"],"expected":"[1,0,0,0]"},{"inputs":["[1,2,3,4,5,6]","3"],"expected":"[4,5,6,1,2,3]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'rotate-array', 1, 'Three Reversals',
  'Rotating an array by k positions is equivalent to taking the last k elements and placing them at the front. We can achieve this in-place by reversing the entire array, then reversing the first k elements, and finally reversing the remaining elements. This clever trick avoids extra space.',
  '["Normalize k by computing k = k % n (handles k larger than array length).","Reverse the entire array.","Reverse the first k elements.","Reverse the remaining n - k elements.","Return the modified array."]'::jsonb,
  $PY$class Solution:
    def rotate(self, nums: list[int], k: int) -> list[int]:
        n = len(nums)
        k = k % n
        nums.reverse()
        nums[:k] = nums[:k][::-1]
        nums[k:] = nums[k:][::-1]
        return nums$PY$,
  $JS$var rotate = function(nums, k) {
    const n = nums.length;
    k = k % n;
    function reverse(arr, start, end) {
        while (start < end) {
            [arr[start], arr[end]] = [arr[end], arr[start]];
            start++;
            end--;
        }
    }
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
    return nums;
};$JS$,
  $JAVA$class Solution {
    public int[] rotate(int[] nums, int k) {
        int n = nums.length;
        k = k % n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
        return nums;
    }

    private void reverse(int[] nums, int start, int end) {
        while (start < end) {
            int temp = nums[start];
            nums[start] = nums[end];
            nums[end] = temp;
            start++;
            end--;
        }
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 2. implement-stack-queues (Queue, Easy, LeetCode 225)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'implement-stack-queues', 'queue', 'Implement Stack using Queues', 'Easy',
  $DESC$<p>Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (<code>push</code>, <code>top</code>, <code>pop</code>, and <code>empty</code>).</p>
<p>Implement the <code>MyStack</code> class:</p>
<ul>
<li><code>void push(int x)</code> Pushes element x to the top of the stack.</li>
<li><code>int pop()</code> Removes the element on the top of the stack and returns it.</li>
<li><code>int top()</code> Returns the element on the top of the stack.</li>
<li><code>boolean empty()</code> Returns <code>true</code> if the stack is empty, <code>false</code> otherwise.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["MyStack","push","push","top","pop","empty"]
[[],[1],[2],[],[],[]]
Output:
[null,null,null,2,2,false]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:
["MyStack","push","push","push","top","pop","pop","empty"]
[[],[10],[20],[30],[],[],[],[]]
Output:
[null,null,null,null,30,30,20,true]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= x &lt;= 9</code></li>
<li>At most <code>100</code> calls will be made to <code>push</code>, <code>pop</code>, <code>top</code>, and <code>empty</code>.</li>
<li>All calls to <code>pop</code> and <code>top</code> are valid.</li>
</ul>$DESC$,
  '', ARRAY['After pushing an element, rotate the queue so the newest element is at the front.', 'Rotate by dequeuing and re-enqueuing n-1 elements after each push.', 'This makes push O(n) but pop and top O(1).'],
  '200', 'https://leetcode.com/problems/implement-stack-using-queues/',
  'MyStack', '[{"name":"operations","type":"List[List]"}]'::jsonb, 'List',
  '[{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"top\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,2,2,false]"},{"inputs":["[[\"MyStack\"],[\"push\",10],[\"push\",20],[\"top\"],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,20,20,10,true]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,1,true]"},{"inputs":["[[\"MyStack\"],[\"push\",5],[\"push\",3],[\"push\",7],[\"top\"],[\"pop\"],[\"top\"],[\"pop\"],[\"top\"]]"],"expected":"[null,null,null,null,7,7,3,3,5]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"pop\"],[\"push\",3],[\"top\"]]"],"expected":"[null,null,null,2,null,3]"},{"inputs":["[[\"MyStack\"],[\"push\",9],[\"top\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,9,9,true]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"push\",3],[\"pop\"],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,null,3,2,1,true]"},{"inputs":["[[\"MyStack\"],[\"push\",4],[\"push\",8],[\"pop\"],[\"push\",2],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,8,null,2,4,true]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"top\"],[\"top\"],[\"pop\"],[\"top\"]]"],"expected":"[null,null,null,2,2,2,1]"},{"inputs":["[[\"MyStack\"],[\"empty\"]]"],"expected":"[null,true]"},{"inputs":["[[\"MyStack\"],[\"push\",7],[\"empty\"],[\"top\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,false,7,7,true]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"push\",3],[\"push\",4],[\"pop\"],[\"push\",5],[\"pop\"],[\"pop\"]]"],"expected":"[null,null,null,null,null,4,null,5,3]"},{"inputs":["[[\"MyStack\"],[\"push\",6],[\"push\",6],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,6,6,true]"},{"inputs":["[[\"MyStack\"],[\"push\",3],[\"push\",1],[\"push\",4],[\"push\",1],[\"push\",5],[\"pop\"],[\"pop\"],[\"pop\"],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,null,null,null,5,1,4,1,3,true]"},{"inputs":["[[\"MyStack\"],[\"push\",2],[\"pop\"],[\"push\",4],[\"pop\"],[\"push\",6],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,2,null,4,null,6,true]"},{"inputs":["[[\"MyStack\"],[\"push\",1],[\"push\",2],[\"pop\"],[\"push\",3],[\"pop\"],[\"push\",4],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,2,null,3,null,4,1,true]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'implement-stack-queues', 1, 'Single Queue with Rotation',
  'After each push, we rotate the queue so that the most recently pushed element is at the front. This way pop and top simply operate on the front of the queue. We achieve LIFO order by re-enqueuing all existing elements after each new push.',
  '["push(x): Enqueue x, then dequeue and re-enqueue the previous n-1 elements so x moves to the front.","pop(): Dequeue from the front (this is the most recently pushed element).","top(): Peek at the front element.","empty(): Return whether the queue is empty."]'::jsonb,
  $PY$from collections import deque

class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x: int) -> None:
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self) -> int:
        return self.q.popleft()

    def top(self) -> int:
        return self.q[0]

    def empty(self) -> bool:
        return len(self.q) == 0$PY$,
  $JS$var MyStack = function() {
    this.queue = [];
};
MyStack.prototype.push = function(x) {
    this.queue.push(x);
    for (let i = 0; i < this.queue.length - 1; i++) {
        this.queue.push(this.queue.shift());
    }
};
MyStack.prototype.pop = function() {
    return this.queue.shift();
};
MyStack.prototype.top = function() {
    return this.queue[0];
};
MyStack.prototype.empty = function() {
    return this.queue.length === 0;
};$JS$,
  $JAVA$class MyStack {
    private java.util.Queue<Integer> queue = new java.util.LinkedList<>();

    public void push(int x) {
        queue.offer(x);
        for (int i = 0; i < queue.size() - 1; i++) {
            queue.offer(queue.poll());
        }
    }

    public int pop() {
        return queue.poll();
    }

    public int top() {
        return queue.peek();
    }

    public boolean empty() {
        return queue.isEmpty();
    }
}$JAVA$,
  'O(n) push, O(1) pop/top', 'O(n)'
);

-- ============================================================
-- 3. power-set-iterative (Recursion, Medium, LeetCode 78 variant)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'power-set-iterative', 'recursion', 'Power Set (Iterative)', 'Medium',
  $DESC$<p>Given an integer array <code>nums</code> of <strong>unique</strong> elements, return <em>all possible subsets (the power set)</em> using an <strong>iterative bit-manipulation</strong> approach.</p>
<p>The solution set must not contain duplicate subsets. Return the subsets in sorted order (each subset sorted, and the list of subsets sorted lexicographically).</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,2,3]
Output: [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0]
Output: [[],[0]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10</code></li>
<li><code>-10 &lt;= nums[i] &lt;= 10</code></li>
<li>All the numbers of <code>nums</code> are <strong>unique</strong>.</li>
</ul>$DESC$,
  '', ARRAY['There are 2^n subsets for an array of n elements.', 'Use a bitmask from 0 to 2^n - 1. Each bit position j indicates whether nums[j] is included.', 'Sort each subset and sort the overall list for deterministic output.'],
  '200', 'https://leetcode.com/problems/subsets/',
  'subsets', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'List[List[int]]',
  '[{"inputs":["[1,2,3]"],"expected":"[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"},{"inputs":["[0]"],"expected":"[[],[0]]"},{"inputs":["[1,2]"],"expected":"[[],[1],[1,2],[2]]"},{"inputs":["[]"],"expected":"[[]]"},{"inputs":["[3,1,2]"],"expected":"[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"},{"inputs":["[1,2,3,4]"],"expected":"[[],[1],[1,2],[1,2,3],[1,2,3,4],[1,2,4],[1,3],[1,3,4],[1,4],[2],[2,3],[2,3,4],[2,4],[3],[3,4],[4]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'power-set-iterative', 1, 'Bit Manipulation',
  'Each subset can be represented as a bitmask of length n. By iterating through all numbers from 0 to 2^n - 1, each bit pattern maps to a unique subset. Bit j being set means nums[j] is included. This gives us all 2^n subsets without recursion.',
  '["Calculate n = length of nums.","Iterate i from 0 to 2^n - 1.","For each i, build a subset by checking each bit j: if bit j is set, include nums[j].","Sort each subset internally, then sort the entire result list.","Return the sorted list of subsets."]'::jsonb,
  $PY$class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        n = len(nums)
        result = []
        for i in range(1 << n):
            subset = []
            for j in range(n):
                if i & (1 << j):
                    subset.append(nums[j])
            subset.sort()
            result.append(subset)
        result.sort()
        return result$PY$,
  $JS$var subsets = function(nums) {
    const n = nums.length;
    const result = [];
    for (let i = 0; i < (1 << n); i++) {
        const subset = [];
        for (let j = 0; j < n; j++) {
            if (i & (1 << j)) {
                subset.push(nums[j]);
            }
        }
        subset.sort((a, b) => a - b);
        result.push(subset);
    }
    result.sort((a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return a.length - b.length;
    });
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < (1 << n); i++) {
            List<Integer> subset = new ArrayList<>();
            for (int j = 0; j < n; j++) {
                if ((i & (1 << j)) != 0) {
                    subset.add(nums[j]);
                }
            }
            Collections.sort(subset);
            result.add(subset);
        }
        result.sort((a, b) -> {
            for (int k = 0; k < Math.min(a.size(), b.size()); k++) {
                if (!a.get(k).equals(b.get(k))) return a.get(k) - b.get(k);
            }
            return a.size() - b.size();
        });
        return result;
    }
}$JAVA$,
  'O(n * 2^n)', 'O(2^n)'
);

-- ============================================================
-- 4. climbing-stairs-k (Recursion, Medium, Custom)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'climbing-stairs-k', 'recursion', 'Climbing Stairs with K Steps', 'Medium',
  $DESC$<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top. Each time you can climb <code>1</code> to <code>k</code> steps. In how many distinct ways can you climb to the top?</p>
<p>This is a generalization of the classic Climbing Stairs problem where you can take up to k steps at a time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 3, k = 2
Output: 3
Explanation: There are three ways: 1+1+1, 1+2, 2+1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 5, k = 3
Output: 13
Explanation: With steps of 1, 2, or 3, there are 13 distinct ways to reach step 5.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: n = 0, k = 2
Output: 1
Explanation: There is one way to stay at the ground (do nothing).</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= n &lt;= 50</code></li>
<li><code>2 &lt;= k &lt;= 10</code></li>
</ul>$DESC$,
  '', ARRAY['This is a generalization of Fibonacci. dp[i] = sum of dp[i-1] + dp[i-2] + ... + dp[i-k].', 'Base case: dp[0] = 1 (one way to stand at the ground).', 'For each step i, sum up all dp[i-j] for j from 1 to min(k, i).'],
  '200', '',
  'climbStairs', '[{"name":"n","type":"int"},{"name":"k","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["0","2"],"expected":"1"},{"inputs":["1","2"],"expected":"1"},{"inputs":["2","2"],"expected":"2"},{"inputs":["3","2"],"expected":"3"},{"inputs":["4","2"],"expected":"5"},{"inputs":["5","2"],"expected":"8"},{"inputs":["10","2"],"expected":"89"},{"inputs":["3","3"],"expected":"4"},{"inputs":["4","3"],"expected":"7"},{"inputs":["5","3"],"expected":"13"},{"inputs":["1","5"],"expected":"1"},{"inputs":["2","5"],"expected":"2"},{"inputs":["5","5"],"expected":"16"},{"inputs":["6","3"],"expected":"24"},{"inputs":["7","2"],"expected":"21"},{"inputs":["10","3"],"expected":"274"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'climbing-stairs-k', 1, 'Dynamic Programming',
  'This is a generalized Fibonacci sequence. To reach step i, we could have come from any of the previous k steps. So dp[i] is the sum of dp[i-1], dp[i-2], ..., dp[i-k]. The base case dp[0] = 1 represents the single way to stay at the ground.',
  '["Create dp array of size n+1, initialize dp[0] = 1.","For each step i from 1 to n, compute dp[i] = sum of dp[i-j] for j from 1 to min(k, i).","Return dp[n]."]'::jsonb,
  $PY$class Solution:
    def climbStairs(self, n: int, k: int) -> int:
        dp = [0] * (n + 1)
        dp[0] = 1
        for i in range(1, n + 1):
            for j in range(1, min(k, i) + 1):
                dp[i] += dp[i - j]
        return dp[n]$PY$,
  $JS$var climbStairs = function(n, k) {
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= Math.min(k, i); j++) {
            dp[i] += dp[i - j];
        }
    }
    return dp[n];
};$JS$,
  $JAVA$class Solution {
    public int climbStairs(int n, int k) {
        int[] dp = new int[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= Math.min(k, i); j++) {
                dp[i] += dp[i - j];
            }
        }
        return dp[n];
    }
}$JAVA$,
  'O(n * k)', 'O(n)'
);

-- ============================================================
-- 5. interval-scheduling-maximization (Intervals, Medium, Custom)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'interval-scheduling-maximization', 'intervals', 'Interval Scheduling Maximization', 'Medium',
  $DESC$<p>You are given an array of intervals where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code> represents an event that runs from <code>start<sub>i</sub></code> to <code>end<sub>i</sub></code> (exclusive). You can only attend one event at a time.</p>
<p>Return the <strong>maximum number of non-overlapping intervals</strong> you can attend. Two intervals <code>[a, b)</code> and <code>[b, c)</code> are considered non-overlapping (you can attend both).</p>
<p><strong>Example 1:</strong></p>
<pre>Input: intervals = [[1,3],[2,4],[3,5]]
Output: 2
Explanation: Attend [1,3] and [3,5].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: intervals = [[1,2],[2,3],[3,4]]
Output: 3
Explanation: All intervals are non-overlapping.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: intervals = [[1,2],[1,2],[1,2]]
Output: 1
Explanation: All intervals overlap; you can only attend one.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code></li>
<li><code>intervals[i].length == 2</code></li>
<li><code>0 &lt;= start<sub>i</sub> &lt; end<sub>i</sub> &lt;= 10<sup>5</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Sort intervals by their end time.', 'Greedily pick the interval that ends earliest and does not overlap with the previous selection.', 'This classic greedy approach guarantees the maximum count.'],
  '200', '',
  'maxEvents', '[{"name":"intervals","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["[[1,3],[2,4],[3,5]]"],"expected":"2"},{"inputs":["[[1,2],[2,3],[3,4]]"],"expected":"3"},{"inputs":["[[1,2],[1,2],[1,2]]"],"expected":"1"},{"inputs":["[[1,10],[2,3],[4,5],[6,7]]"],"expected":"3"},{"inputs":["[[1,2]]"],"expected":"1"},{"inputs":["[]"],"expected":"0"},{"inputs":["[[1,3],[3,5],[5,7],[7,9]]"],"expected":"4"},{"inputs":["[[1,4],[2,3],[3,5]]"],"expected":"2"},{"inputs":["[[0,1],[1,2],[2,3],[3,4],[4,5]]"],"expected":"5"},{"inputs":["[[1,5],[2,6],[3,7],[4,8]]"],"expected":"1"},{"inputs":["[[1,2],[3,4],[5,6],[7,8]]"],"expected":"4"},{"inputs":["[[1,3],[2,5],[4,6],[5,7]]"],"expected":"2"},{"inputs":["[[1,2],[2,3]]"],"expected":"2"},{"inputs":["[[1,100],[2,3],[4,5],[6,7],[8,9]]"],"expected":"4"},{"inputs":["[[0,0],[1,1],[2,2]]"],"expected":"3"},{"inputs":["[[1,3],[1,3],[1,3],[1,3]]"],"expected":"1"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'interval-scheduling-maximization', 1, 'Greedy — Sort by End Time',
  'By always choosing the interval that ends earliest, we leave the most room for future intervals. This is the classic activity selection problem. Sorting by end time and greedily picking non-overlapping intervals guarantees the optimal solution.',
  '["Sort intervals by end time.","Initialize count = 0 and last_end = -infinity.","For each interval [start, end]: if start >= last_end, increment count and update last_end = end.","Return count."]'::jsonb,
  $PY$class Solution:
    def maxEvents(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        count = 0
        end = float('-inf')
        for s, e in intervals:
            if s >= end:
                count += 1
                end = e
        return count$PY$,
  $JS$var maxEvents = function(intervals) {
    intervals.sort((a, b) => a[1] - b[1]);
    let count = 0;
    let end = -Infinity;
    for (const [s, e] of intervals) {
        if (s >= end) {
            count++;
            end = e;
        }
    }
    return count;
};$JS$,
  $JAVA$class Solution {
    public int maxEvents(int[][] intervals) {
        java.util.Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
        int count = 0;
        int end = Integer.MIN_VALUE;
        for (int[] interval : intervals) {
            if (interval[0] >= end) {
                count++;
                end = interval[1];
            }
        }
        return count;
    }
}$JAVA$,
  'O(n log n)', 'O(1)'
);

-- ============================================================
-- 6. replace-words (Tries, Medium, LeetCode 648)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'replace-words', 'tries', 'Replace Words', 'Medium',
  $DESC$<p>In English, we have a concept called <strong>root</strong>, which can be followed by some other word to form another longer word — let''s call this word a <strong>derivative</strong>. For example, when the root <code>"help"</code> is followed by <code>"ful"</code>, we can form a derivative <code>"helpful"</code>.</p>
<p>Given a <code>dictionary</code> consisting of many roots and a <code>sentence</code> consisting of words separated by spaces, replace all the derivatives in the sentence with the root forming it. If a derivative can be replaced by more than one root, replace it with the root that has the <strong>shortest length</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"
Output: "the cat was rat by the bat"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: dictionary = ["a","b","c"], sentence = "aadsfasf absbd bbab cadsfabd"
Output: "a a b c"</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= dictionary.length &lt;= 1000</code></li>
<li><code>1 &lt;= dictionary[i].length &lt;= 100</code></li>
<li><code>dictionary[i]</code> consists of only lower-case letters.</li>
<li><code>1 &lt;= sentence.length &lt;= 10<sup>6</sup></code></li>
<li><code>sentence</code> consists of only lower-case letters and spaces.</li>
<li>The number of words in <code>sentence</code> is in the range <code>[1, 1000]</code>.</li>
</ul>$DESC$,
  '', ARRAY['Build a Trie from all the roots in the dictionary.', 'For each word in the sentence, traverse the Trie character by character.', 'If you hit a node marked as end-of-word, replace the word with the root found so far (shortest match).'],
  '200', 'https://leetcode.com/problems/replace-words/',
  'replaceWords', '[{"name":"dictionary","type":"List[str]"},{"name":"sentence","type":"str"}]'::jsonb, 'str',
  '[{"inputs":["[\"cat\",\"bat\",\"rat\"]","\"the cattle was rattled by the battery\""],"expected":"\"the cat was rat by the bat\""},{"inputs":["[\"a\",\"b\",\"c\"]","\"aadsfasf absbd bbab cadsfabd\""],"expected":"\"a a b c\""},{"inputs":["[\"a\",\"aa\",\"aaa\",\"aaaa\"]","\"a aa aaa aaaa aaaaa\""],"expected":"\"a a a a a\""},{"inputs":["[\"catt\",\"cat\",\"bat\",\"rat\"]","\"the cattle was rattled by the battery\""],"expected":"\"the cat was rat by the bat\""},{"inputs":["[\"ac\",\"ab\"]","\"it is abnormal\""],"expected":"\"it is ab\""},{"inputs":["[\"b\",\"br\",\"bre\",\"brea\",\"bread\",\"breading\"]","\"breading\""],"expected":"\"b\""},{"inputs":["[\"xyz\"]","\"hello world\""],"expected":"\"hello world\""},{"inputs":["[]","\"hello world\""],"expected":"\"hello world\""},{"inputs":["[\"the\",\"th\"]","\"the quick brown fox\""],"expected":"\"th quick brown fox\""},{"inputs":["[\"a\"]","\"a b c d\""],"expected":"\"a b c d\""},{"inputs":["[\"go\",\"gone\",\"going\"]","\"i am going to go now\""],"expected":"\"i am go to go now\""},{"inputs":["[\"cat\"]","\"catalog\""],"expected":"\"cat\""},{"inputs":["[\"pre\",\"suf\"]","\"prefix suffix infix\""],"expected":"\"pre suf infix\""},{"inputs":["[\"un\"]","\"unhappy unlikely usual\""],"expected":"\"un un usual\""},{"inputs":["[\"dog\",\"cat\",\"bird\"]","\"dogwood catfish birdhouse\""],"expected":"\"dog cat bird\""},{"inputs":["[\"a\",\"b\",\"c\",\"d\",\"e\"]","\"abcde edcba fghij\""],"expected":"\"a e fghij\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'replace-words', 1, 'Trie-Based Root Lookup',
  'We build a Trie from all dictionary roots. For each word in the sentence, we walk the Trie character by character. The moment we hit a node that marks the end of a root, we replace the word with that root (guaranteed shortest match since we traverse from left to right). If no root matches, the word stays unchanged.',
  '["Build a Trie: insert each root from the dictionary, marking end-of-word nodes.","Split the sentence into words.","For each word, traverse the Trie from the root node character by character.","If an end-of-word marker is found, replace the word with the prefix up to that point.","If no match is found (character not in Trie or word ends), keep the original word.","Join the processed words back with spaces and return."]'::jsonb,
  $PY$class Solution:
    def replaceWords(self, dictionary: list[str], sentence: str) -> str:
        trie = {}
        for root in dictionary:
            node = trie
            for ch in root:
                if ch not in node:
                    node[ch] = {}
                node = node[ch]
            node['#'] = True

        words = sentence.split()
        result = []
        for word in words:
            node = trie
            replaced = False
            for i, ch in enumerate(word):
                if ch not in node:
                    break
                node = node[ch]
                if '#' in node:
                    result.append(word[:i + 1])
                    replaced = True
                    break
            if not replaced:
                result.append(word)
        return ' '.join(result)$PY$,
  $JS$var replaceWords = function(dictionary, sentence) {
    const trie = {};
    for (const root of dictionary) {
        let node = trie;
        for (const ch of root) {
            if (!node[ch]) node[ch] = {};
            node = node[ch];
        }
        node['#'] = true;
    }

    return sentence.split(' ').map(word => {
        let node = trie;
        for (let i = 0; i < word.length; i++) {
            if (!node[word[i]]) break;
            node = node[word[i]];
            if (node['#']) return word.substring(0, i + 1);
        }
        return word;
    }).join(' ');
};$JS$,
  $JAVA$class Solution {
    private int[][] children = new int[100001][26];
    private boolean[] isEnd = new boolean[100001];
    private int cnt = 0;

    private void insert(String word) {
        int node = 0;
        for (char ch : word.toCharArray()) {
            int idx = ch - 'a';
            if (children[node][idx] == 0) {
                children[node][idx] = ++cnt;
            }
            node = children[node][idx];
        }
        isEnd[node] = true;
    }

    private String search(String word) {
        int node = 0;
        for (int i = 0; i < word.length(); i++) {
            int idx = word.charAt(i) - 'a';
            if (children[node][idx] == 0) break;
            node = children[node][idx];
            if (isEnd[node]) return word.substring(0, i + 1);
        }
        return word;
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        for (String root : dictionary) insert(root);
        String[] words = sentence.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(search(words[i]));
        }
        return sb.toString();
    }
}$JAVA$,
  'O(D + S)', 'O(D)'
);

-- ============================================================
-- 7. check-if-straight-line (Geometry, Easy, LeetCode 1232)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'check-if-straight-line', 'geometry', 'Check If It Is a Straight Line', 'Easy',
  $DESC$<p>You are given an array <code>coordinates</code>, <code>coordinates[i] = [x, y]</code>, where <code>[x, y]</code> represents the coordinate of a point. Check if these points make a straight line in the XY plane.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: coordinates = [[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: coordinates = [[1,1],[2,2],[3,4],[4,5],[5,6],[7,7]]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>2 &lt;= coordinates.length &lt;= 1000</code></li>
<li><code>coordinates[i].length == 2</code></li>
<li><code>-10<sup>4</sup> &lt;= coordinates[i][0], coordinates[i][1] &lt;= 10<sup>4</sup></code></li>
<li><code>coordinates</code> contains no duplicate points.</li>
</ul>$DESC$,
  '', ARRAY['Use the cross product to avoid division (and division-by-zero for vertical lines).', 'For points A, B, C to be collinear: (B.x - A.x) * (C.y - A.y) should equal (B.y - A.y) * (C.x - A.x).', 'Check all points against the first two points.'],
  '200', 'https://leetcode.com/problems/check-if-it-is-a-straight-line/',
  'checkStraightLine', '[{"name":"coordinates","type":"List[List[int]]"}]'::jsonb, 'bool',
  '[{"inputs":["[[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]"],"expected":"true"},{"inputs":["[[1,1],[2,2],[3,4],[4,5],[5,6],[7,7]]"],"expected":"false"},{"inputs":["[[0,0],[1,1],[2,2]]"],"expected":"true"},{"inputs":["[[0,0],[1,0],[2,0]]"],"expected":"true"},{"inputs":["[[0,0],[0,1],[0,2]]"],"expected":"true"},{"inputs":["[[1,1],[2,3]]"],"expected":"true"},{"inputs":["[[1,2],[2,4],[3,6],[4,8]]"],"expected":"true"},{"inputs":["[[1,1],[2,2],[3,3],[4,5]]"],"expected":"false"},{"inputs":["[[0,0],[5,5],[10,10],[15,15]]"],"expected":"true"},{"inputs":["[[-1,-1],[0,0],[1,1]]"],"expected":"true"},{"inputs":["[[-3,2],[0,0],[3,-2]]"],"expected":"true"},{"inputs":["[[1,1],[1,2],[1,3],[1,4]]"],"expected":"true"},{"inputs":["[[1,1],[2,1],[3,1],[4,2]]"],"expected":"false"},{"inputs":["[[0,0],[1,2],[2,4],[3,7]]"],"expected":"false"},{"inputs":["[[2,4],[4,8],[6,12]]"],"expected":"true"},{"inputs":["[[-1,0],[0,0],[1,0],[2,0]]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'check-if-straight-line', 1, 'Cross Product Collinearity Check',
  'Three points are collinear if and only if the cross product of vectors formed by them is zero. Using the cross product (dx1 * dy2 - dy1 * dx2) avoids floating-point division and handles vertical lines naturally. We check every point against the direction defined by the first two points.',
  '["Compute dx = x1 - x0 and dy = y1 - y0 from the first two points.","For each subsequent point (xi, yi), compute the cross product: dx * (yi - y0) - dy * (xi - x0).","If any cross product is non-zero, the points are not collinear — return false.","If all cross products are zero, return true."]'::jsonb,
  $PY$class Solution:
    def checkStraightLine(self, coordinates: list[list[int]]) -> bool:
        x0, y0 = coordinates[0]
        x1, y1 = coordinates[1]
        dx, dy = x1 - x0, y1 - y0
        for i in range(2, len(coordinates)):
            x, y = coordinates[i]
            if dx * (y - y0) != dy * (x - x0):
                return False
        return True$PY$,
  $JS$var checkStraightLine = function(coordinates) {
    const [x0, y0] = coordinates[0];
    const [x1, y1] = coordinates[1];
    const dx = x1 - x0, dy = y1 - y0;
    for (let i = 2; i < coordinates.length; i++) {
        const [x, y] = coordinates[i];
        if (dx * (y - y0) !== dy * (x - x0)) return false;
    }
    return true;
};$JS$,
  $JAVA$class Solution {
    public boolean checkStraightLine(int[][] coordinates) {
        int x0 = coordinates[0][0], y0 = coordinates[0][1];
        int dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;
        for (int i = 2; i < coordinates.length; i++) {
            int x = coordinates[i][0], y = coordinates[i][1];
            if (dx * (y - y0) != dy * (x - x0)) return false;
        }
        return true;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 8. longest-subarray-ones-deletion (Sliding Window, Medium, LeetCode 1493)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'longest-subarray-ones-deletion', 'sliding-window', 'Longest Subarray of 1s After Deleting One Element', 'Medium',
  $DESC$<p>Given a binary array <code>nums</code>, you should delete one element from it.</p>
<p>Return <em>the size of the longest non-empty subarray containing only <code>1</code>''s in the resulting array</em>. Return <code>0</code> if there is no such subarray.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,1,0,1]
Output: 3
Explanation: After deleting the 0, the array is [1,1,1] with length 3.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0,1,1,1,0,1,1,0,1]
Output: 5
Explanation: After deleting the 0 at index 4, [0,1,1,1,1,1,0,1] has a subarray [1,1,1,1,1] of length 5.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: nums = [1,1,1]
Output: 2
Explanation: You must delete one element. After deleting any element, the result has length 2.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
<li><code>nums[i]</code> is either <code>0</code> or <code>1</code>.</li>
</ul>$DESC$,
  '', ARRAY['Use a sliding window that allows at most one 0 inside.', 'Track the count of zeros in the window. Shrink from the left when zeros exceed 1.', 'The answer is window_size - 1 (since you must delete one element).'],
  '200', 'https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/',
  'longestSubarray', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[1,1,0,1]"],"expected":"3"},{"inputs":["[0,1,1,1,0,1,1,0,1]"],"expected":"5"},{"inputs":["[1,1,1]"],"expected":"2"},{"inputs":["[0,0,0]"],"expected":"0"},{"inputs":["[1,0,1]"],"expected":"2"},{"inputs":["[1]"],"expected":"0"},{"inputs":["[0]"],"expected":"0"},{"inputs":["[1,1,0,0,1,1,1,0,1]"],"expected":"4"},{"inputs":["[1,0,0,1,0]"],"expected":"1"},{"inputs":["[0,1,0]"],"expected":"1"},{"inputs":["[1,1,1,0,1,1,1,1]"],"expected":"7"},{"inputs":["[1,0,1,0,1]"],"expected":"2"},{"inputs":["[0,0,1,1,0,0]"],"expected":"2"},{"inputs":["[1,1,1,1]"],"expected":"3"},{"inputs":["[0,1,1,0,1,1,0]"],"expected":"4"},{"inputs":["[1,0,1,1,1,0,1]"],"expected":"4"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'longest-subarray-ones-deletion', 1, 'Sliding Window',
  'We maintain a window that contains at most one zero. The window represents a subarray where if we delete the zero (or any one element if all ones), we get a contiguous block of ones. The answer is the maximum window size minus 1 (we must delete exactly one element).',
  '["Initialize left = 0, zeros = 0, best = 0.","Expand right pointer: if nums[right] == 0, increment zeros.","While zeros > 1, shrink from the left: if nums[left] == 0, decrement zeros; increment left.","Update best = max(best, right - left). Note: right - left (not right - left + 1) because we must delete one element.","Return best."]'::jsonb,
  $PY$class Solution:
    def longestSubarray(self, nums: list[int]) -> int:
        left = 0
        zeros = 0
        best = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zeros += 1
            while zeros > 1:
                if nums[left] == 0:
                    zeros -= 1
                left += 1
            best = max(best, right - left)
        return best$PY$,
  $JS$var longestSubarray = function(nums) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < nums.length; right++) {
        if (nums[right] === 0) zeros++;
        while (zeros > 1) {
            if (nums[left] === 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left);
    }
    return best;
};$JS$,
  $JAVA$class Solution {
    public int longestSubarray(int[] nums) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > 1) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = Math.max(best, right - left);
        }
        return best;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 9. count-sorted-vowel-strings (DP, Medium, LeetCode 1641)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'count-sorted-vowel-strings', 'dp', 'Count Sorted Vowel Strings', 'Medium',
  $DESC$<p>Given an integer <code>n</code>, return the <em>number of strings of length <code>n</code> that consist only of vowels (<code>a</code>, <code>e</code>, <code>i</code>, <code>o</code>, <code>u</code>) and are <strong>lexicographically sorted</strong></em>.</p>
<p>A string <code>s</code> is <strong>lexicographically sorted</strong> if for all valid <code>i</code>, <code>s[i]</code> is the same as or comes before <code>s[i+1]</code> in the alphabet.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 1
Output: 5
Explanation: The 5 sorted strings are ["a","e","i","o","u"].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 2
Output: 15
Explanation: The 15 sorted strings are:
"aa","ae","ai","ao","au","ee","ei","eo","eu","ii","io","iu","oo","ou","uu"</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: n = 33
Output: 66045</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= n &lt;= 50</code></li>
</ul>$DESC$,
  '', ARRAY['Think of this as a combinations with repetition problem: choose n vowels in non-decreasing order.', 'Use DP where dp[j] represents the number of strings ending with the j-th vowel.', 'Each dp[j] accumulates from dp[0..j] because we can extend any string ending with a vowel <= j.'],
  '200', 'https://leetcode.com/problems/count-sorted-vowel-strings/',
  'countVowelStrings', '[{"name":"n","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["1"],"expected":"5"},{"inputs":["2"],"expected":"15"},{"inputs":["3"],"expected":"35"},{"inputs":["4"],"expected":"70"},{"inputs":["5"],"expected":"126"},{"inputs":["6"],"expected":"210"},{"inputs":["7"],"expected":"330"},{"inputs":["8"],"expected":"495"},{"inputs":["9"],"expected":"715"},{"inputs":["10"],"expected":"1001"},{"inputs":["12"],"expected":"1820"},{"inputs":["15"],"expected":"3876"},{"inputs":["20"],"expected":"10626"},{"inputs":["25"],"expected":"23751"},{"inputs":["33"],"expected":"66045"},{"inputs":["50"],"expected":"316251"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'count-sorted-vowel-strings', 1, 'Dynamic Programming — Prefix Sum',
  'We use a DP array of size 5 where dp[j] counts strings of the current length that end with the j-th vowel. Initially each vowel contributes 1 string of length 1. For each additional character, dp[j] accumulates all values dp[0..j] because a sorted string ending with vowel j can be extended by any vowel >= j. This is equivalent to a running prefix sum across the 5 vowels, repeated n-1 times.',
  '["Initialize dp = [1, 1, 1, 1, 1] for strings of length 1.","For each length from 2 to n, compute prefix sums: dp[j] += dp[j-1] for j from 1 to 4.","Return sum(dp)."]'::jsonb,
  $PY$class Solution:
    def countVowelStrings(self, n: int) -> int:
        dp = [1, 1, 1, 1, 1]
        for i in range(1, n):
            for j in range(1, 5):
                dp[j] += dp[j - 1]
        return sum(dp)$PY$,
  $JS$var countVowelStrings = function(n) {
    const dp = [1, 1, 1, 1, 1];
    for (let i = 1; i < n; i++) {
        for (let j = 1; j < 5; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp.reduce((a, b) => a + b, 0);
};$JS$,
  $JAVA$class Solution {
    public int countVowelStrings(int n) {
        int[] dp = {1, 1, 1, 1, 1};
        for (int i = 1; i < n; i++) {
            for (int j = 1; j < 5; j++) {
                dp[j] += dp[j - 1];
            }
        }
        int sum = 0;
        for (int v : dp) sum += v;
        return sum;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 10. remove-k-digits (Stack, Medium, LeetCode 402)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'remove-k-digits', 'stack', 'Remove K Digits', 'Medium',
  $DESC$<p>Given string <code>num</code> representing a non-negative integer and an integer <code>k</code>, return the <em>smallest possible integer after removing <code>k</code> digits from <code>num</code></em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: num = "1432219", k = 3
Output: "1219"
Explanation: Remove 4, 3, and the first 2 to form "1219", the smallest value.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: num = "10200", k = 1
Output: "200"
Explanation: Remove the leading 1, the result is "200".</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: num = "10", k = 2
Output: "0"
Explanation: Remove all digits. The result is "0".</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= k &lt;= num.length &lt;= 10<sup>5</sup></code></li>
<li><code>num</code> consists of only digits.</li>
<li><code>num</code> does not have any leading zeros except for the zero itself.</li>
</ul>$DESC$,
  '', ARRAY['Use a monotonic increasing stack: pop digits from the stack when the current digit is smaller.', 'Each pop represents removing a digit. Stop popping when k reaches 0.', 'After processing, remove any remaining digits from the end, then strip leading zeros.'],
  '200', 'https://leetcode.com/problems/remove-k-digits/',
  'removeKdigits', '[{"name":"num","type":"str"},{"name":"k","type":"int"}]'::jsonb, 'str',
  '[{"inputs":["\"1432219\"","3"],"expected":"\"1219\""},{"inputs":["\"10200\"","1"],"expected":"\"200\""},{"inputs":["\"10\"","2"],"expected":"\"0\""},{"inputs":["\"9\"","1"],"expected":"\"0\""},{"inputs":["\"112\"","1"],"expected":"\"11\""},{"inputs":["\"10001\"","1"],"expected":"\"1\""},{"inputs":["\"1234567890\"","9"],"expected":"\"0\""},{"inputs":["\"100\"","1"],"expected":"\"0\""},{"inputs":["\"54321\"","1"],"expected":"\"4321\""},{"inputs":["\"54321\"","2"],"expected":"\"321\""},{"inputs":["\"11111\"","3"],"expected":"\"11\""},{"inputs":["\"1111\"","0"],"expected":"\"1111\""},{"inputs":["\"10\"","1"],"expected":"\"0\""},{"inputs":["\"1230\"","1"],"expected":"\"120\""},{"inputs":["\"4321\"","3"],"expected":"\"1\""},{"inputs":["\"12345\"","2"],"expected":"\"123\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'remove-k-digits', 1, 'Monotonic Stack',
  'To make the number as small as possible, we want smaller digits at the front. We use a stack: for each digit, we pop larger digits from the stack (each pop uses one of our k removals). This greedily ensures the leftmost digits are as small as possible. After processing, we trim remaining removals from the end and strip leading zeros.',
  '["Initialize an empty stack.","For each digit d in num: while k > 0 and stack is not empty and stack top > d, pop from stack and decrement k.","Push d onto the stack.","After processing all digits, remove the last k digits from the stack (if k > 0).","Join the stack into a string, strip leading zeros.","Return the result, or \"0\" if empty."]'::jsonb,
  $PY$class Solution:
    def removeKdigits(self, num: str, k: int) -> str:
        stack = []
        for d in num:
            while k > 0 and stack and stack[-1] > d:
                stack.pop()
                k -= 1
            stack.append(d)
        while k > 0:
            stack.pop()
            k -= 1
        result = ''.join(stack).lstrip('0')
        return result if result else '0'$PY$,
  $JS$var removeKdigits = function(num, k) {
    const stack = [];
    for (const d of num) {
        while (k > 0 && stack.length > 0 && stack[stack.length - 1] > d) {
            stack.pop();
            k--;
        }
        stack.push(d);
    }
    while (k > 0) {
        stack.pop();
        k--;
    }
    const result = stack.join('').replace(/^0+/, '');
    return result || '0';
};$JS$,
  $JAVA$class Solution {
    public String removeKdigits(String num, int k) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char d : num.toCharArray()) {
            while (k > 0 && !stack.isEmpty() && stack.peek() > d) {
                stack.pop();
                k--;
            }
            stack.push(d);
        }
        while (k > 0) {
            stack.pop();
            k--;
        }
        StringBuilder sb = new StringBuilder();
        while (!stack.isEmpty()) {
            sb.append(stack.pollLast());
        }
        String result = sb.toString().replaceFirst("^0+", "");
        return result.isEmpty() ? "0" : result;
    }
}$JAVA$,
  'O(n)', 'O(n)'
);

-- ============================================================
-- 11. next-greater-element (Stack, Easy, LeetCode 496)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'next-greater-element', 'stack', 'Next Greater Element I', 'Easy',
  $DESC$<p>The <strong>next greater element</strong> of some element <code>x</code> in an array is the <strong>first greater</strong> element that is <strong>to the right</strong> of <code>x</code> in the same array.</p>
<p>You are given two <strong>distinct 0-indexed</strong> integer arrays <code>nums1</code> and <code>nums2</code>, where <code>nums1</code> is a subset of <code>nums2</code>.</p>
<p>For each <code>0 &lt;= i &lt; nums1.length</code>, find the index <code>j</code> such that <code>nums1[i] == nums2[j]</code> and determine the <strong>next greater element</strong> of <code>nums2[j]</code> in <code>nums2</code>. If there is no next greater element, the answer is <code>-1</code>.</p>
<p>Return an array <code>ans</code> of size <code>nums1.length</code> such that <code>ans[i]</code> is the next greater element of <code>nums1[i]</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums1 = [4,1,2], nums2 = [1,3,4,2]
Output: [-1,3,-1]
Explanation:
For 4: no next greater in nums2 -> -1.
For 1: next greater in nums2 is 3.
For 2: no next greater in nums2 -> -1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums1 = [2,4], nums2 = [1,2,3,4]
Output: [3,-1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums1.length &lt;= nums2.length &lt;= 1000</code></li>
<li><code>0 &lt;= nums1[i], nums2[i] &lt;= 10<sup>4</sup></code></li>
<li>All integers in <code>nums1</code> and <code>nums2</code> are <strong>unique</strong>.</li>
<li>All the integers of <code>nums1</code> also appear in <code>nums2</code>.</li>
</ul>$DESC$,
  '', ARRAY['Use a monotonic decreasing stack to find the next greater element for every value in nums2.', 'When you encounter a value larger than the stack top, pop and record it as the next greater element.', 'Store the results in a hash map for O(1) lookup when processing nums1.'],
  '200', 'https://leetcode.com/problems/next-greater-element-i/',
  'nextGreaterElement', '[{"name":"nums1","type":"List[int]"},{"name":"nums2","type":"List[int]"}]'::jsonb, 'List[int]',
  '[{"inputs":["[4,1,2]","[1,3,4,2]"],"expected":"[-1,3,-1]"},{"inputs":["[2,4]","[1,2,3,4]"],"expected":"[3,-1]"},{"inputs":["[1,3,5,2,4]","[6,5,4,3,2,1,7]"],"expected":"[7,7,7,7,7]"},{"inputs":["[1]","[1]"],"expected":"[-1]"},{"inputs":["[1]","[1,2]"],"expected":"[2]"},{"inputs":["[2]","[1,2]"],"expected":"[-1]"},{"inputs":["[4,1,2]","[2,1,3,4]"],"expected":"[-1,3,3]"},{"inputs":["[3,1,2]","[3,2,1]"],"expected":"[-1,-1,-1]"},{"inputs":["[1,2,3]","[3,2,1,4]"],"expected":"[4,4,4]"},{"inputs":["[5]","[5,4,3,2,1]"],"expected":"[-1]"},{"inputs":["[1,2]","[2,1]"],"expected":"[-1,-1]"},{"inputs":["[3]","[1,2,3,4,5]"],"expected":"[4]"},{"inputs":["[2,3]","[1,2,3]"],"expected":"[3,-1]"},{"inputs":["[1,3]","[1,2,3,4]"],"expected":"[2,4]"},{"inputs":["[4,2]","[4,3,2,1]"],"expected":"[-1,-1]"},{"inputs":["[1,2,3,4]","[1,2,3,4]"],"expected":"[2,3,4,-1]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'next-greater-element', 1, 'Monotonic Stack with Hash Map',
  'We process nums2 using a monotonic decreasing stack. When we encounter an element larger than the stack top, we know it is the next greater element for that top value. We pop and record the mapping. After processing all of nums2, we look up each element of nums1 in the map.',
  '["Initialize an empty stack and an empty hash map (nge).","Iterate through nums2: while the stack is not empty and the current element > stack top, pop the top and map it to the current element.","Push the current element onto the stack.","For each element in nums1, look up its next greater element in the map. If not found, use -1.","Return the result array."]'::jsonb,
  $PY$class Solution:
    def nextGreaterElement(self, nums1: list[int], nums2: list[int]) -> list[int]:
        stack = []
        nge = {}
        for num in nums2:
            while stack and stack[-1] < num:
                nge[stack.pop()] = num
            stack.append(num)
        return [nge.get(x, -1) for x in nums1]$PY$,
  $JS$var nextGreaterElement = function(nums1, nums2) {
    const stack = [];
    const nge = new Map();
    for (const num of nums2) {
        while (stack.length > 0 && stack[stack.length - 1] < num) {
            nge.set(stack.pop(), num);
        }
        stack.push(num);
    }
    return nums1.map(x => nge.has(x) ? nge.get(x) : -1);
};$JS$,
  $JAVA$class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Deque<Integer> stack = new ArrayDeque<>();
        Map<Integer, Integer> nge = new HashMap<>();
        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num) {
                nge.put(stack.pop(), num);
            }
            stack.push(num);
        }
        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            result[i] = nge.getOrDefault(nums1[i], -1);
        }
        return result;
    }
}$JAVA$,
  'O(n + m)', 'O(n)'
);

-- ============================================================
-- 12. longest-happy-string (Greedy, Medium, LeetCode 1405)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'longest-happy-string', 'greedy', 'Longest Happy String', 'Medium',
  $DESC$<p>A string <code>s</code> is called <strong>happy</strong> if it satisfies the following conditions:</p>
<ul>
<li><code>s</code> only contains the letters <code>''a''</code>, <code>''b''</code>, and <code>''c''</code>.</li>
<li><code>s</code> does not contain any of <code>"aaa"</code>, <code>"bbb"</code>, or <code>"ccc"</code> as a substring.</li>
</ul>
<p>Given three integers <code>a</code>, <code>b</code>, and <code>c</code>, return the <strong>longest possible happy string</strong>. If there are multiple longest happy strings, return any of them. If there is no such string, return the empty string <code>""</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: a = 1, b = 1, c = 7
Output: "ccaccbcc"
Explanation: "ccbccacc" would also be correct.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: a = 7, b = 1, c = 0
Output: "aabaa"
Explanation: It is the only correct answer in this case.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= a, b, c &lt;= 100</code></li>
<li><code>a + b + c &gt; 0</code></li>
</ul>$DESC$,
  '', ARRAY['Use a max-heap (priority queue) to always pick the character with the highest remaining count.', 'If the last two characters are the same as the top of the heap, pick the second highest instead.', 'Stop when no valid character can be placed.'],
  '200', 'https://leetcode.com/problems/longest-happy-string/',
  'longestDiverseString', '[{"name":"a","type":"int"},{"name":"b","type":"int"},{"name":"c","type":"int"}]'::jsonb, 'str',
  '[{"inputs":["1","1","7"],"expected":"\"ccaccbcc\""},{"inputs":["7","1","0"],"expected":"\"aabaa\""},{"inputs":["2","2","1"],"expected":"\"ababc\""},{"inputs":["0","0","0"],"expected":"\"\""},{"inputs":["1","0","0"],"expected":"\"a\""},{"inputs":["0","1","0"],"expected":"\"b\""},{"inputs":["0","0","1"],"expected":"\"c\""},{"inputs":["1","1","1"],"expected":"\"abc\""},{"inputs":["4","4","4"],"expected":"\"abcabcabcabc\""},{"inputs":["0","8","11"],"expected":"\"ccbccbcbcbcbcbcbcbc\""},{"inputs":["1","1","2"],"expected":"\"cabc\""},{"inputs":["3","3","3"],"expected":"\"abcabcabc\""},{"inputs":["5","0","2"],"expected":"\"aacaaca\""},{"inputs":["0","5","5"],"expected":"\"bcbcbcbcbc\""},{"inputs":["2","0","0"],"expected":"\"aa\""},{"inputs":["100","0","0"],"expected":"\"aa\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'longest-happy-string', 1, 'Greedy with Max-Heap',
  'We greedily pick the character with the highest remaining count to maximize the string length. If the last two characters are the same as the top candidate, we switch to the second-highest to avoid three consecutive identical characters. We stop when no valid character can be placed.',
  '["Push (count, char) pairs into a max-heap for each non-zero count.","While the heap is not empty, pop the top element (highest count).","If the last 2 characters of result equal this character, pop the second element instead and push the first back.","Append the chosen character, decrement its count, and push it back if count > 0.","If no valid character can be placed (heap empty after conflict), stop.","Return the result string."]'::jsonb,
  $PY$import heapq

class Solution:
    def longestDiverseString(self, a: int, b: int, c: int) -> str:
        heap = []
        if a > 0: heapq.heappush(heap, (-a, 'a'))
        if b > 0: heapq.heappush(heap, (-b, 'b'))
        if c > 0: heapq.heappush(heap, (-c, 'c'))

        result = []
        while heap:
            cnt1, ch1 = heapq.heappop(heap)
            if len(result) >= 2 and result[-1] == ch1 and result[-2] == ch1:
                if not heap:
                    break
                cnt2, ch2 = heapq.heappop(heap)
                result.append(ch2)
                cnt2 += 1
                if cnt2 < 0:
                    heapq.heappush(heap, (cnt2, ch2))
                heapq.heappush(heap, (cnt1, ch1))
            else:
                result.append(ch1)
                cnt1 += 1
                if cnt1 < 0:
                    heapq.heappush(heap, (cnt1, ch1))
        return ''.join(result)$PY$,
  $JS$var longestDiverseString = function(a, b, c) {
    const heap = [];
    if (a > 0) heap.push([-a, 'a']);
    if (b > 0) heap.push([-b, 'b']);
    if (c > 0) heap.push([-c, 'c']);
    heap.sort((x, y) => x[0] - y[0] || x[1].localeCompare(y[1]));

    const result = [];
    while (heap.length > 0) {
        heap.sort((x, y) => x[0] - y[0] || x[1].localeCompare(y[1]));
        const [cnt1, ch1] = heap[0];
        if (result.length >= 2 && result[result.length - 1] === ch1 && result[result.length - 2] === ch1) {
            if (heap.length < 2) break;
            heap[1][0]++;
            result.push(heap[1][1]);
            if (heap[1][0] === 0) heap.splice(1, 1);
        } else {
            heap[0][0]++;
            result.push(ch1);
            if (heap[0][0] === 0) heap.splice(0, 1);
        }
    }
    return result.join('');
};$JS$,
  $JAVA$class Solution {
    public String longestDiverseString(int a, int b, int c) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) ->
            y[0] != x[0] ? y[0] - x[0] : x[1] - y[1]);
        if (a > 0) heap.offer(new int[]{a, 0});
        if (b > 0) heap.offer(new int[]{b, 1});
        if (c > 0) heap.offer(new int[]{c, 2});

        StringBuilder sb = new StringBuilder();
        char[] chars = {'a', 'b', 'c'};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int len = sb.length();
            if (len >= 2 && sb.charAt(len - 1) == chars[top[1]] && sb.charAt(len - 2) == chars[top[1]]) {
                if (heap.isEmpty()) break;
                int[] second = heap.poll();
                sb.append(chars[second[1]]);
                second[0]--;
                if (second[0] > 0) heap.offer(second);
                heap.offer(top);
            } else {
                sb.append(chars[top[1]]);
                top[0]--;
                if (top[0] > 0) heap.offer(top);
            }
        }
        return sb.toString();
    }
}$JAVA$,
  'O((a + b + c) log 3)', 'O(1)'
);

COMMIT;
