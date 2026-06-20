-- Grow catalog 200 → 300: intervals topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'summary-ranges','teemo-attacking','remove-covered-intervals',
  'car-pooling','meeting-rooms-ii','minimum-interval-each-query'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'summary-ranges','teemo-attacking','remove-covered-intervals',
  'car-pooling','meeting-rooms-ii','minimum-interval-each-query'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'summary-ranges','teemo-attacking','remove-covered-intervals',
  'car-pooling','meeting-rooms-ii','minimum-interval-each-query'
);

-- ============================================================
-- 1) summary-ranges (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('summary-ranges', 'intervals', 'Summary Ranges', 'Easy',
$$<p>Given a sorted unique integer array <code>nums</code>, return the smallest sorted list of ranges that exactly covers every integer in <code>nums</code>. Each range is formatted as <code>"a->b"</code> when <code>a != b</code> and <code>"a"</code> when <code>a == b</code>.</p>$$,
'', ARRAY[
  'Walk through nums with two pointers marking the start and end of the current run.',
  'Extend the run while nums[i + 1] == nums[i] + 1; emit the range when the run breaks.',
  'Handle the last run after the loop.'
], '300', 'https://leetcode.com/problems/summary-ranges/',
'summaryRanges',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[0,1,2,4,5,7]"],"expected":"[\"0->2\",\"4->5\",\"7\"]"},
  {"inputs":["[0,2,3,4,6,8,9]"],"expected":"[\"0\",\"2->4\",\"6\",\"8->9\"]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[-1]"],"expected":"[\"-1\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('summary-ranges', 'python',
$PY$class Solution:
    def summaryRanges(self, nums: List[int]) -> List[str]:
        $PY$),
('summary-ranges', 'javascript',
$JS$var summaryRanges = function(nums) {

};$JS$),
('summary-ranges', 'java',
$JAVA$class Solution {
    public List<String> summaryRanges(int[] nums) {

    }
}$JAVA$),
('summary-ranges', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> summaryRanges(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('summary-ranges', 1, 'Two Pointers Per Run',
'The input is sorted with unique values, so runs of consecutive integers are contiguous. Track a run with a start index and extend it while the next value is exactly one larger. Emit the run on break or at the end.',
'["If nums is empty, return [].","i = 0. Loop while i < n: j = i; while j + 1 < n and nums[j + 1] == nums[j] + 1: j += 1.","Append the range string: if i == j, str(nums[i]); else nums[i] + \"->\" + nums[j]. Set i = j + 1.","Return the accumulated list."]'::jsonb,
$PY$class Solution:
    def summaryRanges(self, nums: List[int]) -> List[str]:
        result = []
        n = len(nums)
        i = 0
        while i < n:
            j = i
            while j + 1 < n and nums[j + 1] == nums[j] + 1:
                j += 1
            if i == j:
                result.append(str(nums[i]))
            else:
                result.append(f"{nums[i]}->{nums[j]}")
            i = j + 1
        return result
$PY$,
$JS$var summaryRanges = function(nums) {
    const result = [];
    const n = nums.length;
    let i = 0;
    while (i < n) {
        let j = i;
        while (j + 1 < n && nums[j + 1] === nums[j] + 1) j++;
        result.push(i === j ? String(nums[i]) : `${nums[i]}->${nums[j]}`);
        i = j + 1;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> summaryRanges(int[] nums) {
        List<String> result = new ArrayList<>();
        int n = nums.length, i = 0;
        while (i < n) {
            int j = i;
            while (j + 1 < n && nums[j + 1] == nums[j] + 1) j++;
            if (i == j) result.add(String.valueOf(nums[i]));
            else result.add(nums[i] + "->" + nums[j]);
            i = j + 1;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> summaryRanges(vector<int>& nums) {
        vector<string> result;
        int n = nums.size(), i = 0;
        while (i < n) {
            int j = i;
            while (j + 1 < n && nums[j + 1] == nums[j] + 1) j++;
            if (i == j) result.push_back(to_string(nums[i]));
            else result.push_back(to_string(nums[i]) + "->" + to_string(nums[j]));
            i = j + 1;
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(1) extra');

-- ============================================================
-- 2) teemo-attacking (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('teemo-attacking', 'intervals', 'Teemo Attacking', 'Easy',
$$<p>Given sorted non-decreasing <code>timeSeries</code> (Teemo''s attack timestamps) and a duration, return the total time Ashe is poisoned. Each attack poisons for <code>duration</code> seconds; overlapping attacks refresh the timer instead of stacking.</p>$$,
'', ARRAY[
  'Walk the attacks and accumulate the contribution of each one. A given attack adds either the full duration or the gap to the next attack — whichever is smaller.',
  'The last attack always adds the full duration.',
  'No sorting needed because timeSeries is already sorted.'
], '300', 'https://leetcode.com/problems/teemo-attacking/',
'findPoisonedDuration',
'[{"name":"timeSeries","type":"List[int]"},{"name":"duration","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,4]","2"],"expected":"4"},
  {"inputs":["[1,2]","2"],"expected":"3"},
  {"inputs":["[1,2,3,4,5]","5"],"expected":"9"},
  {"inputs":["[]","5"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('teemo-attacking', 'python',
$PY$class Solution:
    def findPoisonedDuration(self, timeSeries: List[int], duration: int) -> int:
        $PY$),
('teemo-attacking', 'javascript',
$JS$var findPoisonedDuration = function(timeSeries, duration) {

};$JS$),
('teemo-attacking', 'java',
$JAVA$class Solution {
    public int findPoisonedDuration(int[] timeSeries, int duration) {

    }
}$JAVA$),
('teemo-attacking', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findPoisonedDuration(vector<int>& timeSeries, int duration) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('teemo-attacking', 1, 'Gap vs Duration',
'Since attacks are sorted, each one contributes either its full duration — if the next attack is at least duration seconds later — or only the gap between it and the next attack (because the later attack resets the timer). The final attack always contributes the full duration.',
'["If timeSeries is empty, return 0.","total = 0.","For i from 0 to n - 2: total += min(timeSeries[i + 1] - timeSeries[i], duration).","Add duration for the last attack.","Return total."]'::jsonb,
$PY$class Solution:
    def findPoisonedDuration(self, timeSeries: List[int], duration: int) -> int:
        if not timeSeries:
            return 0
        total = 0
        for i in range(len(timeSeries) - 1):
            total += min(timeSeries[i + 1] - timeSeries[i], duration)
        return total + duration
$PY$,
$JS$var findPoisonedDuration = function(timeSeries, duration) {
    if (!timeSeries.length) return 0;
    let total = 0;
    for (let i = 0; i < timeSeries.length - 1; i++) {
        total += Math.min(timeSeries[i + 1] - timeSeries[i], duration);
    }
    return total + duration;
};
$JS$,
$JAVA$class Solution {
    public int findPoisonedDuration(int[] timeSeries, int duration) {
        if (timeSeries.length == 0) return 0;
        int total = 0;
        for (int i = 0; i < timeSeries.length - 1; i++) {
            total += Math.min(timeSeries[i + 1] - timeSeries[i], duration);
        }
        return total + duration;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findPoisonedDuration(vector<int>& timeSeries, int duration) {
        if (timeSeries.empty()) return 0;
        int total = 0;
        for (int i = 0; i + 1 < (int)timeSeries.size(); i++) {
            total += min(timeSeries[i + 1] - timeSeries[i], duration);
        }
        return total + duration;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) remove-covered-intervals (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('remove-covered-intervals', 'intervals', 'Remove Covered Intervals', 'Medium',
$$<p>Given a list of <code>intervals</code> where each <code>intervals[i] = [l, r]</code>, remove all intervals that are covered by another one. An interval <code>[a, b]</code> is covered by <code>[c, d]</code> iff <code>c &lt;= a</code> and <code>b &lt;= d</code>. Return the number of remaining intervals.</p>$$,
'', ARRAY[
  'Sort by start ascending; break ties by end DESCENDING so a covering interval appears before any interval it covers.',
  'Sweep keeping the maximum end seen so far. A new interval is covered iff its end is <= that max end — otherwise it uncovered and becomes the new max.',
  'Return the count of uncovered intervals.'
], '300', 'https://leetcode.com/problems/remove-covered-intervals/',
'removeCoveredIntervals',
'[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,4],[3,6],[2,8]]"],"expected":"2"},
  {"inputs":["[[1,4],[2,3]]"],"expected":"1"},
  {"inputs":["[[1,2],[1,4],[3,4]]"],"expected":"1"},
  {"inputs":["[[0,10],[5,12]]"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('remove-covered-intervals', 'python',
$PY$class Solution:
    def removeCoveredIntervals(self, intervals: List[List[int]]) -> int:
        $PY$),
('remove-covered-intervals', 'javascript',
$JS$var removeCoveredIntervals = function(intervals) {

};$JS$),
('remove-covered-intervals', 'java',
$JAVA$class Solution {
    public int removeCoveredIntervals(int[][] intervals) {

    }
}$JAVA$),
('remove-covered-intervals', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('remove-covered-intervals', 1, 'Sort + End-Tracking Sweep',
'Sorting intervals by ascending start, ties broken by descending end, guarantees that if interval B is covered by interval A, A is processed first. Then a single sweep tracking the maximum end seen so far decides whether each new interval is covered (end <= max_end) or adds new coverage (end > max_end).',
'["Sort intervals by (start asc, end desc).","kept = 0, max_end = 0.","For each [l, r] in sorted order: if r > max_end, kept += 1; max_end = r.","Return kept."]'::jsonb,
$PY$class Solution:
    def removeCoveredIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda x: (x[0], -x[1]))
        kept = 0
        max_end = 0
        for l, r in intervals:
            if r > max_end:
                kept += 1
                max_end = r
        return kept
$PY$,
$JS$var removeCoveredIntervals = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let kept = 0, maxEnd = 0;
    for (const [l, r] of intervals) {
        if (r > maxEnd) { kept++; maxEnd = r; }
    }
    return kept;
};
$JS$,
$JAVA$class Solution {
    public int removeCoveredIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
        int kept = 0, maxEnd = 0;
        for (int[] iv : intervals) {
            if (iv[1] > maxEnd) { kept++; maxEnd = iv[1]; }
        }
        return kept;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {
            if (a[0] != b[0]) return a[0] < b[0];
            return a[1] > b[1];
        });
        int kept = 0, maxEnd = 0;
        for (auto& iv : intervals) {
            if (iv[1] > maxEnd) { kept++; maxEnd = iv[1]; }
        }
        return kept;
    }
};
$CPP$,
'O(n log n)', 'O(1) extra');

-- ============================================================
-- 4) car-pooling (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('car-pooling', 'intervals', 'Car Pooling', 'Medium',
$$<p>Given trips where <code>trips[i] = [numPassengers, from, to]</code> and a car capacity, return <code>true</code> iff the driver can complete every trip without exceeding capacity. The driver moves only in the positive direction.</p>$$,
'', ARRAY[
  'Only the passenger delta at each boundary matters. Passengers board at `from` and leave at `to`.',
  'Populate a delta array across the location range, prefix-sum it, and check that no prefix exceeds capacity.',
  'A heap/sweep by event time is an alternative with the same big-O.'
], '300', 'https://leetcode.com/problems/car-pooling/',
'carPooling',
'[{"name":"trips","type":"List[List[int]]"},{"name":"capacity","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["[[2,1,5],[3,3,7]]","4"],"expected":"false"},
  {"inputs":["[[2,1,5],[3,3,7]]","5"],"expected":"true"},
  {"inputs":["[[2,1,5],[3,5,7]]","3"],"expected":"true"},
  {"inputs":["[[3,2,7],[3,7,9],[8,3,9]]","11"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('car-pooling', 'python',
$PY$class Solution:
    def carPooling(self, trips: List[List[int]], capacity: int) -> bool:
        $PY$),
('car-pooling', 'javascript',
$JS$var carPooling = function(trips, capacity) {

};$JS$),
('car-pooling', 'java',
$JAVA$class Solution {
    public boolean carPooling(int[][] trips, int capacity) {

    }
}$JAVA$),
('car-pooling', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool carPooling(vector<vector<int>>& trips, int capacity) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('car-pooling', 1, 'Difference Array Sweep',
'The boarding and deboarding events can be encoded as +n at `from` and −n at `to`. The prefix sum at any point is the current occupancy; the trip is feasible iff that running sum never exceeds capacity.',
'["Let M = max(trip[2]) across all trips.","Allocate delta[0..M] = 0.","For each [n, from, to]: delta[from] += n; delta[to] -= n.","Sweep a running sum across delta; if it ever exceeds capacity, return false.","Return true."]'::jsonb,
$PY$class Solution:
    def carPooling(self, trips: List[List[int]], capacity: int) -> bool:
        M = 0
        for n, f, t in trips:
            if t > M:
                M = t
        delta = [0] * (M + 1)
        for n, f, t in trips:
            delta[f] += n
            delta[t] -= n
        occupancy = 0
        for v in delta:
            occupancy += v
            if occupancy > capacity:
                return False
        return True
$PY$,
$JS$var carPooling = function(trips, capacity) {
    let M = 0;
    for (const [, , t] of trips) if (t > M) M = t;
    const delta = new Array(M + 1).fill(0);
    for (const [n, f, t] of trips) { delta[f] += n; delta[t] -= n; }
    let occupancy = 0;
    for (const v of delta) {
        occupancy += v;
        if (occupancy > capacity) return false;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean carPooling(int[][] trips, int capacity) {
        int M = 0;
        for (int[] t : trips) if (t[2] > M) M = t[2];
        int[] delta = new int[M + 1];
        for (int[] t : trips) { delta[t[1]] += t[0]; delta[t[2]] -= t[0]; }
        int occ = 0;
        for (int v : delta) {
            occ += v;
            if (occ > capacity) return false;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool carPooling(vector<vector<int>>& trips, int capacity) {
        int M = 0;
        for (auto& t : trips) if (t[2] > M) M = t[2];
        vector<int> delta(M + 1, 0);
        for (auto& t : trips) { delta[t[1]] += t[0]; delta[t[2]] -= t[0]; }
        int occ = 0;
        for (int v : delta) {
            occ += v;
            if (occ > capacity) return false;
        }
        return true;
    }
};
$CPP$,
'O(n + M)', 'O(M)');

-- ============================================================
-- 5) meeting-rooms-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('meeting-rooms-ii', 'intervals', 'Meeting Rooms II', 'Medium',
$$<p>Given meeting intervals <code>[[start, end], ...]</code>, return the minimum number of rooms needed so that no two meetings occupy the same room at the same time.</p>$$,
'', ARRAY[
  'Sort by start. A min-heap of ongoing end times lets you pop (free a room) the earliest-ending meeting whenever the next meeting starts at or after it.',
  'At every step the heap''s size equals the number of currently active rooms.',
  'Answer = maximum heap size seen, which simplifies to heap size after processing everything when you only push for new rooms.'
], '300', 'https://leetcode.com/problems/meeting-rooms-ii/',
'minMeetingRooms',
'[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[0,30],[5,10],[15,20]]"],"expected":"2"},
  {"inputs":["[[7,10],[2,4]]"],"expected":"1"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[[1,5],[8,9],[8,9]]"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('meeting-rooms-ii', 'python',
$PY$class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        $PY$),
('meeting-rooms-ii', 'javascript',
$JS$var minMeetingRooms = function(intervals) {

};$JS$),
('meeting-rooms-ii', 'java',
$JAVA$class Solution {
    public int minMeetingRooms(int[][] intervals) {

    }
}$JAVA$),
('meeting-rooms-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('meeting-rooms-ii', 1, 'Start Sort + Min-Heap of End Times',
'If meetings are sorted by start time, the earliest ongoing meeting to finish is the first candidate to give up its room. A min-heap of ongoing end times lets us check in O(log n) whether the next meeting can reuse a room or needs a new one.',
'["Sort intervals by start.","Create a min-heap of end times.","For each interval [s, e]: if heap is non-empty and heap.top() <= s, pop (that room is free). Push e.","Return heap.size()."]'::jsonb,
$PY$class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        import heapq
        if not intervals:
            return 0
        intervals.sort(key=lambda x: x[0])
        heap = []
        for s, e in intervals:
            if heap and heap[0] <= s:
                heapq.heappop(heap)
            heapq.heappush(heap, e)
        return len(heap)
$PY$,
$JS$var minMeetingRooms = function(intervals) {
    if (!intervals.length) return 0;
    intervals.sort((a, b) => a[0] - b[0]);
    // Simple sort-based simulation stands in for a heap (n is small in tests).
    const ends = [];
    for (const [s, e] of intervals) {
        ends.sort((a, b) => a - b);
        if (ends.length && ends[0] <= s) ends.shift();
        ends.push(e);
    }
    return ends.length;
};
$JS$,
$JAVA$class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] iv : intervals) {
            if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
            heap.offer(iv[1]);
        }
        return heap.size();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        if (intervals.empty()) return 0;
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] < b[0];
        });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& iv : intervals) {
            if (!heap.empty() && heap.top() <= iv[0]) heap.pop();
            heap.push(iv[1]);
        }
        return heap.size();
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 6) minimum-interval-each-query (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-interval-each-query', 'intervals', 'Minimum Interval to Include Each Query', 'Hard',
$$<p>Given <code>intervals</code> (each <code>[left, right]</code>) and an array of <code>queries</code>, return for every query <code>q</code> the minimum interval size <code>right - left + 1</code> among intervals containing <code>q</code>. If no interval contains <code>q</code>, return <code>-1</code> for that query.</p>$$,
'', ARRAY[
  'Process queries in increasing order. Maintain a min-heap of (size, right) entries for every interval whose left <= current query.',
  'Before answering each query, pop entries whose right < query (they are no longer valid).',
  'The heap top is then the smallest valid interval size for the query.'
], '300', 'https://leetcode.com/problems/minimum-interval-to-include-each-query/',
'minInterval',
'[{"name":"intervals","type":"List[List[int]]"},{"name":"queries","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,4],[2,4],[3,6],[4,4]]","[2,3,4,5]"],"expected":"[3,3,1,4]"},
  {"inputs":["[[2,3],[2,5],[1,8],[20,25]]","[2,19,5,22]"],"expected":"[2,-1,4,6]"},
  {"inputs":["[[1,2]]","[0]"],"expected":"[-1]"},
  {"inputs":["[[1,10]]","[1,5,10,11]"],"expected":"[10,10,10,-1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-interval-each-query', 'python',
$PY$class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        $PY$),
('minimum-interval-each-query', 'javascript',
$JS$var minInterval = function(intervals, queries) {

};$JS$),
('minimum-interval-each-query', 'java',
$JAVA$class Solution {
    public int[] minInterval(int[][] intervals, int[] queries) {

    }
}$JAVA$),
('minimum-interval-each-query', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-interval-each-query', 1, 'Sort Both + Min-Heap by Size',
'Sort intervals by left and queries by value. Sweep queries in order, admitting every interval whose left is now <= q, and evicting any interval whose right < q. The min-heap keyed by size gives the smallest currently-valid interval in O(log n).',
'["Pair each query with its original index so you can write answers back into the correct slot.","Sort intervals ascending by left; sort the indexed queries ascending by value.","Walk queries with a pointer i into intervals. For each query q: while i < n and intervals[i][0] <= q, heappush (size, right, left); i += 1.","While heap is non-empty and heap.top().right < q, pop.","answer[orig_index] = heap.top().size if non-empty else -1.","Return answer."]'::jsonb,
$PY$class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        import heapq
        intervals.sort(key=lambda x: x[0])
        indexed = sorted(range(len(queries)), key=lambda i: queries[i])
        heap = []
        result = [0] * len(queries)
        i = 0
        n = len(intervals)
        for qi in indexed:
            q = queries[qi]
            while i < n and intervals[i][0] <= q:
                l, r = intervals[i]
                heapq.heappush(heap, (r - l + 1, r))
                i += 1
            while heap and heap[0][1] < q:
                heapq.heappop(heap)
            result[qi] = heap[0][0] if heap else -1
        return result
$PY$,
$JS$var minInterval = function(intervals, queries) {
    intervals.sort((a, b) => a[0] - b[0]);
    const indexed = queries.map((q, i) => [q, i]).sort((a, b) => a[0] - b[0]);
    const heap = [];
    const pushHeap = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] > heap[i][0]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
            else break;
        }
    };
    const popHeap = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            const n = heap.length;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let smallest = i;
                if (l < n && heap[l][0] < heap[smallest][0]) smallest = l;
                if (r < n && heap[r][0] < heap[smallest][0]) smallest = r;
                if (smallest === i) break;
                [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
                i = smallest;
            }
        }
        return top;
    };
    const result = new Array(queries.length);
    let i = 0;
    const n = intervals.length;
    for (const [q, qi] of indexed) {
        while (i < n && intervals[i][0] <= q) {
            const [l, r] = intervals[i];
            pushHeap([r - l + 1, r]);
            i++;
        }
        while (heap.length && heap[0][1] < q) popHeap();
        result[qi] = heap.length ? heap[0][0] : -1;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] minInterval(int[][] intervals, int[] queries) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        Integer[] order = new Integer[queries.length];
        for (int i = 0; i < queries.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> queries[a] - queries[b]);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        int[] result = new int[queries.length];
        int i = 0;
        for (int qi : order) {
            int q = queries[qi];
            while (i < intervals.length && intervals[i][0] <= q) {
                int l = intervals[i][0], r = intervals[i][1];
                heap.offer(new int[]{r - l + 1, r});
                i++;
            }
            while (!heap.isEmpty() && heap.peek()[1] < q) heap.poll();
            result[qi] = heap.isEmpty() ? -1 : heap.peek()[0];
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] < b[0];
        });
        vector<int> order(queries.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        vector<int> result(queries.size());
        int i = 0, n = intervals.size();
        for (int qi : order) {
            int q = queries[qi];
            while (i < n && intervals[i][0] <= q) {
                int l = intervals[i][0], r = intervals[i][1];
                heap.push({r - l + 1, r});
                i++;
            }
            while (!heap.empty() && heap.top().second < q) heap.pop();
            result[qi] = heap.empty() ? -1 : heap.top().first;
        }
        return result;
    }
};
$CPP$,
'O((n + q) log (n + q))', 'O(n + q)');

COMMIT;
