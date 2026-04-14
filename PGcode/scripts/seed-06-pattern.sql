BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'remove-element', 'binary-search', 'time-based-key-value',
  'median-two-sorted', 'first-last-position',
  'max-consecutive-ones-iii', 'fruit-into-baskets',
  'minimum-size-subarray', 'subarray-product-less-than-k'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'remove-element', 'binary-search', 'time-based-key-value',
  'median-two-sorted', 'first-last-position',
  'max-consecutive-ones-iii', 'fruit-into-baskets',
  'minimum-size-subarray', 'subarray-product-less-than-k'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'remove-element', 'binary-search', 'time-based-key-value',
  'median-two-sorted', 'first-last-position',
  'max-consecutive-ones-iii', 'fruit-into-baskets',
  'minimum-size-subarray', 'subarray-product-less-than-k'
);

-- ============================================================
-- 1. remove-element (Easy, LeetCode 27) — TWO POINTERS
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'remove-element', 'two-pointers', 'Remove Element', 'Easy',
  $DESC$<p>Given an integer array <code>nums</code> and an integer <code>val</code>, remove all occurrences of <code>val</code> in <code>nums</code> <strong>in-place</strong>. The order of the remaining elements may be changed. Return the modified array with all instances of <code>val</code> removed.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,2,2,3], val = 3
Output: [2,2]
Explanation: Your function should return the array with val removed. The returned array contains [2,2].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0,1,2,2,3,0,4,2], val = 2
Output: [0,1,3,0,4]
Explanation: Your function returns the array without any 2s. Note: the order of those five elements can be arbitrary.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= nums.length &lt;= 100</code></li>
<li><code>0 &lt;= nums[i] &lt;= 50</code></li>
<li><code>0 &lt;= val &lt;= 100</code></li>
</ul>$DESC$,
  '', ARRAY['Use two pointers: one for iterating and one for the position to place non-val elements.', 'When nums[i] != val, copy it to the slow pointer position and advance the slow pointer.', 'Return nums[:k] where k is the count of non-val elements.'],
  '200', 'https://leetcode.com/problems/remove-element/',
  'removeElement', '[{"name":"nums","type":"List[int]"},{"name":"val","type":"int"}]'::jsonb, 'List[int]',
  '[{"inputs":["[3,2,2,3]","3"],"expected":"[2,2]"},{"inputs":["[0,1,2,2,3,0,4,2]","2"],"expected":"[0,1,3,0,4]"},{"inputs":["[]","0"],"expected":"[]"},{"inputs":["[1]","1"],"expected":"[]"},{"inputs":["[1]","2"],"expected":"[1]"},{"inputs":["[4,4,4,4]","4"],"expected":"[]"},{"inputs":["[1,2,3,4,5]","6"],"expected":"[1,2,3,4,5]"},{"inputs":["[2,2,2,2,2]","2"],"expected":"[]"},{"inputs":["[1,2,3,4,5]","3"],"expected":"[1,2,4,5]"},{"inputs":["[5,1,5,1,5]","5"],"expected":"[1,1]"},{"inputs":["[0,0,0,1,1,1]","0"],"expected":"[1,1,1]"},{"inputs":["[1,2,3]","1"],"expected":"[2,3]"},{"inputs":["[1,2,3]","2"],"expected":"[1,3]"},{"inputs":["[7]","7"],"expected":"[]"},{"inputs":["[3,3,3,1,2]","3"],"expected":"[1,2]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'remove-element', 1, 'Two Pointers',
  'We use a slow pointer k to track where the next non-val element should go. As we iterate with a fast pointer i, whenever nums[i] is not val we copy it to nums[k] and increment k. After the loop, the first k elements are the answer.',
  '["Initialize k = 0 (slow pointer).","Iterate i through the array.","If nums[i] != val, set nums[k] = nums[i] and increment k.","Return nums[:k] — the subarray of length k with all val removed."]'::jsonb,
  $PY$class Solution:
    def removeElement(self, nums: list, val: int) -> list:
        k = 0
        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
        return nums[:k]$PY$,
  $JS$var removeElement = function(nums, val) {
    let k = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== val) {
            nums[k] = nums[i];
            k++;
        }
    }
    return nums.slice(0, k);
};$JS$,
  $JAVA$class Solution {
    public int[] removeElement(int[] nums, int val) {
        int k = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != val) {
                nums[k] = nums[i];
                k++;
            }
        }
        int[] result = new int[k];
        System.arraycopy(nums, 0, result, 0, k);
        return result;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 2. binary-search (Easy, LeetCode 704) — BINARY SEARCH
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'binary-search', 'binary-search', 'Binary Search', 'Easy',
  $DESC$<p>Given an array of integers <code>nums</code> which is sorted in ascending order, and an integer <code>target</code>, write a function to search <code>target</code> in <code>nums</code>. If <code>target</code> exists, then return its index. Otherwise, return <code>-1</code>.</p>
<p>You must write an algorithm with <code>O(log n)</code> runtime complexity.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
<li><code>-10<sup>4</sup> &lt; nums[i], target &lt; 10<sup>4</sup></code></li>
<li>All the integers in <code>nums</code> are unique.</li>
<li><code>nums</code> is sorted in ascending order.</li>
</ul>$DESC$,
  '', ARRAY['Use two pointers left and right to define the search range.', 'Compare the middle element to target. If equal, return mid. If target is smaller, search left half. Otherwise search right half.', 'If the loop ends without finding target, return -1.'],
  '200', 'https://leetcode.com/problems/binary-search/',
  'search', '[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["[-1,0,3,5,9,12]","9"],"expected":"4"},{"inputs":["[-1,0,3,5,9,12]","2"],"expected":"-1"},{"inputs":["[5]","5"],"expected":"0"},{"inputs":["[5]","-5"],"expected":"-1"},{"inputs":["[1,2,3,4,5,6,7,8,9,10]","1"],"expected":"0"},{"inputs":["[1,2,3,4,5,6,7,8,9,10]","10"],"expected":"9"},{"inputs":["[1,2,3,4,5,6,7,8,9,10]","5"],"expected":"4"},{"inputs":["[1,2,3,4,5,6,7,8,9,10]","11"],"expected":"-1"},{"inputs":["[2,5]","5"],"expected":"1"},{"inputs":["[2,5]","2"],"expected":"0"},{"inputs":["[2,5]","3"],"expected":"-1"},{"inputs":["[-10,-5,0,3,7]","0"],"expected":"2"},{"inputs":["[-10,-5,0,3,7]","-10"],"expected":"0"},{"inputs":["[-10,-5,0,3,7]","7"],"expected":"4"},{"inputs":["[-10,-5,0,3,7]","-3"],"expected":"-1"},{"inputs":["[1,3,5,7,9,11,13]","7"],"expected":"3"},{"inputs":["[1,3,5,7,9,11,13]","6"],"expected":"-1"},{"inputs":["[100]","100"],"expected":"0"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'binary-search', 1, 'Classic Binary Search',
  'Since the array is sorted, we can eliminate half the search space at each step. We maintain left and right pointers and compare the middle element with the target to decide which half to search next.',
  '["Initialize left = 0, right = len(nums) - 1.","While left <= right, compute mid = (left + right) // 2.","If nums[mid] == target, return mid.","If nums[mid] < target, set left = mid + 1 (search right half).","If nums[mid] > target, set right = mid - 1 (search left half).","If loop ends, return -1 (target not found)."]'::jsonb,
  $PY$class Solution:
    def search(self, nums: list, target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1$PY$,
  $JS$var search = function(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
};$JS$,
  $JAVA$class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}$JAVA$,
  'O(log n)', 'O(1)'
);

-- ============================================================
-- 3. time-based-key-value (Medium, LeetCode 981) — BINARY SEARCH (Operations)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'time-based-key-value', 'binary-search', 'Time Based Key-Value Store', 'Medium',
  $DESC$<p>Design a time-based key-value data structure that can store multiple values for the same key at different time stamps and retrieve the key''s value at a certain timestamp.</p>
<p>Implement the <code>TimeMap</code> class:</p>
<ul>
<li><code>TimeMap()</code> Initializes the object of the data structure.</li>
<li><code>set(String key, String value, int timestamp)</code> Stores the key <code>key</code> with the value <code>value</code> at the given time <code>timestamp</code>.</li>
<li><code>get(String key, int timestamp)</code> Returns a value such that <code>set</code> was called previously, with <code>timestamp_prev &lt;= timestamp</code>. If there are multiple such values, it returns the value associated with the largest <code>timestamp_prev</code>. If there are no values, it returns <code>""</code>.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["TimeMap","set","get","get","set","get","get"]
[[],["foo","bar",1],["foo",1],["foo",3],["foo","bar2",4],["foo",4],["foo",5]]
Output:
[null,null,"bar","bar",null,"bar2","bar2"]

Explanation:
TimeMap timeMap = new TimeMap();
timeMap.set("foo", "bar", 1);  // store "foo":"bar" at timestamp 1
timeMap.get("foo", 1);         // return "bar"
timeMap.get("foo", 3);         // return "bar", since no value at timestamp 3 but bar was set at 1
timeMap.set("foo", "bar2", 4); // store "foo":"bar2" at timestamp 4
timeMap.get("foo", 4);         // return "bar2"
timeMap.get("foo", 5);         // return "bar2"</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= key.length, value.length &lt;= 100</code></li>
<li><code>key</code> and <code>value</code> consist of lowercase English letters and digits.</li>
<li><code>1 &lt;= timestamp &lt;= 10<sup>7</sup></code></li>
<li>All timestamps of <code>set</code> are strictly increasing.</li>
<li>At most <code>2 * 10<sup>5</sup></code> calls will be made to <code>set</code> and <code>get</code>.</li>
</ul>$DESC$,
  '', ARRAY['Store values in a dictionary mapping each key to a list of (timestamp, value) pairs.', 'Since timestamps are strictly increasing per key, the list is already sorted. Use binary search to find the largest timestamp <= the query timestamp.', 'bisect_right gives the insertion point; the answer is at index (insertion_point - 1) if it exists.'],
  '200', 'https://leetcode.com/problems/time-based-key-value-store/',
  'TimeMap',
  '[{"name":"operations","type":"List[List]"}]'::jsonb,
  'List',
  '[
  {"inputs":["[[\"TimeMap\"],[\"set\",\"foo\",\"bar\",1],[\"get\",\"foo\",1],[\"get\",\"foo\",3],[\"set\",\"foo\",\"bar2\",4],[\"get\",\"foo\",4],[\"get\",\"foo\",5]]"],"expected":"[null,null,\"bar\",\"bar\",null,\"bar2\",\"bar2\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"love\",\"high\",10],[\"set\",\"love\",\"low\",20],[\"get\",\"love\",5],[\"get\",\"love\",10],[\"get\",\"love\",15],[\"get\",\"love\",20],[\"get\",\"love\",25]]"],"expected":"[null,null,null,\"\",\"high\",\"high\",\"low\",\"low\"]"},
  {"inputs":["[[\"TimeMap\"],[\"get\",\"hello\",1]]"],"expected":"[null,\"\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"a\",\"x\",1],[\"set\",\"a\",\"y\",2],[\"set\",\"a\",\"z\",3],[\"get\",\"a\",1],[\"get\",\"a\",2],[\"get\",\"a\",3]]"],"expected":"[null,null,null,null,\"x\",\"y\",\"z\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"a\",\"x\",1],[\"set\",\"a\",\"y\",2],[\"set\",\"a\",\"z\",3],[\"get\",\"a\",0]]"],"expected":"[null,null,null,null,\"\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"k\",\"v1\",1],[\"set\",\"k\",\"v2\",5],[\"set\",\"k\",\"v3\",10],[\"get\",\"k\",3],[\"get\",\"k\",7],[\"get\",\"k\",12]]"],"expected":"[null,null,null,null,\"v1\",\"v2\",\"v3\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"a\",\"one\",1],[\"set\",\"b\",\"two\",2],[\"get\",\"a\",2],[\"get\",\"b\",1],[\"get\",\"b\",3]]"],"expected":"[null,null,null,\"one\",\"\",\"two\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"key\",\"alpha\",1],[\"set\",\"key\",\"beta\",10],[\"set\",\"key\",\"gamma\",100],[\"get\",\"key\",1],[\"get\",\"key\",50],[\"get\",\"key\",100],[\"get\",\"key\",200]]"],"expected":"[null,null,null,null,\"alpha\",\"beta\",\"gamma\",\"gamma\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"x\",\"a\",5],[\"get\",\"x\",4],[\"get\",\"x\",5],[\"get\",\"x\",6]]"],"expected":"[null,null,\"\",\"a\",\"a\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"m\",\"v1\",1],[\"set\",\"m\",\"v2\",2],[\"get\",\"m\",1],[\"get\",\"m\",2],[\"get\",\"m\",3],[\"get\",\"n\",1]]"],"expected":"[null,null,null,\"v1\",\"v2\",\"v2\",\"\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"a\",\"1\",1],[\"set\",\"a\",\"2\",2],[\"set\",\"a\",\"3\",3],[\"set\",\"a\",\"4\",4],[\"set\",\"a\",\"5\",5],[\"get\",\"a\",3]]"],"expected":"[null,null,null,null,null,null,\"3\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"cat\",\"meow\",10],[\"set\",\"dog\",\"woof\",20],[\"get\",\"cat\",15],[\"get\",\"dog\",15],[\"get\",\"dog\",25]]"],"expected":"[null,null,null,\"meow\",\"\",\"woof\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"a\",\"b\",1],[\"get\",\"a\",1],[\"get\",\"a\",1]]"],"expected":"[null,null,\"b\",\"b\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"z\",\"first\",1],[\"set\",\"z\",\"second\",2],[\"set\",\"z\",\"third\",3],[\"get\",\"z\",2]]"],"expected":"[null,null,null,null,\"second\"]"},
  {"inputs":["[[\"TimeMap\"],[\"set\",\"p\",\"q\",100],[\"get\",\"p\",50],[\"get\",\"p\",100],[\"get\",\"p\",150]]"],"expected":"[null,null,\"\",\"q\",\"q\"]"}
  ]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'time-based-key-value', 1, 'HashMap + Binary Search',
  'We store each key''s values in a list of (timestamp, value) pairs. Since set is called with strictly increasing timestamps, each list is automatically sorted. For get, we binary search for the largest timestamp that is <= the query timestamp.',
  '["Initialize a defaultdict(list) to store key -> list of (timestamp, value) pairs.","set(key, value, timestamp): append (timestamp, value) to the key''s list.","get(key, timestamp): binary search the key''s list for the rightmost timestamp <= query.","Use bisect_right on timestamps to find insertion point i. If i > 0, return value at i-1. Otherwise return empty string."]'::jsonb,
  $PY$from bisect import bisect_right
from collections import defaultdict

class TimeMap:
    def __init__(self):
        self.store = defaultdict(list)

    def set(self, key: str, value: str, timestamp: int) -> None:
        self.store[key].append((timestamp, value))

    def get(self, key: str, timestamp: int) -> str:
        if key not in self.store:
            return ""
        pairs = self.store[key]
        timestamps = [p[0] for p in pairs]
        i = bisect_right(timestamps, timestamp)
        if i > 0:
            return pairs[i - 1][1]
        return ""$PY$,
  $JS$var TimeMap = function() {
    this.store = {};
};
TimeMap.prototype.set = function(key, value, timestamp) {
    if (!this.store[key]) this.store[key] = [];
    this.store[key].push([timestamp, value]);
};
TimeMap.prototype.get = function(key, timestamp) {
    if (!this.store[key]) return "";
    const pairs = this.store[key];
    let left = 0, right = pairs.length - 1, result = "";
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (pairs[mid][0] <= timestamp) {
            result = pairs[mid][1];
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
};$JS$,
  $JAVA$import java.util.*;

class TimeMap {
    private Map<String, List<int[]>> timestamps;
    private Map<String, List<String>> values;

    public TimeMap() {
        timestamps = new HashMap<>();
        values = new HashMap<>();
    }

    public void set(String key, String value, int timestamp) {
        timestamps.computeIfAbsent(key, k -> new ArrayList<>()).add(new int[]{timestamp});
        values.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
    }

    public String get(String key, int timestamp) {
        if (!timestamps.containsKey(key)) return "";
        List<int[]> ts = timestamps.get(key);
        int left = 0, right = ts.size() - 1;
        String result = "";
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (ts.get(mid)[0] <= timestamp) {
                result = values.get(key).get(mid);
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return result;
    }
}$JAVA$,
  'O(log n) per get, O(1) per set', 'O(n)'
);

-- ============================================================
-- 4. median-two-sorted (Hard, LeetCode 4) — BINARY SEARCH
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'median-two-sorted', 'binary-search', 'Median of Two Sorted Arrays', 'Hard',
  $DESC$<p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code> respectively, return <strong>the median</strong> of the two sorted arrays.</p>
<p>The overall run time complexity should be <code>O(log (m+n))</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums1 = [1,3], nums2 = [2]
Output: 2.0
Explanation: merged array = [1,2,3] and median is 2.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.5
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>nums1.length == m</code></li>
<li><code>nums2.length == n</code></li>
<li><code>0 &lt;= m &lt;= 1000</code></li>
<li><code>0 &lt;= n &lt;= 1000</code></li>
<li><code>1 &lt;= m + n &lt;= 2000</code></li>
<li><code>-10<sup>6</sup> &lt;= nums1[i], nums2[i] &lt;= 10<sup>6</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Think about partitioning both arrays such that all left elements are <= all right elements.', 'Binary search on the shorter array to find the correct partition point.', 'The median is determined by the max of the left partition and the min of the right partition.'],
  '200', 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
  'findMedianSortedArrays', '[{"name":"nums1","type":"List[int]"},{"name":"nums2","type":"List[int]"}]'::jsonb, 'float',
  '[{"inputs":["[1,3]","[2]"],"expected":"2.0"},{"inputs":["[1,2]","[3,4]"],"expected":"2.5"},{"inputs":["[0,0]","[0,0]"],"expected":"0.0"},{"inputs":["[]","[1]"],"expected":"1.0"},{"inputs":["[2]","[]"],"expected":"2.0"},{"inputs":["[1,2,3]","[4,5,6]"],"expected":"3.5"},{"inputs":["[1,3,5]","[2,4,6]"],"expected":"3.5"},{"inputs":["[1]","[2,3,4,5,6]"],"expected":"3.5"},{"inputs":["[3]","[-2,-1]"],"expected":"-1.0"},{"inputs":["[1,2]","[-1,3]"],"expected":"1.5"},{"inputs":["[1,2,3,4,5]","[6,7,8,9,10]"],"expected":"5.5"},{"inputs":["[1]","[1]"],"expected":"1.0"},{"inputs":["[]","[2,3]"],"expected":"2.5"},{"inputs":["[1,2,3]","[]"],"expected":"2.0"},{"inputs":["[100,200]","[150]"],"expected":"150.0"},{"inputs":["[1,2,3,4]","[5,6,7,8,9]"],"expected":"5.0"},{"inputs":["[1,1,1]","[1,1,1]"],"expected":"1.0"},{"inputs":["[-5,-3,-1]","[-2,0,2]"],"expected":"-1.5"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'median-two-sorted', 1, 'Binary Search on Shorter Array',
  'We partition both arrays into left and right halves such that every element on the left is <= every element on the right, and the left half has exactly half the total elements. We binary search on the shorter array to find the correct partition. The median is then computed from the boundary elements.',
  '["Ensure nums1 is the shorter array (swap if needed).","Binary search on nums1 with left = 0, right = len(nums1).","For each partition i in nums1, compute j = (m+n+1)//2 - i for nums2.","Check if partition is valid: maxLeft1 <= minRight2 and maxLeft2 <= minRight1.","If valid, compute median from boundary values. If odd total, median = max(left). If even, median = (max(left) + min(right)) / 2.","Round result to 5 decimal places."]'::jsonb,
  $PY$class Solution:
    def findMedianSortedArrays(self, nums1: list, nums2: list) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        left, right = 0, m
        while left <= right:
            i = (left + right) // 2
            j = (m + n + 1) // 2 - i
            max_left1 = float('-inf') if i == 0 else nums1[i - 1]
            min_right1 = float('inf') if i == m else nums1[i]
            max_left2 = float('-inf') if j == 0 else nums2[j - 1]
            min_right2 = float('inf') if j == n else nums2[j]
            if max_left1 <= min_right2 and max_left2 <= min_right1:
                if (m + n) % 2 == 1:
                    return round(float(max(max_left1, max_left2)), 5)
                else:
                    return round((max(max_left1, max_left2) + min(min_right1, min_right2)) / 2.0, 5)
            elif max_left1 > min_right2:
                right = i - 1
            else:
                left = i + 1
        return 0.0$PY$,
  $JS$var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
    const m = nums1.length, n = nums2.length;
    let left = 0, right = m;
    while (left <= right) {
        const i = Math.floor((left + right) / 2);
        const j = Math.floor((m + n + 1) / 2) - i;
        const maxLeft1 = i === 0 ? -Infinity : nums1[i - 1];
        const minRight1 = i === m ? Infinity : nums1[i];
        const maxLeft2 = j === 0 ? -Infinity : nums2[j - 1];
        const minRight2 = j === n ? Infinity : nums2[j];
        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            if ((m + n) % 2 === 1) {
                return Math.round(Math.max(maxLeft1, maxLeft2) * 100000) / 100000;
            } else {
                return Math.round((Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2 * 100000) / 100000;
            }
        } else if (maxLeft1 > minRight2) {
            right = i - 1;
        } else {
            left = i + 1;
        }
    }
    return 0.0;
};$JS$,
  $JAVA$class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            int[] temp = nums1; nums1 = nums2; nums2 = temp;
        }
        int m = nums1.length, n = nums2.length;
        int left = 0, right = m;
        while (left <= right) {
            int i = (left + right) / 2;
            int j = (m + n + 1) / 2 - i;
            int maxLeft1 = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRight1 = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeft2 = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRight2 = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 1) {
                    return Math.round(Math.max(maxLeft1, maxLeft2) * 100000.0) / 100000.0;
                } else {
                    return Math.round((Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0 * 100000.0) / 100000.0;
                }
            } else if (maxLeft1 > minRight2) {
                right = i - 1;
            } else {
                left = i + 1;
            }
        }
        return 0.0;
    }
}$JAVA$,
  'O(log(min(m,n)))', 'O(1)'
);

-- ============================================================
-- 5. first-last-position (Medium, LeetCode 34) — BINARY SEARCH
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'first-last-position', 'binary-search', 'Find First and Last Position of Element in Sorted Array', 'Medium',
  $DESC$<p>Given an array of integers <code>nums</code> sorted in non-decreasing order, find the starting and ending position of a given <code>target</code> value.</p>
<p>If <code>target</code> is not found in the array, return <code>[-1, -1]</code>.</p>
<p>You must write an algorithm with <code>O(log n)</code> runtime complexity.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [5,7,7,8,8,10], target = 8
Output: [3,4]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [5,7,7,8,8,10], target = 6
Output: [-1,-1]</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: nums = [], target = 0
Output: [-1,-1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
<li><code>nums</code> is a non-decreasing array.</li>
<li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Use binary search twice: once to find the leftmost position and once for the rightmost.', 'For the leftmost: when you find target, keep searching left (right = mid - 1) and record the position.', 'For the rightmost: when you find target, keep searching right (left = mid + 1) and record the position.'],
  '200', 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
  'searchRange', '[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb, 'List[int]',
  '[{"inputs":["[5,7,7,8,8,10]","8"],"expected":"[3,4]"},{"inputs":["[5,7,7,8,8,10]","6"],"expected":"[-1,-1]"},{"inputs":["[]","0"],"expected":"[-1,-1]"},{"inputs":["[1]","1"],"expected":"[0,0]"},{"inputs":["[1]","2"],"expected":"[-1,-1]"},{"inputs":["[2,2]","2"],"expected":"[0,1]"},{"inputs":["[1,2,3]","2"],"expected":"[1,1]"},{"inputs":["[1,1,1,1,1]","1"],"expected":"[0,4]"},{"inputs":["[1,2,3,4,5]","5"],"expected":"[4,4]"},{"inputs":["[1,2,3,4,5]","1"],"expected":"[0,0]"},{"inputs":["[1,3,3,3,5]","3"],"expected":"[1,3]"},{"inputs":["[1,2,2,2,2,3]","2"],"expected":"[1,4]"},{"inputs":["[1,2,3,4,5]","6"],"expected":"[-1,-1]"},{"inputs":["[1,2,3,4,5]","0"],"expected":"[-1,-1]"},{"inputs":["[2,2,2,2,2]","2"],"expected":"[0,4]"},{"inputs":["[1,4,4,4,4,4,8]","4"],"expected":"[1,5]"},{"inputs":["[1,2,5,5,6,6,8,9]","5"],"expected":"[2,3]"},{"inputs":["[1,2,5,5,6,6,8,9]","7"],"expected":"[-1,-1]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'first-last-position', 1, 'Two Binary Searches',
  'We run binary search twice: once to find the first (leftmost) occurrence of target, and once to find the last (rightmost) occurrence. In the first search, when we find target we continue searching left. In the second, we continue searching right.',
  '["Define a helper findBound(isFirst) that binary searches for the first or last occurrence.","For first occurrence: when nums[mid] == target, record mid and set right = mid - 1.","For last occurrence: when nums[mid] == target, record mid and set left = mid + 1.","If nums[mid] < target, set left = mid + 1. If nums[mid] > target, set right = mid - 1.","Return [findBound(true), findBound(false)]. Return [-1,-1] if target not found."]'::jsonb,
  $PY$class Solution:
    def searchRange(self, nums: list, target: int) -> list:
        def findBound(isFirst):
            left, right = 0, len(nums) - 1
            bound = -1
            while left <= right:
                mid = (left + right) // 2
                if nums[mid] == target:
                    bound = mid
                    if isFirst:
                        right = mid - 1
                    else:
                        left = mid + 1
                elif nums[mid] < target:
                    left = mid + 1
                else:
                    right = mid - 1
            return bound
        return [findBound(True), findBound(False)]$PY$,
  $JS$var searchRange = function(nums, target) {
    function findBound(isFirst) {
        let left = 0, right = nums.length - 1, bound = -1;
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (nums[mid] === target) {
                bound = mid;
                if (isFirst) right = mid - 1;
                else left = mid + 1;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return bound;
    }
    return [findBound(true), findBound(false)];
};$JS$,
  $JAVA$class Solution {
    public int[] searchRange(int[] nums, int target) {
        return new int[]{findBound(nums, target, true), findBound(nums, target, false)};
    }

    private int findBound(int[] nums, int target, boolean isFirst) {
        int left = 0, right = nums.length - 1, bound = -1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                bound = mid;
                if (isFirst) right = mid - 1;
                else left = mid + 1;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return bound;
    }
}$JAVA$,
  'O(log n)', 'O(1)'
);

-- ============================================================
-- 6. max-consecutive-ones-iii (Medium, LeetCode 1004) — SLIDING WINDOW
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'max-consecutive-ones-iii', 'sliding-window', 'Max Consecutive Ones III', 'Medium',
  $DESC$<p>Given a binary array <code>nums</code> and an integer <code>k</code>, return <em>the maximum number of consecutive</em> <code>1</code><em>''s in the array if you can flip at most</em> <code>k</code> <code>0</code><em>''s</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2
Output: 6
Explanation: [1,1,1,0,0,<u><strong>1</strong>,1,1,1,1,<strong>1</strong></u>]
Bolded numbers were flipped from 0 to 1. The longest subarray is underlined.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1], k = 3
Output: 10
Explanation: [0,0,<u>1,1,<strong>1</strong>,<strong>1</strong>,1,1,1,<strong>1</strong>,1,1</u>,0,0,0,1,1,1,1]
Bolded numbers were flipped from 0 to 1. The longest subarray is underlined.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
<li><code>nums[i]</code> is either <code>0</code> or <code>1</code>.</li>
<li><code>0 &lt;= k &lt;= nums.length</code></li>
</ul>$DESC$,
  '', ARRAY['Use a sliding window that allows at most k zeros inside it.', 'Expand the right pointer. If the element is 0, decrement your zero budget. When zeros exceed k, shrink from the left.', 'Track the maximum window size throughout.'],
  '200', 'https://leetcode.com/problems/max-consecutive-ones-iii/',
  'longestOnes', '[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["[1,1,1,0,0,0,1,1,1,1,0]","2"],"expected":"6"},{"inputs":["[0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1]","3"],"expected":"10"},{"inputs":["[1,1,1,1]","0"],"expected":"4"},{"inputs":["[0,0,0,0]","0"],"expected":"0"},{"inputs":["[0,0,0,0]","4"],"expected":"4"},{"inputs":["[1]","0"],"expected":"1"},{"inputs":["[0]","0"],"expected":"0"},{"inputs":["[0]","1"],"expected":"1"},{"inputs":["[1,0,1,0,1]","1"],"expected":"3"},{"inputs":["[1,0,1,0,1]","2"],"expected":"5"},{"inputs":["[0,0,0,1,1,1,0,0,0]","2"],"expected":"5"},{"inputs":["[1,1,0,0,1,1,1,0,1]","1"],"expected":"5"},{"inputs":["[1,0,0,0,1,1,0,0,1,1,1]","2"],"expected":"7"},{"inputs":["[0,1,0,1,0,1,0]","3"],"expected":"6"},{"inputs":["[1,1,1,0,0,0,0,1,1,1]","3"],"expected":"6"},{"inputs":["[1,0,0,1,0,1,0,0,1]","3"],"expected":"6"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'max-consecutive-ones-iii', 1, 'Sliding Window',
  'We maintain a window [left, right] that contains at most k zeros. When we encounter a zero, we use one flip. If we exceed k flips, we shrink from the left until we have at most k zeros in the window. The answer is the maximum window size seen.',
  '["Initialize left = 0, zeroCount = 0, maxLen = 0.","Iterate right from 0 to n-1.","If nums[right] == 0, increment zeroCount.","While zeroCount > k, if nums[left] == 0 decrement zeroCount, then increment left.","Update maxLen = max(maxLen, right - left + 1).","Return maxLen."]'::jsonb,
  $PY$class Solution:
    def longestOnes(self, nums: list, k: int) -> int:
        left = 0
        zero_count = 0
        max_len = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zero_count += 1
            while zero_count > k:
                if nums[left] == 0:
                    zero_count -= 1
                left += 1
            max_len = max(max_len, right - left + 1)
        return max_len$PY$,
  $JS$var longestOnes = function(nums, k) {
    let left = 0, zeroCount = 0, maxLen = 0;
    for (let right = 0; right < nums.length; right++) {
        if (nums[right] === 0) zeroCount++;
        while (zeroCount > k) {
            if (nums[left] === 0) zeroCount--;
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};$JS$,
  $JAVA$class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0, zeroCount = 0, maxLen = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeroCount++;
            while (zeroCount > k) {
                if (nums[left] == 0) zeroCount--;
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 7. fruit-into-baskets (Medium, LeetCode 904) — SLIDING WINDOW
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'fruit-into-baskets', 'sliding-window', 'Fruit Into Baskets', 'Medium',
  $DESC$<p>You are visiting a farm that has a single row of fruit trees arranged from left to right. The trees are represented by an integer array <code>fruits</code> where <code>fruits[i]</code> is the <strong>type</strong> of fruit the <code>i<sup>th</sup></code> tree produces.</p>
<p>You want to collect as much fruit as possible. However, the owner has some strict rules:</p>
<ul>
<li>You only have <strong>two</strong> baskets, and each basket can only hold a <strong>single type</strong> of fruit.</li>
<li>Starting from any tree of your choice, you must pick <strong>exactly one fruit</strong> from every tree (including the start tree) while moving to the right. You must stop when you encounter a tree with fruit that cannot fit in either basket.</li>
</ul>
<p>Return <em>the maximum number of fruits you can pick</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: fruits = [1,2,1]
Output: 3
Explanation: We can pick from all 3 trees.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: fruits = [0,1,2,2]
Output: 3
Explanation: We can pick from trees [1,2,2]. Starting at tree index 1.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: fruits = [1,2,3,2,2]
Output: 4
Explanation: We can pick from trees [2,3,2,2]. Starting at tree index 1.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= fruits.length &lt;= 10<sup>5</sup></code></li>
<li><code>0 &lt;= fruits[i] &lt; fruits.length</code></li>
</ul>$DESC$,
  '', ARRAY['This is essentially: find the longest subarray with at most 2 distinct elements.', 'Use a sliding window with a hashmap to count fruit types in the current window.', 'When the number of distinct types exceeds 2, shrink from the left.'],
  '200', 'https://leetcode.com/problems/fruit-into-baskets/',
  'totalFruit', '[{"name":"fruits","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[1,2,1]"],"expected":"3"},{"inputs":["[0,1,2,2]"],"expected":"3"},{"inputs":["[1,2,3,2,2]"],"expected":"4"},{"inputs":["[3,3,3,1,2,1,1,2,3,3,4]"],"expected":"5"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[1,1]"],"expected":"2"},{"inputs":["[1,2]"],"expected":"2"},{"inputs":["[1,2,3]"],"expected":"2"},{"inputs":["[1,1,1,1,1]"],"expected":"5"},{"inputs":["[0,0,1,1,0,0]"],"expected":"6"},{"inputs":["[1,0,1,4,1,4,1,2,3]"],"expected":"5"},{"inputs":["[5,5,5,5,6,6,6,6]"],"expected":"8"},{"inputs":["[1,2,1,2,1,2,1]"],"expected":"7"},{"inputs":["[4,3,2,1]"],"expected":"2"},{"inputs":["[0,1,0,1,0,1,0,2]"],"expected":"7"},{"inputs":["[3,3,3,1,1,2,2,2,2]"],"expected":"6"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'fruit-into-baskets', 1, 'Sliding Window with HashMap',
  'This problem reduces to finding the longest subarray with at most 2 distinct values. We use a sliding window: expand right to include new fruits, and when we have more than 2 types, shrink from the left until we are back to 2 types.',
  '["Initialize left = 0, maxLen = 0, and a hashmap count to track fruit type frequencies.","Iterate right from 0 to n-1. Add fruits[right] to count.","While count has more than 2 keys, decrement count[fruits[left]] and remove it if zero, then increment left.","Update maxLen = max(maxLen, right - left + 1).","Return maxLen."]'::jsonb,
  $PY$class Solution:
    def totalFruit(self, fruits: list) -> int:
        count = {}
        left = 0
        max_len = 0
        for right in range(len(fruits)):
            count[fruits[right]] = count.get(fruits[right], 0) + 1
            while len(count) > 2:
                count[fruits[left]] -= 1
                if count[fruits[left]] == 0:
                    del count[fruits[left]]
                left += 1
            max_len = max(max_len, right - left + 1)
        return max_len$PY$,
  $JS$var totalFruit = function(fruits) {
    const count = new Map();
    let left = 0, maxLen = 0;
    for (let right = 0; right < fruits.length; right++) {
        count.set(fruits[right], (count.get(fruits[right]) || 0) + 1);
        while (count.size > 2) {
            count.set(fruits[left], count.get(fruits[left]) - 1);
            if (count.get(fruits[left]) === 0) count.delete(fruits[left]);
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};$JS$,
  $JAVA$class Solution {
    public int totalFruit(int[] fruits) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < fruits.length; right++) {
            count.merge(fruits[right], 1, Integer::sum);
            while (count.size() > 2) {
                int leftFruit = fruits[left];
                count.merge(leftFruit, -1, Integer::sum);
                if (count.get(leftFruit) == 0) count.remove(leftFruit);
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 8. minimum-size-subarray (Medium, LeetCode 209) — SLIDING WINDOW
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'minimum-size-subarray', 'sliding-window', 'Minimum Size Subarray Sum', 'Medium',
  $DESC$<p>Given an array of positive integers <code>nums</code> and a positive integer <code>target</code>, return <em>the <strong>minimal length</strong> of a subarray whose sum is greater than or equal to</em> <code>target</code>. If there is no such subarray, return <code>0</code> instead.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: target = 7, nums = [2,3,1,2,4,3]
Output: 2
Explanation: The subarray [4,3] has the minimal length under the problem constraint.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: target = 4, nums = [1,4,4]
Output: 1</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: target = 11, nums = [1,1,1,1,1,1,1,1]
Output: 0</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= target &lt;= 10<sup>9</sup></code></li>
<li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
<li><code>1 &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Use a sliding window: expand right to increase the sum, then shrink from left while the sum is still >= target.', 'Each time the window sum >= target, update the answer with the current window length and try to shrink.', 'If no valid window is found, return 0.'],
  '200', 'https://leetcode.com/problems/minimum-size-subarray-sum/',
  'minSubArrayLen', '[{"name":"target","type":"int"},{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["7","[2,3,1,2,4,3]"],"expected":"2"},{"inputs":["4","[1,4,4]"],"expected":"1"},{"inputs":["11","[1,1,1,1,1,1,1,1]"],"expected":"0"},{"inputs":["15","[1,2,3,4,5]"],"expected":"5"},{"inputs":["6","[10,2,3]"],"expected":"1"},{"inputs":["5","[2,3,1,1,1,1,1]"],"expected":"2"},{"inputs":["3","[1,1]"],"expected":"0"},{"inputs":["1","[1]"],"expected":"1"},{"inputs":["100","[1,2,3,4,5]"],"expected":"0"},{"inputs":["7","[1,1,1,1,7]"],"expected":"1"},{"inputs":["8","[3,4,1,1,6]"],"expected":"3"},{"inputs":["3","[1,1,1,1,1]"],"expected":"3"},{"inputs":["5","[1,2,3,4,5]"],"expected":"1"},{"inputs":["10","[5,1,3,5,10,7,4,9,2,8]"],"expected":"1"},{"inputs":["20","[2,3,1,2,4,3]"],"expected":"0"},{"inputs":["4","[1,1,1,1]"],"expected":"4"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'minimum-size-subarray', 1, 'Sliding Window',
  'Since all elements are positive, expanding the window increases the sum and shrinking decreases it. We expand right to build up the sum, and whenever the sum >= target, we try to shrink from the left to find the shortest valid window.',
  '["Initialize left = 0, currentSum = 0, minLen = infinity.","Iterate right from 0 to n-1. Add nums[right] to currentSum.","While currentSum >= target, update minLen = min(minLen, right - left + 1), subtract nums[left] from currentSum, and increment left.","After the loop, return minLen if it was updated, otherwise return 0."]'::jsonb,
  $PY$class Solution:
    def minSubArrayLen(self, target: int, nums: list) -> int:
        left = 0
        current_sum = 0
        min_len = float('inf')
        for right in range(len(nums)):
            current_sum += nums[right]
            while current_sum >= target:
                min_len = min(min_len, right - left + 1)
                current_sum -= nums[left]
                left += 1
        return min_len if min_len != float('inf') else 0$PY$,
  $JS$var minSubArrayLen = function(target, nums) {
    let left = 0, currentSum = 0, minLen = Infinity;
    for (let right = 0; right < nums.length; right++) {
        currentSum += nums[right];
        while (currentSum >= target) {
            minLen = Math.min(minLen, right - left + 1);
            currentSum -= nums[left];
            left++;
        }
    }
    return minLen === Infinity ? 0 : minLen;
};$JS$,
  $JAVA$class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, currentSum = 0, minLen = Integer.MAX_VALUE;
        for (int right = 0; right < nums.length; right++) {
            currentSum += nums[right];
            while (currentSum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                currentSum -= nums[left];
                left++;
            }
        }
        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 9. subarray-product-less-than-k (Medium, LeetCode 713) — SLIDING WINDOW
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'subarray-product-less-than-k', 'sliding-window', 'Subarray Product Less Than K', 'Medium',
  $DESC$<p>Given an array of integers <code>nums</code> and an integer <code>k</code>, return <em>the number of contiguous subarrays where the product of all the elements in the subarray is strictly less than</em> <code>k</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [10,5,2,6], k = 100
Output: 8
Explanation: The 8 subarrays that have product less than 100 are:
[10], [5], [2], [6], [10,5], [5,2], [2,6], [5,2,6]
Note that [10,5,2] is not included as the product of 100 is not strictly less than k.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1,2,3], k = 0
Output: 0</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 3 * 10<sup>4</sup></code></li>
<li><code>1 &lt;= nums[i] &lt;= 1000</code></li>
<li><code>0 &lt;= k &lt;= 10<sup>6</sup></code></li>
</ul>$DESC$,
  '', ARRAY['If k <= 1, no subarray of positive integers can have product < k, so return 0.', 'Use a sliding window: maintain the product of the window. When product >= k, shrink from the left.', 'For each right position, the number of valid subarrays ending at right is (right - left + 1).'],
  '200', 'https://leetcode.com/problems/subarray-product-less-than-k/',
  'numSubarrayProductLessThanK', '[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["[10,5,2,6]","100"],"expected":"8"},{"inputs":["[1,2,3]","0"],"expected":"0"},{"inputs":["[1,1,1]","2"],"expected":"6"},{"inputs":["[10]","10"],"expected":"0"},{"inputs":["[10]","11"],"expected":"1"},{"inputs":["[1,2,3]","7"],"expected":"6"},{"inputs":["[1,2,3,4]","10"],"expected":"7"},{"inputs":["[10,9,10,4,3,8,3,3,6,2,10,10,9,3]","19"],"expected":"18"},{"inputs":["[1,1,1,1]","5"],"expected":"10"},{"inputs":["[5,5,5]","25"],"expected":"3"},{"inputs":["[5,5,5]","26"],"expected":"5"},{"inputs":["[2,3,4]","1"],"expected":"0"},{"inputs":["[1]","1"],"expected":"0"},{"inputs":["[1]","2"],"expected":"1"},{"inputs":["[100,200]","300"],"expected":"2"},{"inputs":["[2,2,2,2]","16"],"expected":"9"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'subarray-product-less-than-k', 1, 'Sliding Window',
  'We maintain a window whose product is less than k. As we expand the window to the right, if the product becomes >= k, we shrink from the left by dividing out elements. For each right endpoint, all subarrays ending at right and starting at any index from left to right are valid, giving (right - left + 1) new subarrays.',
  '["If k <= 1, return 0 (all elements are >= 1, so no product can be < 1 or < 0).","Initialize left = 0, product = 1, count = 0.","Iterate right from 0 to n-1. Multiply product by nums[right].","While product >= k, divide product by nums[left] and increment left.","Add (right - left + 1) to count — these are all valid subarrays ending at right.","Return count."]'::jsonb,
  $PY$class Solution:
    def numSubarrayProductLessThanK(self, nums: list, k: int) -> int:
        if k <= 1:
            return 0
        left = 0
        product = 1
        count = 0
        for right in range(len(nums)):
            product *= nums[right]
            while product >= k:
                product //= nums[left]
                left += 1
            count += right - left + 1
        return count$PY$,
  $JS$var numSubarrayProductLessThanK = function(nums, k) {
    if (k <= 1) return 0;
    let left = 0, product = 1, count = 0;
    for (let right = 0; right < nums.length; right++) {
        product *= nums[right];
        while (product >= k) {
            product /= nums[left];
            left++;
        }
        count += right - left + 1;
    }
    return count;
};$JS$,
  $JAVA$class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) return 0;
        int left = 0, count = 0;
        double product = 1;
        for (int right = 0; right < nums.length; right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left];
                left++;
            }
            count += right - left + 1;
        }
        return count;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

COMMIT;
