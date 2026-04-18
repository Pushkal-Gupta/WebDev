-- Grow catalog 400 → 500: intervals topic (+8 problems: 2E, 4M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'can-attend-meetings','teemo-attacking-500',
  'my-calendar-i','minimum-number-arrows','range-module','divide-intervals-min-groups',
  'employee-free-time','data-stream-as-disjoint-intervals'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'can-attend-meetings','teemo-attacking-500',
  'my-calendar-i','minimum-number-arrows','range-module','divide-intervals-min-groups',
  'employee-free-time','data-stream-as-disjoint-intervals'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'can-attend-meetings','teemo-attacking-500',
  'my-calendar-i','minimum-number-arrows','range-module','divide-intervals-min-groups',
  'employee-free-time','data-stream-as-disjoint-intervals'
);

-- ============================================================
-- 1) can-attend-meetings (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('can-attend-meetings', 'intervals', 'Meeting Rooms', 'Easy',
$$<p>Given an array of meeting time intervals <code>intervals</code> where <code>intervals[i] = [start_i, end_i]</code>, determine if a person could attend all meetings (i.e., no two meetings overlap).</p>$$,
'', ARRAY[
  'Sort intervals by start time.',
  'Check if any meeting starts before the previous one ends.',
  'If any overlap is found, return false.'
], '500', 'https://leetcode.com/problems/meeting-rooms/',
'canAttendMeetings',
'[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
'bool',
'[
  {"inputs":["[[0,30],[5,10],[15,20]]"],"expected":"false"},
  {"inputs":["[[7,10],[2,4]]"],"expected":"true"},
  {"inputs":["[[1,5],[5,10]]"],"expected":"true"},
  {"inputs":["[]"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('can-attend-meetings', 'python',
$PY$class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        $PY$),
('can-attend-meetings', 'javascript',
$JS$var canAttendMeetings = function(intervals) {

};$JS$),
('can-attend-meetings', 'java',
$JAVA$class Solution {
    public boolean canAttendMeetings(int[][] intervals) {

    }
}$JAVA$),
('can-attend-meetings', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('can-attend-meetings', 1, 'Sort and Check Overlap',
'After sorting by start time, meetings overlap if and only if some meeting starts before the previous one ends. A single pass after sorting detects this.',
'["Sort intervals by start time.","For i from 1 to len(intervals)-1: if intervals[i][0] < intervals[i-1][1], return false.","Return true."]'::jsonb,
$PY$class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        intervals.sort()
        for i in range(1, len(intervals)):
            if intervals[i][0] < intervals[i - 1][1]:
                return False
        return True
$PY$,
$JS$var canAttendMeetings = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < intervals[i - 1][1]) return false;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;
        }
        return true;
    }
};
$CPP$,
'O(n log n)', 'O(1)');

-- ============================================================
-- 2) teemo-attacking-500 (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('teemo-attacking-500', 'intervals', 'Teemo Attacking', 'Easy',
$$<p>Our hero Teemo attacks an enemy at time points given in a sorted array <code>timeSeries</code>. Each attack poisons the enemy for <code>duration</code> seconds. Overlapping poison durations do not stack. Return the total number of seconds the enemy is poisoned.</p>$$,
'', ARRAY[
  'For each attack, the poison lasts from timeSeries[i] to timeSeries[i] + duration.',
  'If the next attack starts before the current poison ends, the overlap is wasted.',
  'Add min(timeSeries[i+1] - timeSeries[i], duration) for each gap, plus duration for the last attack.'
], '500', 'https://leetcode.com/problems/teemo-attacking/',
'findPoisonedDuration',
'[{"name":"timeSeries","type":"List[int]"},{"name":"duration","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,4]","2"],"expected":"4"},
  {"inputs":["[1,2]","2"],"expected":"3"},
  {"inputs":["[1]","5"],"expected":"5"},
  {"inputs":["[1,2,3,4,5]","1"],"expected":"5"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('teemo-attacking-500', 'python',
$PY$class Solution:
    def findPoisonedDuration(self, timeSeries: List[int], duration: int) -> int:
        $PY$),
('teemo-attacking-500', 'javascript',
$JS$var findPoisonedDuration = function(timeSeries, duration) {

};$JS$),
('teemo-attacking-500', 'java',
$JAVA$class Solution {
    public int findPoisonedDuration(int[] timeSeries, int duration) {

    }
}$JAVA$),
('teemo-attacking-500', 'cpp',
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
('teemo-attacking-500', 1, 'Greedy Interval Merge',
'Each attack contributes min(gap to next attack, duration) poisoned seconds, since overlapping periods do not stack. The last attack always contributes the full duration.',
$ALGO$["total = 0.","For i from 0 to len(timeSeries)-2: total += min(timeSeries[i+1] - timeSeries[i], duration).","total += duration for the last attack.","Return total."]$ALGO$::jsonb,
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
    if (timeSeries.length === 0) return 0;
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
        for (int i = 0; i < (int)timeSeries.size() - 1; i++) {
            total += min(timeSeries[i + 1] - timeSeries[i], duration);
        }
        return total + duration;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) my-calendar-i (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('my-calendar-i', 'intervals', 'My Calendar I', 'Medium',
$$<p>Implement a <code>MyCalendar</code> class to store events. A new event can be added if it does not cause a double booking — i.e., two events with some non-empty intersection of time. Given a list of bookings as <code>[start, end]</code> pairs, return a list of booleans indicating whether each booking was successfully added.</p>$$,
'', ARRAY[
  'For each new event, check all existing events for overlap.',
  'Two intervals [s1,e1) and [s2,e2) overlap iff s1 < e2 and s2 < e1.',
  'If no overlap, add the event and return true.'
], '500', 'https://leetcode.com/problems/my-calendar-i/',
'myCalendar',
'[{"name":"bookings","type":"List[List[int]]"}]'::jsonb,
'List[bool]',
'[
  {"inputs":["[[10,20],[15,25],[20,30]]"],"expected":"[true,false,true]"},
  {"inputs":["[[1,2],[2,3],[3,4]]"],"expected":"[true,true,true]"},
  {"inputs":["[[1,5],[3,7],[6,10]]"],"expected":"[true,false,true]"},
  {"inputs":["[[5,10]]"],"expected":"[true]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('my-calendar-i', 'python',
$PY$class Solution:
    def myCalendar(self, bookings: List[List[int]]) -> List[bool]:
        $PY$),
('my-calendar-i', 'javascript',
$JS$var myCalendar = function(bookings) {

};$JS$),
('my-calendar-i', 'java',
$JAVA$class Solution {
    public List<Boolean> myCalendar(int[][] bookings) {

    }
}$JAVA$),
('my-calendar-i', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> myCalendar(vector<vector<int>>& bookings) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('my-calendar-i', 1, 'Brute Force Check',
'Maintain a list of booked intervals. For each new booking, check against all existing ones for overlap. If none overlap, add the booking.',
$ALGO$["Initialize calendar = [].","For each [start, end] in bookings: check if any [s, e] in calendar has s < end and start < e.","If overlap found, append false. Otherwise add [start, end] to calendar and append true.","Return results."]$ALGO$::jsonb,
$PY$class Solution:
    def myCalendar(self, bookings: List[List[int]]) -> List[bool]:
        calendar = []
        result = []
        for start, end in bookings:
            overlap = False
            for s, e in calendar:
                if s < end and start < e:
                    overlap = True
                    break
            if overlap:
                result.append(False)
            else:
                calendar.append([start, end])
                result.append(True)
        return result
$PY$,
$JS$var myCalendar = function(bookings) {
    const calendar = [];
    const result = [];
    for (const [start, end] of bookings) {
        let overlap = false;
        for (const [s, e] of calendar) {
            if (s < end && start < e) { overlap = true; break; }
        }
        if (overlap) {
            result.push(false);
        } else {
            calendar.push([start, end]);
            result.push(true);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Boolean> myCalendar(int[][] bookings) {
        List<int[]> calendar = new ArrayList<>();
        List<Boolean> result = new ArrayList<>();
        for (int[] b : bookings) {
            boolean overlap = false;
            for (int[] c : calendar) {
                if (c[0] < b[1] && b[0] < c[1]) { overlap = true; break; }
            }
            if (overlap) {
                result.add(false);
            } else {
                calendar.add(b);
                result.add(true);
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<bool> myCalendar(vector<vector<int>>& bookings) {
        vector<vector<int>> calendar;
        vector<bool> result;
        for (auto& b : bookings) {
            bool overlap = false;
            for (auto& c : calendar) {
                if (c[0] < b[1] && b[0] < c[1]) { overlap = true; break; }
            }
            if (overlap) {
                result.push_back(false);
            } else {
                calendar.push_back(b);
                result.push_back(true);
            }
        }
        return result;
    }
};
$CPP$,
'O(n^2)', 'O(n)');

-- ============================================================
-- 4) minimum-number-arrows (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-number-arrows', 'intervals', 'Minimum Number of Arrows to Burst Balloons', 'Medium',
$$<p>There are spherical balloons taped on a flat wall represented by a 2D array <code>points</code> where <code>points[i] = [x_start, x_end]</code>. An arrow shot vertically at position <code>x</code> bursts all balloons where <code>x_start <= x <= x_end</code>. Return the <strong>minimum</strong> number of arrows needed to burst all balloons.</p>$$,
'', ARRAY[
  'Sort balloons by end position.',
  'Greedily shoot at each balloon''s end point, which bursts as many overlapping balloons as possible.',
  'Skip balloons whose start is within the current arrow range.'
], '500', 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/',
'findMinArrowShots',
'[{"name":"points","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[10,16],[2,8],[1,6],[7,12]]"],"expected":"2"},
  {"inputs":["[[1,2],[3,4],[5,6],[7,8]]"],"expected":"4"},
  {"inputs":["[[1,2],[2,3],[3,4],[4,5]]"],"expected":"2"},
  {"inputs":["[[1,10]]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-number-arrows', 'python',
$PY$class Solution:
    def findMinArrowShots(self, points: List[List[int]]) -> int:
        $PY$),
('minimum-number-arrows', 'javascript',
$JS$var findMinArrowShots = function(points) {

};$JS$),
('minimum-number-arrows', 'java',
$JAVA$class Solution {
    public int findMinArrowShots(int[][] points) {

    }
}$JAVA$),
('minimum-number-arrows', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-number-arrows', 1, 'Greedy Sort by End',
'Sort by end position. Shoot at each balloon''s end, which maximizes the number of overlapping balloons burst. Skip any balloon whose start is within the current arrow''s reach.',
$ALGO$["Sort points by x_end.","arrows = 1, arrow_pos = points[0][1].","For each balloon from index 1: if balloon[0] > arrow_pos, increment arrows and set arrow_pos = balloon[1].","Return arrows."]$ALGO$::jsonb,
$PY$class Solution:
    def findMinArrowShots(self, points: List[List[int]]) -> int:
        if not points:
            return 0
        points.sort(key=lambda x: x[1])
        arrows = 1
        arrow_pos = points[0][1]
        for i in range(1, len(points)):
            if points[i][0] > arrow_pos:
                arrows += 1
                arrow_pos = points[i][1]
        return arrows
$PY$,
$JS$var findMinArrowShots = function(points) {
    if (points.length === 0) return 0;
    points.sort((a, b) => a[1] - b[1]);
    let arrows = 1, arrowPos = points[0][1];
    for (let i = 1; i < points.length; i++) {
        if (points[i][0] > arrowPos) {
            arrows++;
            arrowPos = points[i][1];
        }
    }
    return arrows;
};
$JS$,
$JAVA$class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowPos = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        if (points.empty()) return 0;
        sort(points.begin(), points.end(), [](auto& a, auto& b) { return a[1] < b[1]; });
        int arrows = 1;
        int arrowPos = points[0][1];
        for (int i = 1; i < (int)points.size(); i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }
};
$CPP$,
'O(n log n)', 'O(1)');

-- ============================================================
-- 5) range-module (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('range-module', 'intervals', 'Range Module (Simplified)', 'Medium',
$$<p>Given a list of operations on ranges: <code>["add", left, right]</code> adds the half-open range [left, right), <code>["query", left, right]</code> returns whether every number in [left, right) is tracked. Process all operations and return a list of booleans for each query operation.</p>$$,
'', ARRAY[
  'Maintain a sorted list of non-overlapping intervals.',
  'On add: merge overlapping intervals.',
  'On query: binary search to check if [left, right) is fully contained in a single interval.'
], '500', 'https://leetcode.com/problems/range-module/',
'rangeModule',
'[{"name":"ops","type":"List[List[str]]"}]'::jsonb,
'List[bool]',
'[
  {"inputs":["[[\"add\",\"10\",\"20\"],[\"query\",\"10\",\"14\"],[\"query\",\"13\",\"15\"],[\"add\",\"14\",\"25\"],[\"query\",\"10\",\"25\"]]"],"expected":"[true,true,true]"},
  {"inputs":["[[\"add\",\"1\",\"5\"],[\"query\",\"1\",\"6\"]]"],"expected":"[false]"},
  {"inputs":["[[\"query\",\"1\",\"2\"]]"],"expected":"[false]"},
  {"inputs":["[[\"add\",\"1\",\"10\"],[\"add\",\"20\",\"30\"],[\"query\",\"5\",\"25\"]]"],"expected":"[false]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('range-module', 'python',
$PY$class Solution:
    def rangeModule(self, ops: List[List[str]]) -> List[bool]:
        $PY$),
('range-module', 'javascript',
$JS$var rangeModule = function(ops) {

};$JS$),
('range-module', 'java',
$JAVA$class Solution {
    public List<Boolean> rangeModule(String[][] ops) {

    }
}$JAVA$),
('range-module', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> rangeModule(vector<vector<string>>& ops) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('range-module', 1, 'Sorted Interval List',
'Maintain a sorted list of non-overlapping intervals. To add a range, find all overlapping intervals, merge them, and replace. To query, binary search for an interval containing the query range.',
$ALGO$["Maintain sorted intervals list.","Add: find overlapping intervals, merge into one.","Query: find interval where left >= interval.start and right <= interval.end.","Return results for all query operations."]$ALGO$::jsonb,
$PY$class Solution:
    def rangeModule(self, ops: List[List[str]]) -> List[bool]:
        import bisect
        intervals = []
        result = []
        for op in ops:
            action = op[0]
            left, right = int(op[1]), int(op[2])
            if action == "add":
                new_intervals = []
                placed = False
                for s, e in intervals:
                    if e < left:
                        new_intervals.append([s, e])
                    elif s > right:
                        if not placed:
                            new_intervals.append([left, right])
                            placed = True
                        new_intervals.append([s, e])
                    else:
                        left = min(left, s)
                        right = max(right, e)
                if not placed:
                    new_intervals.append([left, right])
                intervals = new_intervals
            else:
                found = False
                for s, e in intervals:
                    if s <= left and right <= e:
                        found = True
                        break
                result.append(found)
        return result
$PY$,
$JS$var rangeModule = function(ops) {
    let intervals = [];
    const result = [];
    for (const op of ops) {
        const action = op[0];
        let left = Number(op[1]), right = Number(op[2]);
        if (action === "add") {
            const newIntervals = [];
            let placed = false;
            for (const [s, e] of intervals) {
                if (e < left) {
                    newIntervals.push([s, e]);
                } else if (s > right) {
                    if (!placed) { newIntervals.push([left, right]); placed = true; }
                    newIntervals.push([s, e]);
                } else {
                    left = Math.min(left, s);
                    right = Math.max(right, e);
                }
            }
            if (!placed) newIntervals.push([left, right]);
            intervals = newIntervals;
        } else {
            let found = false;
            for (const [s, e] of intervals) {
                if (s <= left && right <= e) { found = true; break; }
            }
            result.push(found);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Boolean> rangeModule(String[][] ops) {
        List<int[]> intervals = new ArrayList<>();
        List<Boolean> result = new ArrayList<>();
        for (String[] op : ops) {
            String action = op[0];
            int left = Integer.parseInt(op[1]), right = Integer.parseInt(op[2]);
            if (action.equals("add")) {
                List<int[]> newIntervals = new ArrayList<>();
                boolean placed = false;
                for (int[] iv : intervals) {
                    if (iv[1] < left) {
                        newIntervals.add(iv);
                    } else if (iv[0] > right) {
                        if (!placed) { newIntervals.add(new int[]{left, right}); placed = true; }
                        newIntervals.add(iv);
                    } else {
                        left = Math.min(left, iv[0]);
                        right = Math.max(right, iv[1]);
                    }
                }
                if (!placed) newIntervals.add(new int[]{left, right});
                intervals = newIntervals;
            } else {
                boolean found = false;
                for (int[] iv : intervals) {
                    if (iv[0] <= left && right <= iv[1]) { found = true; break; }
                }
                result.add(found);
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<bool> rangeModule(vector<vector<string>>& ops) {
        vector<pair<int,int>> intervals;
        vector<bool> result;
        for (auto& op : ops) {
            string action = op[0];
            int left = stoi(op[1]), right = stoi(op[2]);
            if (action == "add") {
                vector<pair<int,int>> newIntervals;
                bool placed = false;
                for (auto& [s, e] : intervals) {
                    if (e < left) {
                        newIntervals.push_back({s, e});
                    } else if (s > right) {
                        if (!placed) { newIntervals.push_back({left, right}); placed = true; }
                        newIntervals.push_back({s, e});
                    } else {
                        left = min(left, s);
                        right = max(right, e);
                    }
                }
                if (!placed) newIntervals.push_back({left, right});
                intervals = newIntervals;
            } else {
                bool found = false;
                for (auto& [s, e] : intervals) {
                    if (s <= left && right <= e) { found = true; break; }
                }
                result.push_back(found);
            }
        }
        return result;
    }
};
$CPP$,
'O(n^2) worst case for n operations', 'O(n)');

-- ============================================================
-- 6) divide-intervals-min-groups (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('divide-intervals-min-groups', 'intervals', 'Divide Intervals Into Minimum Number of Groups', 'Medium',
$$<p>You are given a 2D integer array <code>intervals</code> where <code>intervals[i] = [left_i, right_i]</code>. You have to divide the intervals into one or more groups such that each interval is in exactly one group, and no two intervals in the same group overlap. Return the <strong>minimum</strong> number of groups needed.</p>$$,
'', ARRAY[
  'The minimum number of groups equals the maximum number of overlapping intervals at any point.',
  'Use a sweep line: +1 at each start, -1 at each end+1.',
  'The answer is the maximum prefix sum.'
], '500', 'https://leetcode.com/problems/divide-intervals-into-minimum-number-of-groups/',
'minGroups',
'[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[5,10],[6,8],[1,5],[2,3],[1,10]]"],"expected":"3"},
  {"inputs":["[[1,3],[5,6],[8,10],[11,13]]"],"expected":"1"},
  {"inputs":["[[1,2],[2,3]]"],"expected":"2"},
  {"inputs":["[[1,10],[2,9],[3,8],[4,7]]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('divide-intervals-min-groups', 'python',
$PY$class Solution:
    def minGroups(self, intervals: List[List[int]]) -> int:
        $PY$),
('divide-intervals-min-groups', 'javascript',
$JS$var minGroups = function(intervals) {

};$JS$),
('divide-intervals-min-groups', 'java',
$JAVA$class Solution {
    public int minGroups(int[][] intervals) {

    }
}$JAVA$),
('divide-intervals-min-groups', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minGroups(vector<vector<int>>& intervals) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('divide-intervals-min-groups', 1, 'Sweep Line',
'The minimum groups needed equals the maximum overlap at any point. Create events: +1 at each start, -1 at each end+1. Sort events and find the maximum running sum.',
$ALGO$["Create events: for each [l, r], add (l, +1) and (r+1, -1).","Sort events by position (tie-break: -1 before +1).","Walk through events maintaining a running sum. Track the maximum.","Return the maximum."]$ALGO$::jsonb,
$PY$class Solution:
    def minGroups(self, intervals: List[List[int]]) -> int:
        events = []
        for l, r in intervals:
            events.append((l, 1))
            events.append((r + 1, -1))
        events.sort()
        max_groups = 0
        current = 0
        for _, delta in events:
            current += delta
            max_groups = max(max_groups, current)
        return max_groups
$PY$,
$JS$var minGroups = function(intervals) {
    const events = [];
    for (const [l, r] of intervals) {
        events.push([l, 1]);
        events.push([r + 1, -1]);
    }
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let maxGroups = 0, current = 0;
    for (const [, delta] of events) {
        current += delta;
        maxGroups = Math.max(maxGroups, current);
    }
    return maxGroups;
};
$JS$,
$JAVA$class Solution {
    public int minGroups(int[][] intervals) {
        List<int[]> events = new ArrayList<>();
        for (int[] iv : intervals) {
            events.add(new int[]{iv[0], 1});
            events.add(new int[]{iv[1] + 1, -1});
        }
        events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int maxGroups = 0, current = 0;
        for (int[] e : events) {
            current += e[1];
            maxGroups = Math.max(maxGroups, current);
        }
        return maxGroups;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minGroups(vector<vector<int>>& intervals) {
        vector<pair<int,int>> events;
        for (auto& iv : intervals) {
            events.push_back({iv[0], 1});
            events.push_back({iv[1] + 1, -1});
        }
        sort(events.begin(), events.end());
        int maxGroups = 0, current = 0;
        for (auto& [pos, delta] : events) {
            current += delta;
            maxGroups = max(maxGroups, current);
        }
        return maxGroups;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 7) employee-free-time (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('employee-free-time', 'intervals', 'Employee Free Time', 'Hard',
$$<p>We are given a list of schedule of employees. Each employee has a list of non-overlapping sorted intervals. Return the list of finite intervals representing the <strong>common, positive-length free time</strong> for all employees, also in sorted order.</p><p>Input is a flat list of all intervals from all employees combined. Return the gaps.</p>$$,
'', ARRAY[
  'Merge all intervals from all employees into one sorted list.',
  'Find gaps between merged intervals.',
  'A gap exists when the start of the next interval is greater than the end of the current merged interval.'
], '500', 'https://leetcode.com/problems/employee-free-time/',
'employeeFreeTime',
'[{"name":"intervals","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[1,2],[5,6],[1,3],[4,10]]"],"expected":"[[3,4]]"},
  {"inputs":["[[1,3],[6,7],[2,4],[2,5],[9,12]]"],"expected":"[[5,6],[7,9]]"},
  {"inputs":["[[1,2],[3,4]]"],"expected":"[[2,3]]"},
  {"inputs":["[[1,10],[2,5]]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('employee-free-time', 'python',
$PY$class Solution:
    def employeeFreeTime(self, intervals: List[List[int]]) -> List[List[int]]:
        $PY$),
('employee-free-time', 'javascript',
$JS$var employeeFreeTime = function(intervals) {

};$JS$),
('employee-free-time', 'java',
$JAVA$class Solution {
    public int[][] employeeFreeTime(int[][] intervals) {

    }
}$JAVA$),
('employee-free-time', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> employeeFreeTime(vector<vector<int>>& intervals) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('employee-free-time', 1, 'Sort and Find Gaps',
'Sort all intervals by start time. Merge overlapping ones, then the gaps between consecutive merged intervals are the free time periods.',
$ALGO$["Sort all intervals by start time.","Merge overlapping intervals: track current end.","For each interval: if start > current_end, add [current_end, start] as free time.","Update current_end = max(current_end, end)."]$ALGO$::jsonb,
$PY$class Solution:
    def employeeFreeTime(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort()
        result = []
        end = intervals[0][1]
        for i in range(1, len(intervals)):
            if intervals[i][0] > end:
                result.append([end, intervals[i][0]])
            end = max(end, intervals[i][1])
        return result
$PY$,
$JS$var employeeFreeTime = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const result = [];
    let end = intervals[0][1];
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] > end) {
            result.push([end, intervals[i][0]]);
        }
        end = Math.max(end, intervals[i][1]);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[][] employeeFreeTime(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        List<int[]> result = new ArrayList<>();
        int end = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] > end) {
                result.add(new int[]{end, intervals[i][0]});
            }
            end = Math.max(end, intervals[i][1]);
        }
        return result.toArray(new int[0][]);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> employeeFreeTime(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> result;
        int end = intervals[0][1];
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] > end) {
                result.push_back({end, intervals[i][0]});
            }
            end = max(end, intervals[i][1]);
        }
        return result;
    }
};
$CPP$,
'O(n log n)', 'O(n)');

-- ============================================================
-- 8) data-stream-as-disjoint-intervals (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('data-stream-as-disjoint-intervals', 'intervals', 'Data Stream as Disjoint Intervals', 'Hard',
$$<p>Given a data stream of integers, and a list of operations. For <code>"add"</code> operations add the value. For <code>"get"</code> operations return the current set of disjoint intervals covering all added values, sorted by start. Input is a list of [operation, value] pairs (value is 0 for get). Return a list of interval arrays for each get call.</p>$$,
'', ARRAY[
  'Maintain a sorted set/list of disjoint intervals.',
  'When adding a number, check if it extends or merges existing intervals.',
  'Binary search makes insertion efficient.'
], '500', 'https://leetcode.com/problems/data-stream-as-disjoint-intervals/',
'dataStreamIntervals',
'[{"name":"ops","type":"List[List[str]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[\"add\",\"1\"],[\"get\",\"0\"],[\"add\",\"3\"],[\"get\",\"0\"],[\"add\",\"2\"],[\"get\",\"0\"]]"],"expected":"[[1,1],[1,1],[3,3],[1,3]]"},
  {"inputs":["[[\"add\",\"5\"],[\"add\",\"6\"],[\"get\",\"0\"]]"],"expected":"[[5,6]]"},
  {"inputs":["[[\"add\",\"1\"],[\"add\",\"1\"],[\"get\",\"0\"]]"],"expected":"[[1,1]]"},
  {"inputs":["[[\"add\",\"10\"],[\"add\",\"5\"],[\"add\",\"7\"],[\"get\",\"0\"]]"],"expected":"[[5,5],[7,7],[10,10]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('data-stream-as-disjoint-intervals', 'python',
$PY$class Solution:
    def dataStreamIntervals(self, ops: List[List[str]]) -> List[List[int]]:
        $PY$),
('data-stream-as-disjoint-intervals', 'javascript',
$JS$var dataStreamIntervals = function(ops) {

};$JS$),
('data-stream-as-disjoint-intervals', 'java',
$JAVA$class Solution {
    public List<List<Integer>> dataStreamIntervals(String[][] ops) {

    }
}$JAVA$),
('data-stream-as-disjoint-intervals', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> dataStreamIntervals(vector<vector<string>>& ops) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('data-stream-as-disjoint-intervals', 1, 'Sorted Set + Merge',
'Maintain a sorted set of values. On each get call, iterate through the sorted set and merge consecutive numbers into intervals.',
$ALGO$["Maintain a sorted set of added values.","On add: insert value into the set.","On get: iterate through sorted values, build intervals by merging consecutive numbers.","Return flat list of interval endpoints for all get calls."]$ALGO$::jsonb,
$PY$class Solution:
    def dataStreamIntervals(self, ops: List[List[str]]) -> List[List[int]]:
        from sortedcontainers import SortedList
        values = SortedList()
        result = []
        for op, val_str in ops:
            if op == "add":
                val = int(val_str)
                if val not in values:
                    values.add(val)
            else:
                if not values:
                    continue
                intervals = []
                start = end = values[0]
                for i in range(1, len(values)):
                    if values[i] == end + 1:
                        end = values[i]
                    else:
                        intervals.append(start)
                        intervals.append(end)
                        start = end = values[i]
                intervals.append(start)
                intervals.append(end)
                result.extend(intervals)
        return [[result[i], result[i+1]] for i in range(0, len(result), 2)]
$PY$,
$JS$var dataStreamIntervals = function(ops) {
    const valuesSet = new Set();
    const result = [];
    for (const [op, valStr] of ops) {
        if (op === "add") {
            valuesSet.add(Number(valStr));
        } else {
            const sorted = [...valuesSet].sort((a, b) => a - b);
            if (sorted.length === 0) continue;
            let start = sorted[0], end = sorted[0];
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === end + 1) {
                    end = sorted[i];
                } else {
                    result.push([start, end]);
                    start = end = sorted[i];
                }
            }
            result.push([start, end]);
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> dataStreamIntervals(String[][] ops) {
        TreeSet<Integer> values = new TreeSet<>();
        List<List<Integer>> result = new ArrayList<>();
        for (String[] op : ops) {
            if (op[0].equals("add")) {
                values.add(Integer.parseInt(op[1]));
            } else {
                if (values.isEmpty()) continue;
                int start = -1, end = -1;
                for (int v : values) {
                    if (start == -1) {
                        start = end = v;
                    } else if (v == end + 1) {
                        end = v;
                    } else {
                        result.add(Arrays.asList(start, end));
                        start = end = v;
                    }
                }
                result.add(Arrays.asList(start, end));
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> dataStreamIntervals(vector<vector<string>>& ops) {
        set<int> values;
        vector<vector<int>> result;
        for (auto& op : ops) {
            if (op[0] == "add") {
                values.insert(stoi(op[1]));
            } else {
                if (values.empty()) continue;
                auto it = values.begin();
                int start = *it, end = *it;
                ++it;
                for (; it != values.end(); ++it) {
                    if (*it == end + 1) {
                        end = *it;
                    } else {
                        result.push_back({start, end});
                        start = end = *it;
                    }
                }
                result.push_back({start, end});
            }
        }
        return result;
    }
};
$CPP$,
'O(n log n) per get call', 'O(n)');

COMMIT;
