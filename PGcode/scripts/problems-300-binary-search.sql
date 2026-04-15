-- Grow catalog 200 → 300: binary-search topic (+4 problems). Final batch.
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'search-insert-position','find-peak-element','capacity-to-ship-packages','split-array-largest-sum'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'search-insert-position','find-peak-element','capacity-to-ship-packages','split-array-largest-sum'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'search-insert-position','find-peak-element','capacity-to-ship-packages','split-array-largest-sum'
);

-- ============================================================
-- 1) search-insert-position (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('search-insert-position', 'binary-search', 'Search Insert Position', 'Easy',
$$<p>Given a sorted array <code>nums</code> and a <code>target</code>, return the index where <code>target</code> is found; if not present, return the index where it would be inserted to keep the array sorted. Must run in O(log n).</p>$$,
'', ARRAY[
  'Binary search for the leftmost position where nums[pos] >= target.',
  'If target exceeds everything, that position is n.',
  'Classic bounds: lo = 0, hi = n. Converge with hi = mid when nums[mid] >= target, else lo = mid + 1.'
], '300', 'https://leetcode.com/problems/search-insert-position/',
'searchInsert',
'[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,3,5,6]","5"],"expected":"2"},
  {"inputs":["[1,3,5,6]","2"],"expected":"1"},
  {"inputs":["[1,3,5,6]","7"],"expected":"4"},
  {"inputs":["[1,3,5,6]","0"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('search-insert-position', 'python',
$PY$class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        $PY$),
('search-insert-position', 'javascript',
$JS$var searchInsert = function(nums, target) {

};$JS$),
('search-insert-position', 'java',
$JAVA$class Solution {
    public int searchInsert(int[] nums, int target) {

    }
}$JAVA$),
('search-insert-position', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('search-insert-position', 1, 'Lower Bound Binary Search',
'The answer is the first index whose value is >= target (or n if no such index exists). Standard lower-bound binary search finds that boundary in O(log n).',
'["lo = 0, hi = n.","While lo < hi: mid = (lo + hi) / 2. If nums[mid] >= target, hi = mid; else lo = mid + 1.","Return lo."]'::jsonb,
$PY$class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] >= target:
                hi = mid
            else:
                lo = mid + 1
        return lo
$PY$,
$JS$var searchInsert = function(nums, target) {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] >= target) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 2) find-peak-element (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-peak-element', 'binary-search', 'Find Peak Element', 'Medium',
$$<p>A peak element is strictly greater than its neighbors. Given an array <code>nums</code> where <code>nums[-1] = nums[n] = -infinity</code> (imagined sentinels), return the index of <strong>any</strong> peak. Run in O(log n).</p>$$,
'', ARRAY[
  'Adjacent elements are always distinct (per the problem), so binary search works: compare nums[mid] to nums[mid + 1].',
  'If nums[mid] < nums[mid + 1], there is definitely a peak on the right side (increasing slope must eventually turn); else on the left side (including mid).',
  'Converge to a single index.'
], '300', 'https://leetcode.com/problems/find-peak-element/',
'findPeakElement',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3,1]"],"expected":"2"},
  {"inputs":["[1,2,1,3,5,6,4]"],"expected":"5"},
  {"inputs":["[1]"],"expected":"0"},
  {"inputs":["[3,2,1]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-peak-element', 'python',
$PY$class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        $PY$),
('find-peak-element', 'javascript',
$JS$var findPeakElement = function(nums) {

};$JS$),
('find-peak-element', 'java',
$JAVA$class Solution {
    public int findPeakElement(int[] nums) {

    }
}$JAVA$),
('find-peak-element', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findPeakElement(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-peak-element', 1, 'Slope-Following Binary Search',
'Because adjacent elements are distinct and the virtual boundaries are -infinity, an "uphill" direction always leads to some peak. Binary search by comparing nums[mid] with its right neighbor; move toward the higher side.',
'["lo = 0, hi = n - 1.","While lo < hi: mid = (lo + hi) / 2. If nums[mid] < nums[mid + 1], the peak lies to the right, lo = mid + 1. Else hi = mid.","Return lo."]'::jsonb,
$PY$class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < nums[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo
$PY$,
$JS$var findPeakElement = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 3) capacity-to-ship-packages (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('capacity-to-ship-packages', 'binary-search', 'Capacity To Ship Packages Within D Days', 'Medium',
$$<p>Packages must ship within <code>days</code> days in the order given. Each day you load consecutive packages up to the ship''s capacity. Return the minimum capacity that allows everything to ship in time.</p>$$,
'', ARRAY[
  'Capacity is monotone — anything larger also works — so binary-search on the answer between max(weights) and sum(weights).',
  'The feasibility check simulates loading: iterate weights, start a new day when adding the next package would exceed capacity.',
  'Count the days used and compare to the constraint.'
], '300', 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/',
'shipWithinDays',
'[{"name":"weights","type":"List[int]"},{"name":"days","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","5"],"expected":"15"},
  {"inputs":["[3,2,2,4,1,4]","3"],"expected":"6"},
  {"inputs":["[1,2,3,1,1]","4"],"expected":"3"},
  {"inputs":["[10,50,100,100,50,100,100,100]","5"],"expected":"200"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('capacity-to-ship-packages', 'python',
$PY$class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        $PY$),
('capacity-to-ship-packages', 'javascript',
$JS$var shipWithinDays = function(weights, days) {

};$JS$),
('capacity-to-ship-packages', 'java',
$JAVA$class Solution {
    public int shipWithinDays(int[] weights, int days) {

    }
}$JAVA$),
('capacity-to-ship-packages', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('capacity-to-ship-packages', 1, 'Binary Search on Capacity',
'The feasible region of capacities is an upward-closed set — any capacity at least as large as the minimum works. So binary search over [max(weights), sum(weights)] with a greedy feasibility check.',
'["lo = max(weights), hi = sum(weights).","While lo < hi: mid = (lo + hi) / 2. If feasible(mid), hi = mid; else lo = mid + 1.","feasible(cap): simulate one-pass loading; count days and stop if > days.","Return lo."]'::jsonb,
$PY$class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        def feasible(cap):
            used = 1
            load = 0
            for w in weights:
                if load + w > cap:
                    used += 1
                    load = 0
                load += w
            return used <= days
        lo, hi = max(weights), sum(weights)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
$PY$,
$JS$var shipWithinDays = function(weights, days) {
    const feasible = (cap) => {
        let used = 1, load = 0;
        for (const w of weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used <= days;
    };
    let lo = 0, hi = 0;
    for (const w of weights) { if (w > lo) lo = w; hi += w; }
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { if (w > lo) lo = w; hi += w; }
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (feasible(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private boolean feasible(int[] weights, int days, int cap) {
        int used = 1, load = 0;
        for (int w : weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used <= days;
    }
}
$JAVA$,
$CPP$class Solution {
    bool feasible(vector<int>& weights, int days, int cap) {
        int used = 1, load = 0;
        for (int w : weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used <= days;
    }
public:
    int shipWithinDays(vector<int>& weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { if (w > lo) lo = w; hi += w; }
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (feasible(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
$CPP$,
'O(n log(sum))', 'O(1)');

-- ============================================================
-- 4) split-array-largest-sum (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('split-array-largest-sum', 'binary-search', 'Split Array Largest Sum', 'Hard',
$$<p>Given a non-negative integer array <code>nums</code> and an integer <code>k</code>, split it into exactly <code>k</code> non-empty contiguous subarrays. Return the minimum possible value of the largest subarray sum among the splits.</p>$$,
'', ARRAY[
  'Binary search over the answer — the minimized maximum sum — between max(nums) and sum(nums).',
  'For a candidate cap, greedily count the groups you form when keeping running sums <= cap. If that count <= k, the cap is feasible.',
  'Shrink the window based on feasibility until lo == hi.'
], '300', 'https://leetcode.com/problems/split-array-largest-sum/',
'splitArray',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[7,2,5,10,8]","2"],"expected":"18"},
  {"inputs":["[1,2,3,4,5]","2"],"expected":"9"},
  {"inputs":["[1,4,4]","3"],"expected":"4"},
  {"inputs":["[10,5,13,4,8,4,5,11,14,9,16,10,20,8]","8"],"expected":"25"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('split-array-largest-sum', 'python',
$PY$class Solution:
    def splitArray(self, nums: List[int], k: int) -> int:
        $PY$),
('split-array-largest-sum', 'javascript',
$JS$var splitArray = function(nums, k) {

};$JS$),
('split-array-largest-sum', 'java',
$JAVA$class Solution {
    public int splitArray(int[] nums, int k) {

    }
}$JAVA$),
('split-array-largest-sum', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int splitArray(vector<int>& nums, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('split-array-largest-sum', 1, 'Binary Search on the Answer',
'For any candidate cap, "can we split nums into at most k subarrays each summing <= cap?" is a greedy O(n) check. That predicate is monotone in cap, so binary-search over [max(nums), sum(nums)] for the smallest cap that passes.',
'["lo = max(nums), hi = sum(nums).","While lo < hi: mid = (lo + hi) / 2. If groups(mid) <= k, hi = mid; else lo = mid + 1.","groups(cap): iterate nums; start a new group whenever the running sum would exceed cap; count groups.","Return lo."]'::jsonb,
$PY$class Solution:
    def splitArray(self, nums: List[int], k: int) -> int:
        def groups(cap):
            count = 1
            running = 0
            for v in nums:
                if running + v > cap:
                    count += 1
                    running = 0
                running += v
            return count
        lo, hi = max(nums), sum(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if groups(mid) <= k:
                hi = mid
            else:
                lo = mid + 1
        return lo
$PY$,
$JS$var splitArray = function(nums, k) {
    const groups = (cap) => {
        let count = 1, running = 0;
        for (const v of nums) {
            if (running + v > cap) { count++; running = 0; }
            running += v;
        }
        return count;
    };
    let lo = 0, hi = 0;
    for (const v of nums) { if (v > lo) lo = v; hi += v; }
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (groups(mid) <= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int splitArray(int[] nums, int k) {
        long lo = 0, hi = 0;
        for (int v : nums) { if (v > lo) lo = v; hi += v; }
        while (lo < hi) {
            long mid = (lo + hi) / 2;
            if (groups(nums, mid) <= k) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
    private int groups(int[] nums, long cap) {
        int count = 1;
        long running = 0;
        for (int v : nums) {
            if (running + v > cap) { count++; running = 0; }
            running += v;
        }
        return count;
    }
}
$JAVA$,
$CPP$class Solution {
    int groups(vector<int>& nums, long long cap) {
        int count = 1;
        long long running = 0;
        for (int v : nums) {
            if (running + v > cap) { count++; running = 0; }
            running += v;
        }
        return count;
    }
public:
    int splitArray(vector<int>& nums, int k) {
        long long lo = 0, hi = 0;
        for (int v : nums) { if (v > lo) lo = v; hi += v; }
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (groups(nums, mid) <= k) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};
$CPP$,
'O(n log(sum))', 'O(1)');

COMMIT;
