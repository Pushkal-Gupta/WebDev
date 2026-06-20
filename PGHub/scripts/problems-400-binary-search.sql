-- Grow catalog 300 → 400: binary-search topic (+6 problems).
-- Each problem ships with metadata + test cases + 4-language starter templates
-- + one reference approach with Python/JS/Java/C++ code and complexity.
BEGIN;

-- Idempotent: drop any prior rows for these IDs so the file can be re-applied.
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'search-a-2d-matrix','search-in-rotated-sorted-array',
  'find-first-and-last-position','koko-eating-bananas',
  'capacity-to-ship-packages-within-d-days','median-of-two-sorted-arrays'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'search-a-2d-matrix','search-in-rotated-sorted-array',
  'find-first-and-last-position','koko-eating-bananas',
  'capacity-to-ship-packages-within-d-days','median-of-two-sorted-arrays'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'search-a-2d-matrix','search-in-rotated-sorted-array',
  'find-first-and-last-position','koko-eating-bananas',
  'capacity-to-ship-packages-within-d-days','median-of-two-sorted-arrays'
);

-- ============================================================
-- 1) search-a-2d-matrix (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('search-a-2d-matrix', 'binary-search', 'Search a 2D Matrix', 'Easy',
$$<p>You are given an <code>m x n</code> integer matrix <code>matrix</code> with the following two properties:</p><ul><li>Each row is sorted in non-decreasing order.</li><li>The first integer of each row is greater than the last integer of the previous row.</li></ul><p>Given an integer <code>target</code>, return <code>true</code> if <code>target</code> is in <code>matrix</code>, or <code>false</code> otherwise. You must write a solution in O(log(m * n)) time complexity.</p>$$,
'', ARRAY[
  'Treat the 2D matrix as a single sorted 1D array of length m * n.',
  'Use standard binary search on indices 0 to m*n - 1, converting each mid index to row and column.',
  'row = mid // n, col = mid % n.'
], '400', 'https://leetcode.com/problems/search-a-2d-matrix/',
'searchMatrix',
'[{"name":"matrix","type":"List[List[int]]"},{"name":"target","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","3"],"expected":"true"},
  {"inputs":["[[1,3,5,7],[10,11,16,20],[23,30,34,60]]","13"],"expected":"false"},
  {"inputs":["[[1]]","1"],"expected":"true"},
  {"inputs":["[[1,3]]","3"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('search-a-2d-matrix', 'python',
$PY$class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        $PY$),
('search-a-2d-matrix', 'javascript',
$JS$/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {

};$JS$),
('search-a-2d-matrix', 'java',
$JAVA$class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {

    }
}$JAVA$),
('search-a-2d-matrix', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('search-a-2d-matrix', 1, 'Flattened Binary Search',
'The matrix is effectively a sorted 1D array. Map a 1D index to 2D coordinates and run standard binary search.',
$ALGO$["Let m = rows, n = cols. Set lo = 0, hi = m * n - 1.","While lo <= hi: mid = (lo + hi) // 2. Compute row = mid // n, col = mid % n.","If matrix[row][col] == target, return true. If less, lo = mid + 1. Else hi = mid - 1.","Return false."]$ALGO$::jsonb,
$PY$class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            val = matrix[mid // n][mid % n]
            if val == target:
                return True
            elif val < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return False
$PY$,
$JS$var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let lo = 0, hi = m * n - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const val = matrix[Math.floor(mid / n)][mid % n];
        if (val === target) return true;
        else if (val < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            else if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m = (int)matrix.size(), n = (int)matrix[0].size();
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            else if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
};
$CPP$,
'O(log(m * n))', 'O(1)');

-- ============================================================
-- 2) search-in-rotated-sorted-array (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('search-in-rotated-sorted-array', 'binary-search', 'Search in Rotated Sorted Array', 'Medium',
$$<p>There is an integer array <code>nums</code> sorted in ascending order (with distinct values) that has been rotated at some pivot. Given <code>target</code>, return its index, or <code>-1</code> if not found. You must write an algorithm with O(log n) runtime complexity.</p>$$,
'', ARRAY[
  'In a rotated sorted array, at least one half is always sorted.',
  'Determine which half is sorted by comparing nums[mid] with nums[lo].',
  'Check if target lies in the sorted half; if so, search there. Otherwise search the other half.'
], '400', 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
'search',
'[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[4,5,6,7,0,1,2]","0"],"expected":"4"},
  {"inputs":["[4,5,6,7,0,1,2]","3"],"expected":"-1"},
  {"inputs":["[1]","0"],"expected":"-1"},
  {"inputs":["[3,1]","1"],"expected":"1"},
  {"inputs":["[5,1,3]","3"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('search-in-rotated-sorted-array', 'python',
$PY$class Solution:
    def search(self, nums: List[int], target: int) -> int:
        $PY$),
('search-in-rotated-sorted-array', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {

};$JS$),
('search-in-rotated-sorted-array', 'java',
$JAVA$class Solution {
    public int search(int[] nums, int target) {

    }
}$JAVA$),
('search-in-rotated-sorted-array', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('search-in-rotated-sorted-array', 1, 'Modified Binary Search',
'At each step, one half of the array is guaranteed to be sorted. Check if the target falls in that sorted range; if yes, narrow to that half. Otherwise narrow to the other half.',
$ALGO$["Set lo = 0, hi = n - 1.","While lo <= hi: mid = (lo + hi) // 2. If nums[mid] == target, return mid.","If nums[lo] <= nums[mid] (left half sorted): if nums[lo] <= target < nums[mid], set hi = mid - 1; else lo = mid + 1.","Else (right half sorted): if nums[mid] < target <= nums[hi], set lo = mid + 1; else hi = mid - 1.","Return -1."]$ALGO$::jsonb,
$PY$class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1
$PY$,
$JS$var search = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 3) find-first-and-last-position (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-first-and-last-position', 'binary-search', 'Find First and Last Position of Element in Sorted Array', 'Medium',
$$<p>Given an array of integers <code>nums</code> sorted in non-decreasing order, find the starting and ending position of a given <code>target</code> value. If <code>target</code> is not found, return <code>[-1, -1]</code>.</p><p>You must write an algorithm with O(log n) runtime complexity.</p>$$,
'', ARRAY[
  'Run binary search twice: once to find the leftmost occurrence, once for the rightmost.',
  'For the leftmost: when nums[mid] == target, continue searching left (hi = mid - 1).',
  'For the rightmost: when nums[mid] == target, continue searching right (lo = mid + 1).'
], '400', 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
'searchRange',
'[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[5,7,7,8,8,10]","8"],"expected":"[3,4]"},
  {"inputs":["[5,7,7,8,8,10]","6"],"expected":"[-1,-1]"},
  {"inputs":["[]","0"],"expected":"[-1,-1]"},
  {"inputs":["[1]","1"],"expected":"[0,0]"},
  {"inputs":["[2,2]","2"],"expected":"[0,1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-first-and-last-position', 'python',
$PY$class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        $PY$),
('find-first-and-last-position', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var searchRange = function(nums, target) {

};$JS$),
('find-first-and-last-position', 'java',
$JAVA$class Solution {
    public int[] searchRange(int[] nums, int target) {

    }
}$JAVA$),
('find-first-and-last-position', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-first-and-last-position', 1, 'Two Binary Searches',
'Use one binary search biased left to find the first occurrence and another biased right to find the last. Both run in O(log n).',
$ALGO$["Define findLeft(nums, target): standard binary search but when nums[mid] == target, record mid and set hi = mid - 1.","Define findRight(nums, target): when nums[mid] == target, record mid and set lo = mid + 1.","Return [findLeft result, findRight result]. If either is not found, return [-1, -1]."]$ALGO$::jsonb,
$PY$class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        def findLeft():
            lo, hi, idx = 0, len(nums) - 1, -1
            while lo <= hi:
                mid = (lo + hi) // 2
                if nums[mid] == target:
                    idx = mid
                    hi = mid - 1
                elif nums[mid] < target:
                    lo = mid + 1
                else:
                    hi = mid - 1
            return idx

        def findRight():
            lo, hi, idx = 0, len(nums) - 1, -1
            while lo <= hi:
                mid = (lo + hi) // 2
                if nums[mid] == target:
                    idx = mid
                    lo = mid + 1
                elif nums[mid] < target:
                    lo = mid + 1
                else:
                    hi = mid - 1
            return idx

        return [findLeft(), findRight()]
$PY$,
$JS$var searchRange = function(nums, target) {
    function findLeft() {
        let lo = 0, hi = nums.length - 1, idx = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] === target) { idx = mid; hi = mid - 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
    function findRight() {
        let lo = 0, hi = nums.length - 1, idx = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] === target) { idx = mid; lo = mid + 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
    return [findLeft(), findRight()];
};
$JS$,
$JAVA$class Solution {
    public int[] searchRange(int[] nums, int target) {
        return new int[]{findLeft(nums, target), findRight(nums, target)};
    }
    private int findLeft(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1, idx = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { idx = mid; hi = mid - 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
    private int findRight(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1, idx = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { idx = mid; lo = mid + 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        return {findLeft(nums, target), findRight(nums, target)};
    }
private:
    int findLeft(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1, idx = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { idx = mid; hi = mid - 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
    int findRight(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1, idx = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { idx = mid; lo = mid + 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return idx;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 4) koko-eating-bananas (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('koko-eating-bananas', 'binary-search', 'Koko Eating Bananas', 'Medium',
$$<p>Koko loves to eat bananas. There are <code>n</code> piles of bananas, the i-th pile has <code>piles[i]</code> bananas. The guards will come back in <code>h</code> hours.</p><p>Koko can decide her eating speed <code>k</code> (bananas per hour). Each hour she chooses a pile and eats <code>k</code> bananas from it. If the pile has fewer than <code>k</code> bananas, she eats all of them and won't eat any more during that hour.</p><p>Return the minimum integer <code>k</code> such that she can eat all the bananas within <code>h</code> hours.</p>$$,
'', ARRAY[
  'Binary search on the answer k. The minimum is 1 and the maximum is max(piles).',
  'For a given k, compute the total hours needed: sum of ceil(pile / k) for each pile.',
  'If total hours <= h, try a smaller k. Otherwise try a larger k.'
], '400', 'https://leetcode.com/problems/koko-eating-bananas/',
'minEatingSpeed',
'[{"name":"piles","type":"List[int]"},{"name":"h","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[3,6,7,11]","8"],"expected":"4"},
  {"inputs":["[30,11,23,4,20]","5"],"expected":"30"},
  {"inputs":["[30,11,23,4,20]","6"],"expected":"23"},
  {"inputs":["[1000000000]","2"],"expected":"500000000"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('koko-eating-bananas', 'python',
$PY$class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        $PY$),
('koko-eating-bananas', 'javascript',
$JS$/**
 * @param {number[]} piles
 * @param {number} h
 * @return {number}
 */
var minEatingSpeed = function(piles, h) {

};$JS$),
('koko-eating-bananas', 'java',
$JAVA$class Solution {
    public int minEatingSpeed(int[] piles, int h) {

    }
}$JAVA$),
('koko-eating-bananas', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('koko-eating-bananas', 1, 'Binary Search on Answer',
'The eating speed k is monotonic: if k works, any larger k also works. Binary search for the smallest valid k between 1 and max(piles).',
$ALGO$["Set lo = 1, hi = max(piles).","While lo < hi: mid = (lo + hi) // 2.","Compute hours needed at speed mid: sum of ceil(pile / mid) for each pile.","If hours <= h, set hi = mid (mid might be the answer). Else set lo = mid + 1.","Return lo."]$ALGO$::jsonb,
$PY$class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        lo, hi = 1, max(piles)
        while lo < hi:
            mid = (lo + hi) // 2
            hours = sum((p + mid - 1) // mid for p in piles)
            if hours <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo
$PY$,
$JS$var minEatingSpeed = function(piles, h) {
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        let hours = 0;
        for (const p of piles) hours += Math.ceil(p / mid);
        if (hours <= h) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
$CPP$,
'O(n * log(max(piles)))', 'O(1)');

-- ============================================================
-- 5) capacity-to-ship-packages-within-d-days (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('capacity-to-ship-packages-within-d-days', 'binary-search', 'Capacity To Ship Packages Within D Days', 'Medium',
$$<p>A conveyor belt has packages that must be shipped from one port to another within <code>days</code> days. The i-th package has weight <code>weights[i]</code>. Each day, packages are loaded onto the ship in order. The ship cannot carry more than its capacity.</p><p>Return the least weight capacity of the ship that will result in all the packages being shipped within <code>days</code> days.</p>$$,
'', ARRAY[
  'Binary search on the ship capacity. Minimum capacity is max(weights), maximum is sum(weights).',
  'For a given capacity, greedily simulate loading: start a new day when the next package would exceed capacity.',
  'If the number of days needed is <= days, try a smaller capacity.'
], '400', 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/',
'shipWithinDays',
'[{"name":"weights","type":"List[int]"},{"name":"days","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]","5"],"expected":"15"},
  {"inputs":["[3,2,2,4,1,4]","3"],"expected":"6"},
  {"inputs":["[1,2,3,1,1]","4"],"expected":"3"},
  {"inputs":["[10]","1"],"expected":"10"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('capacity-to-ship-packages-within-d-days', 'python',
$PY$class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        $PY$),
('capacity-to-ship-packages-within-d-days', 'javascript',
$JS$/**
 * @param {number[]} weights
 * @param {number} days
 * @return {number}
 */
var shipWithinDays = function(weights, days) {

};$JS$),
('capacity-to-ship-packages-within-d-days', 'java',
$JAVA$class Solution {
    public int shipWithinDays(int[] weights, int days) {

    }
}$JAVA$),
('capacity-to-ship-packages-within-d-days', 'cpp',
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
('capacity-to-ship-packages-within-d-days', 1, 'Binary Search on Capacity',
'The answer is monotonic: a larger capacity always needs fewer or equal days. Binary search between max(weights) and sum(weights) for the smallest capacity that ships within the deadline.',
$ALGO$["Set lo = max(weights), hi = sum(weights).","While lo < hi: mid = (lo + hi) // 2.","Simulate loading with capacity mid: count days needed.","If days needed <= target days, set hi = mid. Else lo = mid + 1.","Return lo."]$ALGO$::jsonb,
$PY$class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        lo, hi = max(weights), sum(weights)
        while lo < hi:
            mid = (lo + hi) // 2
            need, cur = 1, 0
            for w in weights:
                if cur + w > mid:
                    need += 1
                    cur = 0
                cur += w
            if need <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo
$PY$,
$JS$var shipWithinDays = function(weights, days) {
    let lo = Math.max(...weights);
    let hi = weights.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        let need = 1, cur = 0;
        for (const w of weights) {
            if (cur + w > mid) { need++; cur = 0; }
            cur += w;
        }
        if (need <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int need = 1, cur = 0;
            for (int w : weights) {
                if (cur + w > mid) { need++; cur = 0; }
                cur += w;
            }
            if (need <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {
        int lo = *max_element(weights.begin(), weights.end());
        int hi = accumulate(weights.begin(), weights.end(), 0);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int need = 1, cur = 0;
            for (int w : weights) {
                if (cur + w > mid) { need++; cur = 0; }
                cur += w;
            }
            if (need <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
$CPP$,
'O(n * log(sum - max))', 'O(1)');

-- ============================================================
-- 6) median-of-two-sorted-arrays (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('median-of-two-sorted-arrays', 'binary-search', 'Median of Two Sorted Arrays', 'Hard',
$$<p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code> respectively, return the <strong>median</strong> of the two sorted arrays.</p><p>The overall run time complexity should be O(log(min(m, n))).</p>$$,
'', ARRAY[
  'Binary search on the partition of the smaller array. For each partition position, compute the corresponding partition in the larger array.',
  'The correct partition ensures maxLeft1 <= minRight2 and maxLeft2 <= minRight1.',
  'The median is derived from the max of the left halves and the min of the right halves.'
], '400', 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
'findMedianSortedArrays',
'[{"name":"nums1","type":"List[int]"},{"name":"nums2","type":"List[int]"}]'::jsonb,
'float',
'[
  {"inputs":["[1,3]","[2]"],"expected":"2.0"},
  {"inputs":["[1,2]","[3,4]"],"expected":"2.5"},
  {"inputs":["[0,0]","[0,0]"],"expected":"0.0"},
  {"inputs":["[]","[1]"],"expected":"1.0"},
  {"inputs":["[2]","[]"],"expected":"2.0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('median-of-two-sorted-arrays', 'python',
$PY$class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        $PY$),
('median-of-two-sorted-arrays', 'javascript',
$JS$/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {

};$JS$),
('median-of-two-sorted-arrays', 'java',
$JAVA$class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {

    }
}$JAVA$),
('median-of-two-sorted-arrays', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('median-of-two-sorted-arrays', 1, 'Binary Search on Partition',
'Binary search on the smaller array to find a partition such that all elements on the left are less than or equal to all elements on the right. The median is at the boundary of this partition.',
$ALGO$["Ensure nums1 is the smaller array. Let m = len(nums1), n = len(nums2), half = (m + n + 1) // 2.","Binary search lo = 0, hi = m. mid1 = (lo + hi) // 2, mid2 = half - mid1.","Compute maxLeft1, minRight1, maxLeft2, minRight2 (use -inf/inf for out-of-bounds).","If maxLeft1 > minRight2, hi = mid1 - 1. If maxLeft2 > minRight1, lo = mid1 + 1.","Else partition is correct: if total is odd return max(maxLeft1, maxLeft2), else return average of max(lefts) and min(rights)."]$ALGO$::jsonb,
$PY$class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        lo, hi = 0, m
        while lo <= hi:
            i = (lo + hi) // 2
            j = (m + n + 1) // 2 - i
            left1 = nums1[i - 1] if i > 0 else float('-inf')
            right1 = nums1[i] if i < m else float('inf')
            left2 = nums2[j - 1] if j > 0 else float('-inf')
            right2 = nums2[j] if j < n else float('inf')
            if left1 <= right2 and left2 <= right1:
                if (m + n) % 2 == 1:
                    return float(max(left1, left2))
                return (max(left1, left2) + min(right1, right2)) / 2.0
            elif left1 > right2:
                hi = i - 1
            else:
                lo = i + 1
        return 0.0
$PY$,
$JS$var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
    const m = nums1.length, n = nums2.length;
    let lo = 0, hi = m;
    while (lo <= hi) {
        const i = (lo + hi) >> 1;
        const j = ((m + n + 1) >> 1) - i;
        const left1 = i > 0 ? nums1[i - 1] : -Infinity;
        const right1 = i < m ? nums1[i] : Infinity;
        const left2 = j > 0 ? nums2[j - 1] : -Infinity;
        const right2 = j < n ? nums2[j] : Infinity;
        if (left1 <= right2 && left2 <= right1) {
            if ((m + n) % 2 === 1) return Math.max(left1, left2);
            return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
        } else if (left1 > right2) hi = i - 1;
        else lo = i + 1;
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            int[] tmp = nums1; nums1 = nums2; nums2 = tmp;
        }
        int m = nums1.length, n = nums2.length;
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = (m + n + 1) / 2 - i;
            int left1 = i > 0 ? nums1[i - 1] : Integer.MIN_VALUE;
            int right1 = i < m ? nums1[i] : Integer.MAX_VALUE;
            int left2 = j > 0 ? nums2[j - 1] : Integer.MIN_VALUE;
            int right2 = j < n ? nums2[j] : Integer.MAX_VALUE;
            if (left1 <= right2 && left2 <= right1) {
                if ((m + n) % 2 == 1) return Math.max(left1, left2);
                return (Math.max(left1, left2) + Math.min(right1, right2)) / 2.0;
            } else if (left1 > right2) hi = i - 1;
            else lo = i + 1;
        }
        return 0.0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) swap(nums1, nums2);
        int m = (int)nums1.size(), n = (int)nums2.size();
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = (m + n + 1) / 2 - i;
            int left1 = i > 0 ? nums1[i - 1] : INT_MIN;
            int right1 = i < m ? nums1[i] : INT_MAX;
            int left2 = j > 0 ? nums2[j - 1] : INT_MIN;
            int right2 = j < n ? nums2[j] : INT_MAX;
            if (left1 <= right2 && left2 <= right1) {
                if ((m + n) % 2 == 1) return max(left1, left2);
                return (max(left1, left2) + min(right1, right2)) / 2.0;
            } else if (left1 > right2) hi = i - 1;
            else lo = i + 1;
        }
        return 0.0;
    }
};
$CPP$,
'O(log(min(m, n)))', 'O(1)');

COMMIT;
