-- Grow catalog 400 → 500: heap topic (+8 problems: 2E, 4M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'kth-largest-in-stream','last-stone-weight-500',
  'seat-reservation-manager','top-k-frequent-elements-500','k-closest-points-500','sort-characters-freq-500',
  'smallest-range-covering','trapping-rain-water-ii-500'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'kth-largest-in-stream','last-stone-weight-500',
  'seat-reservation-manager','top-k-frequent-elements-500','k-closest-points-500','sort-characters-freq-500',
  'smallest-range-covering','trapping-rain-water-ii-500'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'kth-largest-in-stream','last-stone-weight-500',
  'seat-reservation-manager','top-k-frequent-elements-500','k-closest-points-500','sort-characters-freq-500',
  'smallest-range-covering','trapping-rain-water-ii-500'
);

-- ============================================================
-- 1) kth-largest-in-stream (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('kth-largest-in-stream', 'heap', 'Kth Largest Element in a Stream', 'Easy',
$$<p>Design a class to find the k-th largest element in a stream. Given <code>k</code>, an initial array <code>nums</code>, and a list of values to add, return the k-th largest element after each addition.</p><p>Input: k, nums, and adds (list of values). Return a list of the k-th largest after each add.</p>$$,
'', ARRAY[
  'Maintain a min-heap of size k.',
  'The top of the heap is always the k-th largest element.',
  'When adding, push to heap and pop if size exceeds k.'
], '500', 'https://leetcode.com/problems/kth-largest-element-in-a-stream/',
'kthLargestStream',
'[{"name":"k","type":"int"},{"name":"nums","type":"List[int]"},{"name":"adds","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["3","[4,5,8,2]","[3,5,10,9,4]"],"expected":"[4,5,5,8,8]"},
  {"inputs":["1","[]","[1,2,3]"],"expected":"[1,2,3]"},
  {"inputs":["2","[0]","[1,2,3]"],"expected":"[0,1,2]"},
  {"inputs":["1","[5]","[10]"],"expected":"[10]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('kth-largest-in-stream', 'python',
$PY$class Solution:
    def kthLargestStream(self, k: int, nums: List[int], adds: List[int]) -> List[int]:
        $PY$),
('kth-largest-in-stream', 'javascript',
$JS$var kthLargestStream = function(k, nums, adds) {

};$JS$),
('kth-largest-in-stream', 'java',
$JAVA$class Solution {
    public int[] kthLargestStream(int k, int[] nums, int[] adds) {

    }
}$JAVA$),
('kth-largest-in-stream', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargestStream(int k, vector<int>& nums, vector<int>& adds) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('kth-largest-in-stream', 1, 'Min-Heap of Size K',
'A min-heap of size k always has the k-th largest at the top. When adding a new element, push it and pop if the heap exceeds size k.',
$ALGO$["Build a min-heap from nums. Pop until size is k.","For each val in adds: push val. If heap size > k, pop.","Append heap top to result.","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def kthLargestStream(self, k: int, nums: List[int], adds: List[int]) -> List[int]:
        import heapq
        heap = nums[:]
        heapq.heapify(heap)
        while len(heap) > k:
            heapq.heappop(heap)
        result = []
        for val in adds:
            heapq.heappush(heap, val)
            if len(heap) > k:
                heapq.heappop(heap)
            result.append(heap[0])
        return result
$PY$,
$JS$var kthLargestStream = function(k, nums, adds) {
    // Simple sorted array approach for JS
    const sorted = [...nums].sort((a, b) => a - b);
    while (sorted.length > k) sorted.shift();
    const result = [];
    for (const val of adds) {
        // Insert in sorted position
        let lo = 0, hi = sorted.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (sorted[mid] < val) lo = mid + 1;
            else hi = mid;
        }
        sorted.splice(lo, 0, val);
        if (sorted.length > k) sorted.shift();
        result.push(sorted[0]);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] kthLargestStream(int k, int[] nums, int[] adds) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int n : nums) heap.add(n);
        while (heap.size() > k) heap.poll();
        int[] result = new int[adds.length];
        for (int i = 0; i < adds.length; i++) {
            heap.add(adds[i]);
            if (heap.size() > k) heap.poll();
            result[i] = heap.peek();
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> kthLargestStream(int k, vector<int>& nums, vector<int>& adds) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int n : nums) heap.push(n);
        while ((int)heap.size() > k) heap.pop();
        vector<int> result;
        for (int val : adds) {
            heap.push(val);
            if ((int)heap.size() > k) heap.pop();
            result.push_back(heap.top());
        }
        return result;
    }
};
$CPP$,
'O((n + m) log k)', 'O(k)');

-- ============================================================
-- 2) last-stone-weight-500 (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('last-stone-weight-500', 'heap', 'Last Stone Weight', 'Easy',
$$<p>You are given an array of integers <code>stones</code> where <code>stones[i]</code> is the weight of the i-th stone. Each turn, take the two heaviest stones and smash them. If they have the same weight, both are destroyed. If different, the lighter is destroyed and the heavier''s weight is reduced by the lighter''s weight. Return the weight of the last remaining stone, or 0 if no stones remain.</p>$$,
'', ARRAY[
  'Use a max-heap to always get the two heaviest stones.',
  'After smashing, push the remainder (if any) back.',
  'Continue until 0 or 1 stones remain.'
], '500', 'https://leetcode.com/problems/last-stone-weight/',
'lastStoneWeight',
'[{"name":"stones","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[2,7,4,1,8,1]"],"expected":"1"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[3,3]"],"expected":"0"},
  {"inputs":["[10,4,2,10]"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('last-stone-weight-500', 'python',
$PY$class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        $PY$),
('last-stone-weight-500', 'javascript',
$JS$var lastStoneWeight = function(stones) {

};$JS$),
('last-stone-weight-500', 'java',
$JAVA$class Solution {
    public int lastStoneWeight(int[] stones) {

    }
}$JAVA$),
('last-stone-weight-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('last-stone-weight-500', 1, 'Max-Heap Simulation',
'A max-heap lets us efficiently extract the two heaviest stones. After smashing, push back the difference if non-zero. Repeat until one or zero stones remain.',
$ALGO$["Build a max-heap from stones (negate values for Python min-heap).","While heap has 2+ elements: pop two heaviest.","If they differ, push the difference back.","Return the last element (or 0 if empty)."]$ALGO$::jsonb,
$PY$class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        import heapq
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)
            b = -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0
$PY$,
$JS$var lastStoneWeight = function(stones) {
    while (stones.length > 1) {
        stones.sort((a, b) => b - a);
        const a = stones.shift();
        const b = stones.shift();
        if (a !== b) stones.push(a - b);
    }
    return stones.length ? stones[0] : 0;
};
$JS$,
$JAVA$class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) heap.add(s);
        while (heap.size() > 1) {
            int a = heap.poll();
            int b = heap.poll();
            if (a != b) heap.add(a - b);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int a = heap.top(); heap.pop();
            int b = heap.top(); heap.pop();
            if (a != b) heap.push(a - b);
        }
        return heap.empty() ? 0 : heap.top();
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 3) seat-reservation-manager (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('seat-reservation-manager', 'heap', 'Seat Reservation Manager', 'Medium',
$$<p>Design a system that manages <code>n</code> seats numbered 1 to n. Given a list of operations: <code>"reserve"</code> returns the smallest unreserved seat, <code>"unreserve x"</code> unreserves seat x. Return the list of seat numbers for each reserve operation.</p>$$,
'', ARRAY[
  'Use a min-heap to track available seats.',
  'Reserve: pop the smallest from the heap.',
  'Unreserve: push the seat number back into the heap.'
], '500', 'https://leetcode.com/problems/seat-reservation-manager/',
'seatManager',
'[{"name":"n","type":"int"},{"name":"ops","type":"List[List[str]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["5","[[\"reserve\"],[\"reserve\"],[\"unreserve\",\"2\"],[\"reserve\"],[\"reserve\"],[\"reserve\"],[\"reserve\"],[\"unreserve\",\"5\"]]"],"expected":"[1,2,2,3,4,5]"},
  {"inputs":["3","[[\"reserve\"],[\"reserve\"],[\"reserve\"]]"],"expected":"[1,2,3]"},
  {"inputs":["2","[[\"reserve\"],[\"unreserve\",\"1\"],[\"reserve\"]]"],"expected":"[1,1]"},
  {"inputs":["1","[[\"reserve\"]]"],"expected":"[1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('seat-reservation-manager', 'python',
$PY$class Solution:
    def seatManager(self, n: int, ops: List[List[str]]) -> List[int]:
        $PY$),
('seat-reservation-manager', 'javascript',
$JS$var seatManager = function(n, ops) {

};$JS$),
('seat-reservation-manager', 'java',
$JAVA$class Solution {
    public List<Integer> seatManager(int n, String[][] ops) {

    }
}$JAVA$),
('seat-reservation-manager', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> seatManager(int n, vector<vector<string>>& ops) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('seat-reservation-manager', 1, 'Min-Heap',
'A min-heap of available seats always gives us the smallest available seat in O(log n). Unreserving pushes the seat back into the heap.',
$ALGO$["Initialize min-heap with seats 1 to n.","For each operation: if reserve, pop and record. If unreserve, push seat back.","Return list of reserved seats."]$ALGO$::jsonb,
$PY$class Solution:
    def seatManager(self, n: int, ops: List[List[str]]) -> List[int]:
        import heapq
        heap = list(range(1, n + 1))
        heapq.heapify(heap)
        result = []
        for op in ops:
            if op[0] == "reserve":
                result.append(heapq.heappop(heap))
            else:
                heapq.heappush(heap, int(op[1]))
        return result
$PY$,
$JS$var seatManager = function(n, ops) {
    const available = [];
    for (let i = 1; i <= n; i++) available.push(i);
    const result = [];
    for (const op of ops) {
        if (op[0] === "reserve") {
            available.sort((a, b) => a - b);
            result.push(available.shift());
        } else {
            available.push(Number(op[1]));
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> seatManager(int n, String[][] ops) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int i = 1; i <= n; i++) heap.add(i);
        List<Integer> result = new ArrayList<>();
        for (String[] op : ops) {
            if (op[0].equals("reserve")) {
                result.add(heap.poll());
            } else {
                heap.add(Integer.parseInt(op[1]));
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> seatManager(int n, vector<vector<string>>& ops) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 1; i <= n; i++) heap.push(i);
        vector<int> result;
        for (auto& op : ops) {
            if (op[0] == "reserve") {
                result.push_back(heap.top());
                heap.pop();
            } else {
                heap.push(stoi(op[1]));
            }
        }
        return result;
    }
};
$CPP$,
'O(m log n) where m = number of operations', 'O(n)');

-- ============================================================
-- 4) top-k-frequent-elements-500 (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('top-k-frequent-elements-500', 'heap', 'Top K Frequent Elements', 'Medium',
$$<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code> most frequent elements. You may return the answer in <strong>any order</strong>.</p>$$,
'', ARRAY[
  'Count frequencies using a hash map.',
  'Use a min-heap of size k to keep the k most frequent elements.',
  'Alternatively, use bucket sort for O(n) time.'
], '500', 'https://leetcode.com/problems/top-k-frequent-elements/',
'topKFrequent',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,1,1,2,2,3]","2"],"expected":"[1,2]"},
  {"inputs":["[1]","1"],"expected":"[1]"},
  {"inputs":["[4,4,4,4,2,2,3,3,3]","2"],"expected":"[4,3]"},
  {"inputs":["[1,2]","2"],"expected":"[1,2]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('top-k-frequent-elements-500', 'python',
$PY$class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        $PY$),
('top-k-frequent-elements-500', 'javascript',
$JS$var topKFrequent = function(nums, k) {

};$JS$),
('top-k-frequent-elements-500', 'java',
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {

    }
}$JAVA$),
('top-k-frequent-elements-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('top-k-frequent-elements-500', 1, 'Min-Heap of Size K',
'Count frequencies, then maintain a min-heap of size k keyed by frequency. After processing all elements, the heap contains the k most frequent.',
$ALGO$["Count frequencies with a hash map.","For each (num, freq): push to min-heap. If heap size > k, pop.","Return heap elements."]$ALGO$::jsonb,
$PY$class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        from collections import Counter
        import heapq
        count = Counter(nums)
        return heapq.nlargest(k, count.keys(), key=count.get)
$PY$,
$JS$var topKFrequent = function(nums, k) {
    const count = {};
    for (const n of nums) count[n] = (count[n] || 0) + 1;
    return Object.keys(count)
        .sort((a, b) => count[b] - count[a])
        .slice(0, k)
        .map(Number);
};
$JS$,
$JAVA$class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int n : nums) count.merge(n, 1, Integer::sum);
        PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> count.get(a) - count.get(b));
        for (int num : count.keySet()) {
            heap.add(num);
            if (heap.size() > k) heap.poll();
        }
        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = heap.poll();
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> count;
        for (int n : nums) count[n]++;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        for (auto& [num, freq] : count) {
            heap.push({freq, num});
            if ((int)heap.size() > k) heap.pop();
        }
        vector<int> result;
        while (!heap.empty()) {
            result.push_back(heap.top().second);
            heap.pop();
        }
        return result;
    }
};
$CPP$,
'O(n log k)', 'O(n)');

-- ============================================================
-- 5) k-closest-points-500 (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('k-closest-points-500', 'heap', 'K Closest Points to Origin', 'Medium',
$$<p>Given an array of <code>points</code> where <code>points[i] = [x_i, y_i]</code> represents a point on the X-Y plane and an integer <code>k</code>, return the <code>k</code> closest points to the origin <code>(0, 0)</code>. The answer is guaranteed to be unique. You may return the answer in <strong>any order</strong>.</p>$$,
'', ARRAY[
  'Distance to origin is sqrt(x^2 + y^2), but we can compare x^2 + y^2 directly.',
  'Use a max-heap of size k: keep only the k closest points.',
  'Alternatively, use quickselect for O(n) average time.'
], '500', 'https://leetcode.com/problems/k-closest-points-to-origin/',
'kClosest',
'[{"name":"points","type":"List[List[int]]"},{"name":"k","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[1,3],[-2,2]]","1"],"expected":"[[-2,2]]"},
  {"inputs":["[[3,3],[5,-1],[-2,4]]","2"],"expected":"[[3,3],[-2,4]]"},
  {"inputs":["[[0,0],[1,1]]","2"],"expected":"[[0,0],[1,1]]"},
  {"inputs":["[[1,0]]","1"],"expected":"[[1,0]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('k-closest-points-500', 'python',
$PY$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        $PY$),
('k-closest-points-500', 'javascript',
$JS$var kClosest = function(points, k) {

};$JS$),
('k-closest-points-500', 'java',
$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {

    }
}$JAVA$),
('k-closest-points-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('k-closest-points-500', 1, 'Max-Heap of Size K',
'Maintain a max-heap of size k based on distance. For each point, push it. If heap exceeds k, pop the farthest. After processing all points, the heap contains the k closest.',
$ALGO$["For each point, compute distance squared = x^2 + y^2.","Push (-distance, point) to min-heap (or (distance, point) to max-heap).","If heap size > k, pop.","Return remaining points."]$ALGO$::jsonb,
$PY$class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        import heapq
        heap = []
        for x, y in points:
            dist = x * x + y * y
            heapq.heappush(heap, (-dist, [x, y]))
            if len(heap) > k:
                heapq.heappop(heap)
        return [p for _, p in heap]
$PY$,
$JS$var kClosest = function(points, k) {
    points.sort((a, b) => (a[0]*a[0] + a[1]*a[1]) - (b[0]*b[0] + b[1]*b[1]));
    return points.slice(0, k);
};
$JS$,
$JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
            (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1]));
        for (int[] p : points) {
            heap.add(p);
            if (heap.size() > k) heap.poll();
        }
        return heap.toArray(new int[0][]);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        auto cmp = [](vector<int>& a, vector<int>& b) {
            return a[0]*a[0]+a[1]*a[1] < b[0]*b[0]+b[1]*b[1];
        };
        priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> heap(cmp);
        for (auto& p : points) {
            heap.push(p);
            if ((int)heap.size() > k) heap.pop();
        }
        vector<vector<int>> result;
        while (!heap.empty()) {
            result.push_back(heap.top());
            heap.pop();
        }
        return result;
    }
};
$CPP$,
'O(n log k)', 'O(k)');

-- ============================================================
-- 6) sort-characters-freq-500 (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('sort-characters-freq-500', 'heap', 'Sort Characters By Frequency', 'Medium',
$$<p>Given a string <code>s</code>, sort it in <strong>decreasing order</strong> based on the <strong>frequency</strong> of the characters. If multiple characters have the same frequency, their order relative to each other does not matter. Return the sorted string.</p>$$,
'', ARRAY[
  'Count the frequency of each character.',
  'Use a max-heap keyed by frequency.',
  'Pop characters and repeat them by their frequency.'
], '500', 'https://leetcode.com/problems/sort-characters-by-frequency/',
'frequencySort',
'[{"name":"s","type":"str"}]'::jsonb,
'str',
'[
  {"inputs":["\"tree\""],"expected":"\"eert\""},
  {"inputs":["\"cccaaa\""],"expected":"\"aaaccc\""},
  {"inputs":["\"Aabb\""],"expected":"\"bbAa\""},
  {"inputs":["\"a\""],"expected":"\"a\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('sort-characters-freq-500', 'python',
$PY$class Solution:
    def frequencySort(self, s: str) -> str:
        $PY$),
('sort-characters-freq-500', 'javascript',
$JS$var frequencySort = function(s) {

};$JS$),
('sort-characters-freq-500', 'java',
$JAVA$class Solution {
    public String frequencySort(String s) {

    }
}$JAVA$),
('sort-characters-freq-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string frequencySort(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('sort-characters-freq-500', 1, 'Frequency Count + Sort',
'Count each character''s frequency, sort characters by frequency descending, and build the result string by repeating each character by its count.',
$ALGO$["Count frequency of each character.","Sort characters by frequency descending.","Build result by repeating each character freq times."]$ALGO$::jsonb,
$PY$class Solution:
    def frequencySort(self, s: str) -> str:
        from collections import Counter
        count = Counter(s)
        return "".join(c * freq for c, freq in count.most_common())
$PY$,
$JS$var frequencySort = function(s) {
    const count = {};
    for (const c of s) count[c] = (count[c] || 0) + 1;
    return Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .map(([c, f]) => c.repeat(f))
        .join("");
};
$JS$,
$JAVA$class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> count = new HashMap<>();
        for (char c : s.toCharArray()) count.merge(c, 1, Integer::sum);
        PriorityQueue<Map.Entry<Character, Integer>> heap =
            new PriorityQueue<>((a, b) -> b.getValue() - a.getValue());
        heap.addAll(count.entrySet());
        StringBuilder sb = new StringBuilder();
        while (!heap.isEmpty()) {
            Map.Entry<Character, Integer> e = heap.poll();
            for (int i = 0; i < e.getValue(); i++) sb.append(e.getKey());
        }
        return sb.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string frequencySort(string s) {
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        priority_queue<pair<int, char>> heap;
        for (auto& [c, f] : count) heap.push({f, c});
        string result;
        while (!heap.empty()) {
            auto [f, c] = heap.top(); heap.pop();
            result += string(f, c);
        }
        return result;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 7) smallest-range-covering (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('smallest-range-covering', 'heap', 'Smallest Range Covering Elements from K Lists', 'Hard',
$$<p>You have <code>k</code> lists of sorted integers in non-decreasing order. Find the smallest range <code>[a, b]</code> that includes at least one number from each of the <code>k</code> lists.</p>$$,
'', ARRAY[
  'Use a min-heap containing one element from each list.',
  'Track the current maximum. The range is [heap_min, current_max].',
  'Pop the minimum, advance that list''s pointer, update max. Track the smallest range.'
], '500', 'https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/',
'smallestRange',
'[{"name":"nums","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]"],"expected":"[20,24]"},
  {"inputs":["[[1,2,3],[1,2,3],[1,2,3]]"],"expected":"[1,1]"},
  {"inputs":["[[1],[2],[3]]"],"expected":"[1,3]"},
  {"inputs":["[[10,10],[11,11]]"],"expected":"[10,11]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('smallest-range-covering', 'python',
$PY$class Solution:
    def smallestRange(self, nums: List[List[int]]) -> List[int]:
        $PY$),
('smallest-range-covering', 'javascript',
$JS$var smallestRange = function(nums) {

};$JS$),
('smallest-range-covering', 'java',
$JAVA$class Solution {
    public int[] smallestRange(int[][] nums) {

    }
}$JAVA$),
('smallest-range-covering', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> smallestRange(vector<vector<int>>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('smallest-range-covering', 1, 'Min-Heap + Track Max',
'Initialize a min-heap with the first element of each list and track the current max. The range is [heap_min, current_max]. Pop the minimum, advance its list, push the next element, update max. The smallest range seen is the answer.',
$ALGO$["Push (value, list_index, element_index) for first element of each list. Track current_max.","While true: pop min. Range = [min_val, current_max]. Update best if smaller.","Advance pointer in that list. If exhausted, break.","Push next element, update current_max.","Return best range."]$ALGO$::jsonb,
$PY$class Solution:
    def smallestRange(self, nums: List[List[int]]) -> List[int]:
        import heapq
        heap = []
        current_max = float('-inf')
        for i, lst in enumerate(nums):
            heapq.heappush(heap, (lst[0], i, 0))
            current_max = max(current_max, lst[0])
        best = [heap[0][0], current_max]
        while True:
            min_val, li, ei = heapq.heappop(heap)
            if current_max - min_val < best[1] - best[0]:
                best = [min_val, current_max]
            ei += 1
            if ei >= len(nums[li]):
                break
            next_val = nums[li][ei]
            heapq.heappush(heap, (next_val, li, ei))
            current_max = max(current_max, next_val)
        return best
$PY$,
$JS$var smallestRange = function(nums) {
    // Simple approach: merge and use sliding window
    const tagged = [];
    for (let i = 0; i < nums.length; i++) {
        for (const val of nums[i]) tagged.push([val, i]);
    }
    tagged.sort((a, b) => a[0] - b[0]);
    const count = {};
    let have = 0, need = nums.length;
    let best = [tagged[0][0], tagged[tagged.length - 1][0]];
    let left = 0;
    for (let right = 0; right < tagged.length; right++) {
        const [val, idx] = tagged[right];
        count[idx] = (count[idx] || 0) + 1;
        if (count[idx] === 1) have++;
        while (have === need) {
            const range = tagged[right][0] - tagged[left][0];
            if (range < best[1] - best[0]) {
                best = [tagged[left][0], tagged[right][0]];
            }
            count[tagged[left][1]]--;
            if (count[tagged[left][1]] === 0) have--;
            left++;
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int[] smallestRange(int[][] nums) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        int currentMax = Integer.MIN_VALUE;
        for (int i = 0; i < nums.length; i++) {
            heap.add(new int[]{nums[i][0], i, 0});
            currentMax = Math.max(currentMax, nums[i][0]);
        }
        int[] best = {heap.peek()[0], currentMax};
        while (true) {
            int[] top = heap.poll();
            int minVal = top[0], li = top[1], ei = top[2];
            if (currentMax - minVal < best[1] - best[0]) {
                best = new int[]{minVal, currentMax};
            }
            if (ei + 1 >= nums[li].length) break;
            int nextVal = nums[li][ei + 1];
            heap.add(new int[]{nextVal, li, ei + 1});
            currentMax = Math.max(currentMax, nextVal);
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> smallestRange(vector<vector<int>>& nums) {
        auto cmp = [](auto& a, auto& b) { return a[0] > b[0]; };
        priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> heap(cmp);
        int currentMax = INT_MIN;
        for (int i = 0; i < (int)nums.size(); i++) {
            heap.push({nums[i][0], i, 0});
            currentMax = max(currentMax, nums[i][0]);
        }
        vector<int> best = {heap.top()[0], currentMax};
        while (true) {
            auto top = heap.top(); heap.pop();
            int minVal = top[0], li = top[1], ei = top[2];
            if (currentMax - minVal < best[1] - best[0]) {
                best = {minVal, currentMax};
            }
            if (ei + 1 >= (int)nums[li].size()) break;
            int nextVal = nums[li][ei + 1];
            heap.push({nextVal, li, ei + 1});
            currentMax = max(currentMax, nextVal);
        }
        return best;
    }
};
$CPP$,
'O(n log k) where n = total elements', 'O(k)');

-- ============================================================
-- 8) trapping-rain-water-ii-500 (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('trapping-rain-water-ii-500', 'heap', 'Trapping Rain Water II', 'Hard',
$$<p>Given an <code>m x n</code> integer matrix <code>heightMap</code> representing the height of each unit cell in a 2D elevation map, return the volume of water it can trap after raining.</p>$$,
'', ARRAY[
  'Use a min-heap initialized with all boundary cells.',
  'Process cells from lowest boundary inward: water above a cell is max(0, current_water_level - cell_height).',
  'BFS inward, updating the water level as the max of current level and neighbor height.'
], '500', 'https://leetcode.com/problems/trapping-rain-water-ii/',
'trapRainWater',
'[{"name":"heightMap","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,4,3,1,3,2],[3,2,1,3,2,4],[2,3,3,2,3,1]]"],"expected":"4"},
  {"inputs":["[[3,3,3,3,3],[3,2,2,2,3],[3,2,1,2,3],[3,2,2,2,3],[3,3,3,3,3]]"],"expected":"10"},
  {"inputs":["[[1,1],[1,1]]"],"expected":"0"},
  {"inputs":["[[5,5,5,5],[5,1,1,5],[5,1,1,5],[5,5,5,5]]"],"expected":"16"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('trapping-rain-water-ii-500', 'python',
$PY$class Solution:
    def trapRainWater(self, heightMap: List[List[int]]) -> int:
        $PY$),
('trapping-rain-water-ii-500', 'javascript',
$JS$var trapRainWater = function(heightMap) {

};$JS$),
('trapping-rain-water-ii-500', 'java',
$JAVA$class Solution {
    public int trapRainWater(int[][] heightMap) {

    }
}$JAVA$),
('trapping-rain-water-ii-500', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trapRainWater(vector<vector<int>>& heightMap) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('trapping-rain-water-ii-500', 1, 'Min-Heap BFS from Boundary',
'Water flows outward, so the boundary determines the water level. Start from all boundary cells in a min-heap. Process the lowest cell first: any unvisited neighbor lower than the current water level traps water. Push neighbors with their effective height.',
$ALGO$["Add all boundary cells to min-heap. Mark visited.","While heap not empty: pop (height, r, c). For each 4-directional neighbor:","If not visited: water += max(0, height - neighbor_height). Push (max(height, neighbor_height), nr, nc).","Return total water."]$ALGO$::jsonb,
$PY$class Solution:
    def trapRainWater(self, heightMap: List[List[int]]) -> int:
        import heapq
        if not heightMap or len(heightMap) < 3 or len(heightMap[0]) < 3:
            return 0
        m, n = len(heightMap), len(heightMap[0])
        visited = [[False] * n for _ in range(m)]
        heap = []
        for i in range(m):
            for j in range(n):
                if i == 0 or i == m - 1 or j == 0 or j == n - 1:
                    heapq.heappush(heap, (heightMap[i][j], i, j))
                    visited[i][j] = True
        water = 0
        dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        while heap:
            h, r, c = heapq.heappop(heap)
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and not visited[nr][nc]:
                    visited[nr][nc] = True
                    water += max(0, h - heightMap[nr][nc])
                    heapq.heappush(heap, (max(h, heightMap[nr][nc]), nr, nc))
        return water
$PY$,
$JS$var trapRainWater = function(heightMap) {
    const m = heightMap.length, n = heightMap[0].length;
    if (m < 3 || n < 3) return 0;
    const visited = Array.from({length: m}, () => new Array(n).fill(false));
    // Simple priority queue using sorted array
    const heap = [];
    const push = (v) => { heap.push(v); heap.sort((a, b) => a[0] - b[0]); };
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (i === 0 || i === m-1 || j === 0 || j === n-1) {
                push([heightMap[i][j], i, j]);
                visited[i][j] = true;
            }
        }
    }
    let water = 0;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    while (heap.length) {
        const [h, r, c] = heap.shift();
        for (const [dr, dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                visited[nr][nc] = true;
                water += Math.max(0, h - heightMap[nr][nc]);
                push([Math.max(h, heightMap[nr][nc]), nr, nc]);
            }
        }
    }
    return water;
};
$JS$,
$JAVA$class Solution {
    public int trapRainWater(int[][] heightMap) {
        int m = heightMap.length, n = heightMap[0].length;
        if (m < 3 || n < 3) return 0;
        boolean[][] visited = new boolean[m][n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 || i == m-1 || j == 0 || j == n-1) {
                    heap.add(new int[]{heightMap[i][j], i, j});
                    visited[i][j] = true;
                }
            }
        }
        int water = 0;
        int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int h = top[0], r = top[1], c = top[2];
            for (int[] d : dirs) {
                int nr = r+d[0], nc = c+d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    water += Math.max(0, h - heightMap[nr][nc]);
                    heap.add(new int[]{Math.max(h, heightMap[nr][nc]), nr, nc});
                }
            }
        }
        return water;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int trapRainWater(vector<vector<int>>& heightMap) {
        int m = heightMap.size(), n = heightMap[0].size();
        if (m < 3 || n < 3) return 0;
        vector<vector<bool>> visited(m, vector<bool>(n, false));
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (i == 0 || i == m-1 || j == 0 || j == n-1) {
                    heap.push({heightMap[i][j], i, j});
                    visited[i][j] = true;
                }
            }
        }
        int water = 0;
        int dirs[][2] = {{0,1},{0,-1},{1,0},{-1,0}};
        while (!heap.empty()) {
            auto [h, r, c] = heap.top(); heap.pop();
            for (auto& d : dirs) {
                int nr = r+d[0], nc = c+d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    water += max(0, h - heightMap[nr][nc]);
                    heap.push({max(h, heightMap[nr][nc]), nr, nc});
                }
            }
        }
        return water;
    }
};
$CPP$,
'O(m*n log(m*n))', 'O(m*n)');

COMMIT;
