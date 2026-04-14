BEGIN;

-- ============================================================
-- QUEUE PROBLEMS — 6 new problems
-- ============================================================

-- ============================================================
-- PART 1: Problem rows
-- ============================================================

INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url,
   method_name, params, return_type, test_cases)
VALUES

-- ============ 1. Implement Queue using Stacks (Easy, Pattern B) ============
('implement-queue-stacks', 'queue', 'Implement Queue using Stacks', 'Easy',
$DESC$
<p>Implement a first-in first-out (FIFO) queue using only two stacks. The implemented queue should support all the functions of a normal queue: <code>push</code>, <code>peek</code>, <code>pop</code>, and <code>empty</code>.</p>
<p>Implement the <code>MyQueue</code> class:</p>
<ul>
  <li><code>push(x)</code> pushes element <code>x</code> to the back of the queue.</li>
  <li><code>pop()</code> removes the element from the front of the queue and returns it.</li>
  <li><code>peek()</code> returns the element at the front of the queue.</li>
  <li><code>empty()</code> returns <code>true</code> if the queue is empty, <code>false</code> otherwise.</li>
</ul>

<p><strong>Example 1:</strong></p>
<pre>Input:
["MyQueue","push","push","peek","pop","empty"]
[[],[1],[2],[],[],[]]
Output:
[null,null,null,1,1,false]

Explanation:
MyQueue myQueue = new MyQueue();
myQueue.push(1);
myQueue.push(2);
myQueue.peek();  // return 1
myQueue.pop();   // return 1
myQueue.empty(); // return false</pre>

<p><strong>Example 2:</strong></p>
<pre>Input:
["MyQueue","push","push","push","pop","pop","empty"]
[[],[10],[20],[30],[],[],[]]
Output:
[null,null,null,null,10,20,false]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= x &lt;= 9</code></li>
  <li>At most <code>100</code> calls will be made to <code>push</code>, <code>pop</code>, <code>peek</code>, and <code>empty</code>.</li>
  <li>All calls to <code>pop</code> and <code>peek</code> are valid (the queue is non-empty when called).</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use one stack for pushing and another for popping. Only transfer elements when the output stack is empty.',
  'When you move elements from the input stack to the output stack, the order reverses — making the bottom of the input stack the top of the output stack (FIFO order).',
  'This lazy transfer gives amortized O(1) per operation.'
],
'200', 'https://leetcode.com/problems/implement-queue-using-stacks/',
'MyQueue',
'[{"name":"operations","type":"List[List]"}]'::jsonb,
'List',
'[
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"peek\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,1,1,false]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",10],[\"push\",20],[\"push\",30],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,null,10,20,false]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,1,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",5],[\"push\",3],[\"peek\"],[\"push\",7],[\"pop\"],[\"peek\"]]"],"expected":"[null,null,null,5,null,5,3]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"pop\"],[\"push\",3],[\"peek\"]]"],"expected":"[null,null,null,1,null,2]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",9],[\"peek\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,9,9,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"push\",3],[\"pop\"],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,null,1,2,3,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",4],[\"push\",8],[\"pop\"],[\"push\",2],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,4,null,8,2,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"peek\"],[\"peek\"],[\"pop\"],[\"peek\"]]"],"expected":"[null,null,null,1,1,1,2]"},
  {"inputs":["[[\"MyQueue\"],[\"empty\"]]"],"expected":"[null,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",7],[\"empty\"],[\"peek\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,false,7,7,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"push\",3],[\"push\",4],[\"pop\"],[\"push\",5],[\"pop\"],[\"pop\"]]"],"expected":"[null,null,null,null,null,1,null,2,3]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",6],[\"push\",6],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,6,6,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",3],[\"push\",1],[\"push\",4],[\"push\",1],[\"push\",5],[\"pop\"],[\"pop\"],[\"pop\"],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,null,null,null,3,1,4,1,5,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",2],[\"pop\"],[\"push\",4],[\"pop\"],[\"push\",6],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,2,null,4,null,6,true]"},
  {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"pop\"],[\"push\",3],[\"pop\"],[\"push\",4],[\"pop\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,1,null,2,null,3,4,true]"}
]'::jsonb),

-- ============ 2. Number of Recent Calls (Easy, Pattern B) ============
('number-recent-calls', 'queue', 'Number of Recent Calls', 'Easy',
$DESC$
<p>You have a <code>RecentCounter</code> class which counts the number of recent requests within a certain time frame.</p>
<p>Implement the <code>RecentCounter</code> class:</p>
<ul>
  <li><code>RecentCounter()</code> initializes the counter with zero recent requests.</li>
  <li><code>ping(t)</code> adds a new request at time <code>t</code>, where <code>t</code> represents some time in milliseconds, and returns the number of requests that have happened in the past <code>3000</code> milliseconds (including the new request). Specifically, return the number of requests that have happened in the inclusive range <code>[t - 3000, t]</code>.</li>
</ul>
<p>It is guaranteed that every call to <code>ping</code> uses a strictly larger value of <code>t</code> than the previous call.</p>

<p><strong>Example 1:</strong></p>
<pre>Input:
["RecentCounter","ping","ping","ping","ping"]
[[],[1],[100],[3001],[3002]]
Output:
[null,1,2,3,3]

Explanation:
RecentCounter recentCounter = new RecentCounter();
recentCounter.ping(1);    // requests = [1], range is [-2999,1], return 1
recentCounter.ping(100);  // requests = [1,100], range is [-2900,100], return 2
recentCounter.ping(3001); // requests = [1,100,3001], range is [1,3001], return 3
recentCounter.ping(3002); // requests = [1,100,3001,3002], range is [2,3002], return 3</pre>

<p><strong>Example 2:</strong></p>
<pre>Input:
["RecentCounter","ping","ping","ping"]
[[],[1000],[2000],[6001]]
Output:
[null,1,2,1]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= t &lt;= 10<sup>9</sup></code></li>
  <li>Each test case will call <code>ping</code> with strictly increasing values of <code>t</code>.</li>
  <li>At most <code>10<sup>4</sup></code> calls will be made to <code>ping</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Maintain a queue of timestamps. When ping(t) arrives, enqueue t then dequeue everything older than t - 3000.',
  'Since timestamps arrive in strictly increasing order, elements leave the queue in FIFO order — a simple queue is perfect.',
  'After cleaning, the queue size is the answer.'
],
'200', 'https://leetcode.com/problems/number-of-recent-calls/',
'RecentCounter',
'[{"name":"operations","type":"List[List]"}]'::jsonb,
'List',
'[
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",100],[\"ping\",3001],[\"ping\",3002]]"],"expected":"[null,1,2,3,3]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1000],[\"ping\",2000],[\"ping\",6001]]"],"expected":"[null,1,2,1]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1]]"],"expected":"[null,1]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",2],[\"ping\",3],[\"ping\",3000],[\"ping\",3001]]"],"expected":"[null,1,2,3,4,4]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",100],[\"ping\",3100],[\"ping\",3101]]"],"expected":"[null,1,2,2]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",1000],[\"ping\",2000],[\"ping\",3000],[\"ping\",4000]]"],"expected":"[null,1,2,3,4,4]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",10],[\"ping\",20],[\"ping\",30],[\"ping\",40],[\"ping\",50]]"],"expected":"[null,1,2,3,4,5]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",5],[\"ping\",3006]]"],"expected":"[null,1,1]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",3001],[\"ping\",6001],[\"ping\",9001]]"],"expected":"[null,1,2,2,2]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",500],[\"ping\",1500],[\"ping\",2500],[\"ping\",3500],[\"ping\",3501]]"],"expected":"[null,1,2,3,4,4]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",100],[\"ping\",200],[\"ping\",300],[\"ping\",400],[\"ping\",500],[\"ping\",3101]]"],"expected":"[null,1,2,3,4,5,5]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",2],[\"ping\",3001],[\"ping\",3002],[\"ping\",6002]]"],"expected":"[null,1,2,3,3,2]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1000000],[\"ping\",1001000],[\"ping\",1002000],[\"ping\",1003000],[\"ping\",1003001]]"],"expected":"[null,1,2,3,4,4]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",10000]]"],"expected":"[null,1,1]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",2999],[\"ping\",3000],[\"ping\",3001],[\"ping\",3002]]"],"expected":"[null,1,2,3,4,4]"},
  {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",2],[\"ping\",3],[\"ping\",4],[\"ping\",5],[\"ping\",3001],[\"ping\",3002],[\"ping\",3003]]"],"expected":"[null,1,2,3,4,5,6,6,6]"}
]'::jsonb),

-- ============ 3. Sliding Window Maximum (Hard, Pattern A) ============
('sliding-window-maximum', 'queue', 'Sliding Window Maximum', 'Hard',
$DESC$
<p>You are given an array of integers <code>nums</code> and an integer <code>k</code> representing the size of a sliding window which moves from the very left of the array to the very right. You can only see the <code>k</code> numbers in the window. Each time the sliding window moves right by one position, return the <strong>maximum</strong> element in the current window.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]

Explanation:
Window position                Max
[1  3  -1] -3  5  3  6  7      3
 1 [3  -1  -3] 5  3  6  7      3
 1  3 [-1  -3  5] 3  6  7      5
 1  3  -1 [-3  5  3] 6  7      5
 1  3  -1  -3 [5  3  6] 7      6
 1  3  -1  -3  5 [3  6  7]     7</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1], k = 1
Output: [1]</pre>

<p><strong>Example 3:</strong></p>
<pre>Input: nums = [9,11], k = 2
Output: [11]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
  <li><code>1 &lt;= k &lt;= nums.length</code></li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'A brute-force scan of each window is O(nk). Can you keep track of the current max more efficiently as the window slides?',
  'Use a monotonic deque: keep indices in decreasing order of their values. The front of the deque is always the max of the current window.',
  'Before adding a new element, pop all smaller elements from the back. Before reading the max, pop indices from the front that have left the window.'
],
'200', 'https://leetcode.com/problems/sliding-window-maximum/',
'maxSlidingWindow',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,3,-1,-3,5,3,6,7]","3"],"expected":"[3,3,5,5,6,7]"},
  {"inputs":["[1]","1"],"expected":"[1]"},
  {"inputs":["[9,11]","2"],"expected":"[11]"},
  {"inputs":["[1,3,1,2,0,5]","3"],"expected":"[3,3,2,5]"},
  {"inputs":["[7,2,4]","2"],"expected":"[7,4]"},
  {"inputs":["[1,-1]","1"],"expected":"[1,-1]"},
  {"inputs":["[4,3,2,1]","3"],"expected":"[4,3]"},
  {"inputs":["[1,2,3,4,5]","3"],"expected":"[3,4,5]"},
  {"inputs":["[5,4,3,2,1]","1"],"expected":"[5,4,3,2,1]"},
  {"inputs":["[1,3,-1,-3,5,3,6,7]","1"],"expected":"[1,3,-1,-3,5,3,6,7]"},
  {"inputs":["[1,3,-1,-3,5,3,6,7]","8"],"expected":"[7]"},
  {"inputs":["[2,2,2,2,2]","3"],"expected":"[2,2,2]"},
  {"inputs":["[-7,-8,7,5,7,1,6,0]","4"],"expected":"[7,7,7,7,7]"},
  {"inputs":["[10,9,8,7,6,5,4,3,2,1]","5"],"expected":"[10,9,8,7,6,5]"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","5"],"expected":"[5,6,7,8,9,10]"},
  {"inputs":["[3,1,2,4,6,3,8,1]","3"],"expected":"[3,4,6,6,8,8]"},
  {"inputs":["[0,0,0,0,0]","2"],"expected":"[0,0,0,0]"},
  {"inputs":["[-1,-2,-3,-4,-5]","2"],"expected":"[-1,-2,-3,-4]"}
]'::jsonb),

-- ============ 4. Design Circular Queue (Medium, Pattern B) ============
('design-circular-queue', 'queue', 'Design Circular Queue', 'Medium',
$DESC$
<p>Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO (First In First Out) principle, and the last position is connected back to the first position to make a circle.</p>
<p>Implement the <code>MyCircularQueue</code> class:</p>
<ul>
  <li><code>MyCircularQueue(k)</code> initializes the queue with size <code>k</code>.</li>
  <li><code>enQueue(value)</code> inserts an element into the circular queue. Return <code>true</code> if the operation is successful.</li>
  <li><code>deQueue()</code> deletes an element from the circular queue. Return <code>true</code> if the operation is successful.</li>
  <li><code>Front()</code> gets the front item from the queue. If the queue is empty, return <code>-1</code>.</li>
  <li><code>Rear()</code> gets the last item from the queue. If the queue is empty, return <code>-1</code>.</li>
  <li><code>isEmpty()</code> checks whether the circular queue is empty or not.</li>
  <li><code>isFull()</code> checks whether the circular queue is full or not.</li>
</ul>

<p><strong>Example 1:</strong></p>
<pre>Input:
["MyCircularQueue","enQueue","enQueue","enQueue","enQueue","Rear","isFull","deQueue","enQueue","Rear"]
[[3],[1],[2],[3],[4],[],[],[],[4],[]]
Output:
[null,true,true,true,false,3,true,true,true,4]

Explanation:
MyCircularQueue cq = new MyCircularQueue(3);
cq.enQueue(1); // return true
cq.enQueue(2); // return true
cq.enQueue(3); // return true
cq.enQueue(4); // return false, queue is full
cq.Rear();     // return 3
cq.isFull();   // return true
cq.deQueue();  // return true
cq.enQueue(4); // return true
cq.Rear();     // return 4</pre>

<p><strong>Example 2:</strong></p>
<pre>Input:
["MyCircularQueue","enQueue","Rear","Front","deQueue","Front"]
[[2],[5],[],[],[],[]]
Output:
[null,true,5,5,true,-1]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= k &lt;= 1000</code></li>
  <li><code>0 &lt;= value &lt;= 1000</code></li>
  <li>At most <code>3000</code> calls will be made to <code>enQueue</code>, <code>deQueue</code>, <code>Front</code>, <code>Rear</code>, <code>isEmpty</code>, and <code>isFull</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use a fixed-size array of length k and two pointers (head and tail) that wrap around using modulo arithmetic.',
  'Track the current count of elements. enQueue fails when count == k, and deQueue fails when count == 0.',
  'Rear is at (head + count - 1) % k. Advance head on deQueue; advance tail on enQueue.'
],
'200', 'https://leetcode.com/problems/design-circular-queue/',
'MyCircularQueue',
'[{"name":"operations","type":"List[List]"}]'::jsonb,
'List',
'[
  {"inputs":["[[\"MyCircularQueue\",3],[\"enQueue\",1],[\"enQueue\",2],[\"enQueue\",3],[\"enQueue\",4],[\"Rear\"],[\"isFull\"],[\"deQueue\"],[\"enQueue\",4],[\"Rear\"]]"],"expected":"[null,true,true,true,false,3,true,true,true,4]"},
  {"inputs":["[[\"MyCircularQueue\",2],[\"enQueue\",5],[\"Rear\"],[\"Front\"],[\"deQueue\"],[\"Front\"]]"],"expected":"[null,true,5,5,true,-1]"},
  {"inputs":["[[\"MyCircularQueue\",1],[\"enQueue\",7],[\"Front\"],[\"Rear\"],[\"enQueue\",9],[\"deQueue\"],[\"enQueue\",9],[\"Front\"]]"],"expected":"[null,true,7,7,false,true,true,9]"},
  {"inputs":["[[\"MyCircularQueue\",3],[\"isEmpty\"],[\"enQueue\",1],[\"isEmpty\"],[\"isFull\"]]"],"expected":"[null,true,true,false,false]"},
  {"inputs":["[[\"MyCircularQueue\",2],[\"enQueue\",1],[\"enQueue\",2],[\"deQueue\"],[\"enQueue\",3],[\"Rear\"],[\"Front\"],[\"deQueue\"],[\"Front\"]]"],"expected":"[null,true,true,true,true,3,2,true,3]"},
  {"inputs":["[[\"MyCircularQueue\",3],[\"enQueue\",10],[\"enQueue\",20],[\"enQueue\",30],[\"deQueue\"],[\"deQueue\"],[\"deQueue\"],[\"isEmpty\"]]"],"expected":"[null,true,true,true,true,true,true,true]"},
  {"inputs":["[[\"MyCircularQueue\",3],[\"deQueue\"],[\"Front\"],[\"Rear\"]]"],"expected":"[null,false,-1,-1]"},
  {"inputs":["[[\"MyCircularQueue\",4],[\"enQueue\",1],[\"enQueue\",2],[\"enQueue\",3],[\"enQueue\",4],[\"isFull\"],[\"deQueue\"],[\"isFull\"],[\"enQueue\",5],[\"Rear\"],[\"Front\"]]"],"expected":"[null,true,true,true,true,true,true,false,true,5,2]"},
  {"inputs":["[[\"MyCircularQueue\",2],[\"enQueue\",1],[\"enQueue\",2],[\"isFull\"],[\"deQueue\"],[\"enQueue\",3],[\"deQueue\"],[\"enQueue\",4],[\"Front\"],[\"Rear\"]]"],"expected":"[null,true,true,true,true,true,true,true,4,4]"},
  {"inputs":["[[\"MyCircularQueue\",5],[\"enQueue\",1],[\"enQueue\",2],[\"enQueue\",3],[\"Front\"],[\"Rear\"],[\"enQueue\",4],[\"enQueue\",5],[\"isFull\"],[\"deQueue\"],[\"deQueue\"],[\"enQueue\",6],[\"enQueue\",7],[\"Front\"],[\"Rear\"]]"],"expected":"[null,true,true,true,1,3,true,true,true,true,true,true,true,3,7]"},
  {"inputs":["[[\"MyCircularQueue\",1],[\"isEmpty\"],[\"enQueue\",1],[\"isEmpty\"],[\"isFull\"],[\"deQueue\"],[\"isEmpty\"]]"],"expected":"[null,true,true,false,true,true,true]"},
  {"inputs":["[[\"MyCircularQueue\",3],[\"enQueue\",1],[\"enQueue\",2],[\"deQueue\"],[\"enQueue\",3],[\"enQueue\",4],[\"deQueue\"],[\"enQueue\",5],[\"Front\"],[\"Rear\"]]"],"expected":"[null,true,true,true,true,true,true,true,3,5]"},
  {"inputs":["[[\"MyCircularQueue\",2],[\"enQueue\",0],[\"enQueue\",0],[\"Front\"],[\"Rear\"],[\"deQueue\"],[\"Front\"]]"],"expected":"[null,true,true,0,0,true,0]"},
  {"inputs":["[[\"MyCircularQueue\",3],[\"enQueue\",100],[\"enQueue\",200],[\"enQueue\",300],[\"Front\"],[\"Rear\"],[\"deQueue\"],[\"Front\"],[\"Rear\"]]"],"expected":"[null,true,true,true,100,300,true,200,300]"},
  {"inputs":["[[\"MyCircularQueue\",2],[\"enQueue\",1],[\"deQueue\"],[\"enQueue\",2],[\"deQueue\"],[\"enQueue\",3],[\"deQueue\"],[\"isEmpty\"]]"],"expected":"[null,true,true,true,true,true,true,true]"}
]'::jsonb),

-- ============ 5. Moving Average from Data Stream (Easy, Pattern B) ============
('moving-average', 'queue', 'Moving Average from Data Stream', 'Easy',
$DESC$
<p>Given a stream of integers and a window size, calculate the moving average of all integers in the sliding window.</p>
<p>Implement the <code>MovingAverage</code> class:</p>
<ul>
  <li><code>MovingAverage(int size)</code> initializes the object with the window <code>size</code>.</li>
  <li><code>next(int val)</code> returns the moving average of the last <code>size</code> values of the stream as a <strong>float</strong>.</li>
</ul>

<p><strong>Example 1:</strong></p>
<pre>Input:
["MovingAverage","next","next","next","next"]
[[3],[1],[10],[3],[5]]
Output:
[null,1.0,5.5,4.66667,6.0]

Explanation:
MovingAverage m = new MovingAverage(3);
m.next(1)  = 1 / 1 = 1.0
m.next(10) = (1 + 10) / 2 = 5.5
m.next(3)  = (1 + 10 + 3) / 3 = 4.66667
m.next(5)  = (10 + 3 + 5) / 3 = 6.0</pre>

<p><strong>Example 2:</strong></p>
<pre>Input:
["MovingAverage","next","next"]
[[1],[5],[10]]
Output:
[null,5.0,10.0]</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= size &lt;= 1000</code></li>
  <li><code>-10<sup>5</sup> &lt;= val &lt;= 10<sup>5</sup></code></li>
  <li>At most <code>10<sup>4</sup></code> calls will be made to <code>next</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Use a queue to hold at most `size` values. When the queue exceeds the window size, dequeue the oldest value.',
  'Keep a running sum so you can compute the average in O(1) per call — add the new value, subtract the removed one.',
  'The average is running_sum / current_queue_length.'
],
'200', 'https://leetcode.com/problems/moving-average-from-data-stream/',
'MovingAverage',
'[{"name":"operations","type":"List[List]"}]'::jsonb,
'List',
'[
  {"inputs":["[[\"MovingAverage\",3],[\"next\",1],[\"next\",10],[\"next\",3],[\"next\",5]]"],"expected":"[null,1.0,5.5,4.66667,6.0]"},
  {"inputs":["[[\"MovingAverage\",1],[\"next\",5],[\"next\",10]]"],"expected":"[null,5.0,10.0]"},
  {"inputs":["[[\"MovingAverage\",2],[\"next\",1],[\"next\",2],[\"next\",3]]"],"expected":"[null,1.0,1.5,2.5]"},
  {"inputs":["[[\"MovingAverage\",3],[\"next\",0],[\"next\",0],[\"next\",0]]"],"expected":"[null,0.0,0.0,0.0]"},
  {"inputs":["[[\"MovingAverage\",2],[\"next\",10],[\"next\",20],[\"next\",30],[\"next\",40]]"],"expected":"[null,10.0,15.0,25.0,35.0]"},
  {"inputs":["[[\"MovingAverage\",5],[\"next\",1],[\"next\",2],[\"next\",3],[\"next\",4],[\"next\",5],[\"next\",6]]"],"expected":"[null,1.0,1.5,2.0,2.5,3.0,4.0]"},
  {"inputs":["[[\"MovingAverage\",3],[\"next\",-1],[\"next\",-2],[\"next\",-3],[\"next\",-4]]"],"expected":"[null,-1.0,-1.5,-2.0,-3.0]"},
  {"inputs":["[[\"MovingAverage\",1],[\"next\",100],[\"next\",-100],[\"next\",100]]"],"expected":"[null,100.0,-100.0,100.0]"},
  {"inputs":["[[\"MovingAverage\",4],[\"next\",10],[\"next\",20],[\"next\",30],[\"next\",40],[\"next\",50]]"],"expected":"[null,10.0,15.0,20.0,25.0,35.0]"},
  {"inputs":["[[\"MovingAverage\",2],[\"next\",5],[\"next\",5],[\"next\",5],[\"next\",5]]"],"expected":"[null,5.0,5.0,5.0,5.0]"},
  {"inputs":["[[\"MovingAverage\",3],[\"next\",100000],[\"next\",-100000],[\"next\",100000]]"],"expected":"[null,100000.0,0.0,33333.33333]"},
  {"inputs":["[[\"MovingAverage\",3],[\"next\",1],[\"next\",2],[\"next\",3],[\"next\",4],[\"next\",5],[\"next\",6],[\"next\",7]]"],"expected":"[null,1.0,1.5,2.0,3.0,4.0,5.0,6.0]"},
  {"inputs":["[[\"MovingAverage\",2],[\"next\",0],[\"next\",0],[\"next\",1]]"],"expected":"[null,0.0,0.0,0.5]"},
  {"inputs":["[[\"MovingAverage\",4],[\"next\",1],[\"next\",1],[\"next\",1],[\"next\",1]]"],"expected":"[null,1.0,1.0,1.0,1.0]"},
  {"inputs":["[[\"MovingAverage\",3],[\"next\",3],[\"next\",6],[\"next\",9],[\"next\",12],[\"next\",15]]"],"expected":"[null,3.0,4.5,6.0,9.0,12.0]"},
  {"inputs":["[[\"MovingAverage\",2],[\"next\",-5],[\"next\",15],[\"next\",-5],[\"next\",15]]"],"expected":"[null,-5.0,5.0,5.0,5.0]"}
]'::jsonb),

-- ============ 6. Dota2 Senate (Medium, Pattern A) ============
('dota2-senate', 'queue', 'Dota2 Senate', 'Medium',
$DESC$
<p>In the world of Dota2, there are two parties: the <strong>Radiant</strong> and the <strong>Dire</strong>.</p>
<p>The Dota2 senate consists of senators coming from these two parties. Now the senate wants to decide on a change in the game. The voting starts in a round-based procedure. In each round, a senator can exercise <strong>one</strong> of the two rights:</p>
<ul>
  <li><strong>Ban one senator''s right:</strong> A senator can make another senator lose all his rights in the current and all following rounds.</li>
  <li><strong>Announce the victory:</strong> If this senator finds that all the remaining senators with voting rights are from the same party, he can announce the victory.</li>
</ul>
<p>Given a string <code>senate</code> representing each senator''s party. The character <code>''R''</code> represents Radiant and <code>''D''</code> represents Dire. If there are <code>n</code> senators, the size of the string is <code>n</code>.</p>
<p>The round-based procedure starts from the first senator to the last senator in the given order. This procedure will last until the end of voting, and all senators who have lost their rights will be skipped during the procedure.</p>
<p>Assume every senator is smart enough and will play the <strong>best strategy</strong> for their own party. Predict which party will finally announce the victory.</p>

<p><strong>Example 1:</strong></p>
<pre>Input: senate = "RD"
Output: "Radiant"

Explanation:
The first senator is from Radiant and bans the next Dire senator.
The Dire senator is banned and cannot vote.
Radiant announces victory.</pre>

<p><strong>Example 2:</strong></p>
<pre>Input: senate = "RDD"
Output: "Dire"

Explanation:
The first senator (R) bans the next Dire senator (index 1).
The second senator (D, index 2) bans the Radiant senator.
Dire announces victory.</pre>

<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == senate.length</code></li>
  <li><code>1 &lt;= n &lt;= 10<sup>4</sup></code></li>
  <li><code>senate[i]</code> is either <code>''R''</code> or <code>''D''</code>.</li>
</ul>
$DESC$,
'', -- solution_video_url
ARRAY[
  'Each senator will always ban the closest enemy senator who would act next — a greedy strategy.',
  'Use two queues, one for Radiant indices and one for Dire indices. Compare the fronts; the smaller index wins and goes to the back (adding n to simulate the next round).',
  'Repeat until one queue is empty. The non-empty queue''s party wins.'
],
'200', 'https://leetcode.com/problems/dota2-senate/',
'predictPartyVictory',
'[{"name":"senate","type":"str"}]'::jsonb,
'str',
'[
  {"inputs":["\"RD\""],"expected":"\"Radiant\""},
  {"inputs":["\"RDD\""],"expected":"\"Dire\""},
  {"inputs":["\"RRDD\""],"expected":"\"Radiant\""},
  {"inputs":["\"DDRRR\""],"expected":"\"Radiant\""},
  {"inputs":["\"DDRR\""],"expected":"\"Dire\""},
  {"inputs":["\"R\""],"expected":"\"Radiant\""},
  {"inputs":["\"D\""],"expected":"\"Dire\""},
  {"inputs":["\"RRDDD\""],"expected":"\"Dire\""},
  {"inputs":["\"RRDRD\""],"expected":"\"Radiant\""},
  {"inputs":["\"DRRD\""],"expected":"\"Radiant\""},
  {"inputs":["\"DRRDR\""],"expected":"\"Radiant\""},
  {"inputs":["\"DDRRRD\""],"expected":"\"Radiant\""},
  {"inputs":["\"RDDRD\""],"expected":"\"Dire\""},
  {"inputs":["\"RDRD\""],"expected":"\"Radiant\""},
  {"inputs":["\"DRDR\""],"expected":"\"Dire\""},
  {"inputs":["\"RRRDDDD\""],"expected":"\"Dire\""},
  {"inputs":["\"DDDRRR\""],"expected":"\"Dire\""},
  {"inputs":["\"RDRDR\""],"expected":"\"Radiant\""}
]'::jsonb);


-- ============================================================
-- PART 2: Solution approaches
-- ============================================================

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

-- ============ 1. implement-queue-stacks ============
('implement-queue-stacks', 1, 'Two Stacks — Lazy Transfer',
'The key insight is that pouring elements from one stack into another reverses their order — exactly what we need to convert LIFO to FIFO. We keep an input stack for pushes and an output stack for pops/peeks. We only transfer when the output stack is empty, giving amortized O(1) per operation.',
'["Maintain two stacks: stack_in for pushes, stack_out for pops.","push(x): push x onto stack_in.","pop()/peek(): if stack_out is empty, pop all elements from stack_in and push them onto stack_out.","Pop/peek from stack_out (the former bottom of stack_in is now on top, giving FIFO order).","empty(): return true if both stacks are empty."]'::jsonb,
$PY$class MyQueue:
    def __init__(self):
        self.stack_in = []
        self.stack_out = []

    def push(self, x: int) -> None:
        self.stack_in.append(x)

    def pop(self) -> int:
        self._move()
        return self.stack_out.pop()

    def peek(self) -> int:
        self._move()
        return self.stack_out[-1]

    def empty(self) -> bool:
        return not self.stack_in and not self.stack_out

    def _move(self):
        if not self.stack_out:
            while self.stack_in:
                self.stack_out.append(self.stack_in.pop())
$PY$,
$JS$var MyQueue = function() {
    this.stackIn = [];
    this.stackOut = [];
};
MyQueue.prototype.push = function(x) {
    this.stackIn.push(x);
};
MyQueue.prototype.pop = function() {
    this._move();
    return this.stackOut.pop();
};
MyQueue.prototype.peek = function() {
    this._move();
    return this.stackOut[this.stackOut.length - 1];
};
MyQueue.prototype.empty = function() {
    return this.stackIn.length === 0 && this.stackOut.length === 0;
};
MyQueue.prototype._move = function() {
    if (this.stackOut.length === 0) {
        while (this.stackIn.length > 0) {
            this.stackOut.push(this.stackIn.pop());
        }
    }
};
$JS$,
$JAVA$class MyQueue {
    private Deque<Integer> stackIn = new ArrayDeque<>();
    private Deque<Integer> stackOut = new ArrayDeque<>();

    public void push(int x) {
        stackIn.push(x);
    }

    public int pop() {
        move();
        return stackOut.pop();
    }

    public int peek() {
        move();
        return stackOut.peek();
    }

    public boolean empty() {
        return stackIn.isEmpty() && stackOut.isEmpty();
    }

    private void move() {
        if (stackOut.isEmpty()) {
            while (!stackIn.isEmpty()) {
                stackOut.push(stackIn.pop());
            }
        }
    }
}
$JAVA$,
'O(1) amortized per op', 'O(n)'),

-- ============ 2. number-recent-calls ============
('number-recent-calls', 1, 'Queue with Sliding Window',
'Since timestamps arrive in strictly increasing order, expired timestamps are always at the front of the queue. We can simply dequeue them after adding the new timestamp, and the remaining queue size is our answer.',
'["Maintain a queue (deque) of timestamps.","ping(t): add t to the queue.","While the front of the queue < t - 3000, remove it.","Return the size of the queue."]'::jsonb,
$PY$class RecentCounter:
    def __init__(self):
        self.q = deque()

    def ping(self, t: int) -> int:
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()
        return len(self.q)
$PY$,
$JS$var RecentCounter = function() {
    this.q = [];
    this.head = 0;
};
RecentCounter.prototype.ping = function(t) {
    this.q.push(t);
    while (this.q[this.head] < t - 3000) {
        this.head++;
    }
    return this.q.length - this.head;
};
$JS$,
$JAVA$class RecentCounter {
    private Queue<Integer> q;

    public RecentCounter() {
        q = new LinkedList<>();
    }

    public int ping(int t) {
        q.add(t);
        while (q.peek() < t - 3000) {
            q.poll();
        }
        return q.size();
    }
}
$JAVA$,
'O(1) amortized per call', 'O(n)'),

-- ============ 3. sliding-window-maximum ============
('sliding-window-maximum', 1, 'Monotonic Deque',
'We maintain a deque of indices whose values are in strictly decreasing order. The front of the deque is always the index of the maximum in the current window. When we add a new element, we pop all smaller elements from the back (they can never be the max while the new element is in the window). We also pop from the front if the index has left the window.',
'["Create an empty deque dq and result list.","For each index i in nums:","  While dq is not empty and nums[dq.back] <= nums[i], pop from back.","  Push i to back of dq.","  If dq.front <= i - k, pop from front (out of window).","  If i >= k - 1, append nums[dq.front] to result.","Return result."]'::jsonb,
$PY$class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()
        result = []
        for i, val in enumerate(nums):
            while dq and nums[dq[-1]] <= val:
                dq.pop()
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()
            if i >= k - 1:
                result.append(nums[dq[0]])
        return result
$PY$,
$JS$var maxSlidingWindow = function(nums, k) {
    const dq = [];
    const result = [];
    let front = 0;
    for (let i = 0; i < nums.length; i++) {
        while (front < dq.length && nums[dq[dq.length - 1]] <= nums[i]) {
            dq.pop();
        }
        dq.push(i);
        if (dq[front] <= i - k) front++;
        if (i >= k - 1) result.push(nums[dq[front]]);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        Deque<Integer> dq = new ArrayDeque<>();
        int[] result = new int[nums.length - k + 1];
        int ri = 0;
        for (int i = 0; i < nums.length; i++) {
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) {
                dq.pollLast();
            }
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) {
                dq.pollFirst();
            }
            if (i >= k - 1) {
                result[ri++] = nums[dq.peekFirst()];
            }
        }
        return result;
    }
}
$JAVA$,
'O(n)', 'O(k)'),

-- ============ 4. design-circular-queue ============
('design-circular-queue', 1, 'Fixed Array with Head/Count',
'Use a fixed-size array and track the head index plus a count of elements. The tail is computed as (head + count - 1) % k. Modular arithmetic lets us wrap around without ever resizing the array.',
'["Allocate an array of size k, set head = 0, count = 0.","enQueue(val): if count == k return false; place val at (head + count) % k; count++; return true.","deQueue(): if count == 0 return false; head = (head + 1) % k; count--; return true.","Front(): return count == 0 ? -1 : arr[head].","Rear(): return count == 0 ? -1 : arr[(head + count - 1) % k].","isEmpty(): return count == 0.","isFull(): return count == k."]'::jsonb,
$PY$class MyCircularQueue:
    def __init__(self, k: int):
        self.data = [0] * k
        self.head = 0
        self.count = 0
        self.capacity = k

    def enQueue(self, value: int) -> bool:
        if self.count == self.capacity:
            return False
        self.data[(self.head + self.count) % self.capacity] = value
        self.count += 1
        return True

    def deQueue(self) -> bool:
        if self.count == 0:
            return False
        self.head = (self.head + 1) % self.capacity
        self.count -= 1
        return True

    def Front(self) -> int:
        return -1 if self.count == 0 else self.data[self.head]

    def Rear(self) -> int:
        return -1 if self.count == 0 else self.data[(self.head + self.count - 1) % self.capacity]

    def isEmpty(self) -> bool:
        return self.count == 0

    def isFull(self) -> bool:
        return self.count == self.capacity
$PY$,
$JS$var MyCircularQueue = function(k) {
    this.data = new Array(k);
    this.head = 0;
    this.count = 0;
    this.capacity = k;
};
MyCircularQueue.prototype.enQueue = function(value) {
    if (this.count === this.capacity) return false;
    this.data[(this.head + this.count) % this.capacity] = value;
    this.count++;
    return true;
};
MyCircularQueue.prototype.deQueue = function() {
    if (this.count === 0) return false;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return true;
};
MyCircularQueue.prototype.Front = function() {
    return this.count === 0 ? -1 : this.data[this.head];
};
MyCircularQueue.prototype.Rear = function() {
    return this.count === 0 ? -1 : this.data[(this.head + this.count - 1) % this.capacity];
};
MyCircularQueue.prototype.isEmpty = function() {
    return this.count === 0;
};
MyCircularQueue.prototype.isFull = function() {
    return this.count === this.capacity;
};
$JS$,
$JAVA$class MyCircularQueue {
    private int[] data;
    private int head, count, capacity;

    public MyCircularQueue(int k) {
        data = new int[k];
        head = 0;
        count = 0;
        capacity = k;
    }

    public boolean enQueue(int value) {
        if (count == capacity) return false;
        data[(head + count) % capacity] = value;
        count++;
        return true;
    }

    public boolean deQueue() {
        if (count == 0) return false;
        head = (head + 1) % capacity;
        count--;
        return true;
    }

    public int Front() {
        return count == 0 ? -1 : data[head];
    }

    public int Rear() {
        return count == 0 ? -1 : data[(head + count - 1) % capacity];
    }

    public boolean isEmpty() {
        return count == 0;
    }

    public boolean isFull() {
        return count == capacity;
    }
}
$JAVA$,
'O(1) per op', 'O(k)'),

-- ============ 5. moving-average ============
('moving-average', 1, 'Queue with Running Sum',
'Maintain a queue of at most `size` values and a running sum. When a new value arrives, add it to the queue and the sum. If the queue exceeds the window, dequeue the oldest value and subtract it from the sum. The average is sum / queue_length.',
'["Initialize a queue, running_sum = 0, and store window size.","next(val): add val to queue and running_sum.","If queue length > size, dequeue the front and subtract from running_sum.","Return running_sum / len(queue)."]'::jsonb,
$PY$class MovingAverage:
    def __init__(self, size: int):
        self.q = deque()
        self.size = size
        self.total = 0

    def next(self, val: int) -> float:
        self.q.append(val)
        self.total += val
        if len(self.q) > self.size:
            self.total -= self.q.popleft()
        return self.total / len(self.q)
$PY$,
$JS$var MovingAverage = function(size) {
    this.q = [];
    this.head = 0;
    this.size = size;
    this.total = 0;
};
MovingAverage.prototype.next = function(val) {
    this.q.push(val);
    this.total += val;
    if (this.q.length - this.head > this.size) {
        this.total -= this.q[this.head];
        this.head++;
    }
    return this.total / (this.q.length - this.head);
};
$JS$,
$JAVA$class MovingAverage {
    private Queue<Integer> q;
    private int size;
    private double total;

    public MovingAverage(int size) {
        this.q = new LinkedList<>();
        this.size = size;
        this.total = 0;
    }

    public double next(int val) {
        q.add(val);
        total += val;
        if (q.size() > size) {
            total -= q.poll();
        }
        return total / q.size();
    }
}
$JAVA$,
'O(1) per call', 'O(size)'),

-- ============ 6. dota2-senate ============
('dota2-senate', 1, 'Greedy with Two Queues',
'Each senator bans the nearest upcoming enemy. We simulate this with two queues holding indices of Radiant and Dire senators. Compare the fronts: the senator with the smaller index bans the other, then re-enters the queue at index + n to represent the next round. The process ends when one queue is empty.',
'["Create two queues: radiant and dire, filled with their respective indices.","While both queues are non-empty:","  r = radiant.front, d = dire.front.","  If r < d: Radiant senator bans Dire; push r + n to radiant queue.","  Else: Dire senator bans Radiant; push d + n to dire queue.","  Pop both fronts.","Return \"Radiant\" if dire is empty, else \"Dire\"."]'::jsonb,
$PY$class Solution:
    def predictPartyVictory(self, senate: str) -> str:
        n = len(senate)
        radiant = deque()
        dire = deque()
        for i, c in enumerate(senate):
            if c == 'R':
                radiant.append(i)
            else:
                dire.append(i)
        while radiant and dire:
            r = radiant.popleft()
            d = dire.popleft()
            if r < d:
                radiant.append(r + n)
            else:
                dire.append(d + n)
        return 'Radiant' if radiant else 'Dire'
$PY$,
$JS$var predictPartyVictory = function(senate) {
    const n = senate.length;
    const radiant = [], dire = [];
    let rHead = 0, dHead = 0;
    for (let i = 0; i < n; i++) {
        if (senate[i] === 'R') radiant.push(i);
        else dire.push(i);
    }
    while (rHead < radiant.length && dHead < dire.length) {
        const r = radiant[rHead++];
        const d = dire[dHead++];
        if (r < d) radiant.push(r + n);
        else dire.push(d + n);
    }
    return rHead < radiant.length ? 'Radiant' : 'Dire';
};
$JS$,
$JAVA$class Solution {
    public String predictPartyVictory(String senate) {
        int n = senate.length();
        Queue<Integer> radiant = new LinkedList<>();
        Queue<Integer> dire = new LinkedList<>();
        for (int i = 0; i < n; i++) {
            if (senate.charAt(i) == 'R') radiant.add(i);
            else dire.add(i);
        }
        while (!radiant.isEmpty() && !dire.isEmpty()) {
            int r = radiant.poll();
            int d = dire.poll();
            if (r < d) radiant.add(r + n);
            else dire.add(d + n);
        }
        return radiant.isEmpty() ? "Dire" : "Radiant";
    }
}
$JAVA$,
'O(n)', 'O(n)');

COMMIT;
