-- Grow catalog 300 → 400: two-pointers topic (+6 problems).
-- Each problem ships with metadata + test cases + 4-language starter templates
-- + one reference approach with Python/JS/Java/C++ code and complexity.
BEGIN;

-- Idempotent: drop any prior rows for these IDs so the file can be re-applied.
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'two-sum-ii-input-array-is-sorted','backspace-string-compare','3sum',
  'container-with-most-water','3sum-closest','four-sum'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'two-sum-ii-input-array-is-sorted','backspace-string-compare','3sum',
  'container-with-most-water','3sum-closest','four-sum'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'two-sum-ii-input-array-is-sorted','backspace-string-compare','3sum',
  'container-with-most-water','3sum-closest','four-sum'
);

-- ============================================================
-- 1) two-sum-ii-input-array-is-sorted (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('two-sum-ii-input-array-is-sorted', 'two-pointers', 'Two Sum II - Input Array Is Sorted', 'Easy',
$$<p>Given a <strong>1-indexed</strong> array of integers <code>numbers</code> that is already sorted in non-decreasing order, find two numbers such that they add up to a specific <code>target</code> number.</p><p>Return the indices of the two numbers (1-indexed) as an integer array <code>[index1, index2]</code> of length 2.</p><p>You may not use the same element twice. There is exactly one solution.</p>$$,
'', ARRAY[
  'Use two pointers: one at the start and one at the end of the array.',
  'If the sum is too large, move the right pointer left. If too small, move the left pointer right.',
  'Because the array is sorted, this converges in O(n) time with O(1) space.'
], '400', 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
'twoSum',
'[{"name":"numbers","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[2,7,11,15]","9"],"expected":"[1,2]"},
  {"inputs":["[2,3,4]","6"],"expected":"[1,3]"},
  {"inputs":["[-1,0]","-1"],"expected":"[1,2]"},
  {"inputs":["[1,2,3,4,4,9,56,90]","8"],"expected":"[4,5]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('two-sum-ii-input-array-is-sorted', 'python',
$PY$class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        $PY$),
('two-sum-ii-input-array-is-sorted', 'javascript',
$JS$/**
 * @param {number[]} numbers
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(numbers, target) {

};$JS$),
('two-sum-ii-input-array-is-sorted', 'java',
$JAVA$class Solution {
    public int[] twoSum(int[] numbers, int target) {

    }
}$JAVA$),
('two-sum-ii-input-array-is-sorted', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('two-sum-ii-input-array-is-sorted', 1, 'Two Pointers',
'Since the array is sorted, place one pointer at the beginning and one at the end. If the sum is too large, decrement the right pointer; if too small, increment the left. This narrows the window toward the unique answer in O(n).',
'["Initialize left = 0, right = len(numbers) - 1.","While left < right: compute s = numbers[left] + numbers[right].","If s == target, return [left+1, right+1]. If s < target, left += 1. Else right -= 1."]'::jsonb,
$PY$class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        left, right = 0, len(numbers) - 1
        while left < right:
            s = numbers[left] + numbers[right]
            if s == target:
                return [left + 1, right + 1]
            elif s < target:
                left += 1
            else:
                right -= 1
        return []
$PY$,
$JS$var twoSum = function(numbers, target) {
    let left = 0, right = numbers.length - 1;
    while (left < right) {
        const s = numbers[left] + numbers[right];
        if (s === target) return [left + 1, right + 1];
        else if (s < target) left++;
        else right--;
    }
    return [];
};
$JS$,
$JAVA$class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int s = numbers[left] + numbers[right];
            if (s == target) return new int[]{left + 1, right + 1};
            else if (s < target) left++;
            else right--;
        }
        return new int[]{};
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int left = 0, right = (int)numbers.size() - 1;
        while (left < right) {
            int s = numbers[left] + numbers[right];
            if (s == target) return {left + 1, right + 1};
            else if (s < target) left++;
            else right--;
        }
        return {};
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 2) backspace-string-compare (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('backspace-string-compare', 'two-pointers', 'Backspace String Compare', 'Easy',
$$<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if they are equal when both are typed into empty text editors. <code>#</code> means a backspace character.</p><p>Note that after backspacing an empty text, the text will continue to be empty.</p>$$,
'', ARRAY[
  'You can build each resulting string with a stack and compare, but that uses O(n) space.',
  'For O(1) space, iterate from the end of each string. Count pending backspaces and skip characters accordingly.',
  'Compare one character at a time from both strings moving right to left.'
], '400', 'https://leetcode.com/problems/backspace-string-compare/',
'backspaceCompare',
'[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,
'bool',
'[
  {"inputs":["\"ab#c\"","\"ad#c\""],"expected":"true"},
  {"inputs":["\"ab##\"","\"c#d#\""],"expected":"true"},
  {"inputs":["\"a#c\"","\"b\""],"expected":"false"},
  {"inputs":["\"a##c\"","\"#a#c\""],"expected":"true"},
  {"inputs":["\"bxj##tw\"","\"bxo#j##tw\""],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('backspace-string-compare', 'python',
$PY$class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        $PY$),
('backspace-string-compare', 'javascript',
$JS$/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var backspaceCompare = function(s, t) {

};$JS$),
('backspace-string-compare', 'java',
$JAVA$class Solution {
    public boolean backspaceCompare(String s, String t) {

    }
}$JAVA$),
('backspace-string-compare', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool backspaceCompare(string s, string t) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('backspace-string-compare', 1, 'Two Pointers from End',
'Process both strings from right to left. Maintain a skip counter for each string to handle backspaces. When both pointers land on valid characters, compare them. This achieves O(1) extra space.',
$ALGO$["Start pointers i and j at the end of s and t respectively.","For each string, count consecutive # characters and skip that many non-# characters.","Compare the current valid characters; if they differ return false.","If one string is exhausted before the other, return false.","If both are exhausted simultaneously, return true."]$ALGO$::jsonb,
$PY$class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        i, j = len(s) - 1, len(t) - 1
        skip_s = skip_t = 0
        while i >= 0 or j >= 0:
            while i >= 0:
                if s[i] == '#':
                    skip_s += 1
                    i -= 1
                elif skip_s > 0:
                    skip_s -= 1
                    i -= 1
                else:
                    break
            while j >= 0:
                if t[j] == '#':
                    skip_t += 1
                    j -= 1
                elif skip_t > 0:
                    skip_t -= 1
                    j -= 1
                else:
                    break
            if i >= 0 and j >= 0:
                if s[i] != t[j]:
                    return False
            elif i >= 0 or j >= 0:
                return False
            i -= 1
            j -= 1
        return True
$PY$,
$JS$var backspaceCompare = function(s, t) {
    let i = s.length - 1, j = t.length - 1;
    let skipS = 0, skipT = 0;
    while (i >= 0 || j >= 0) {
        while (i >= 0) {
            if (s[i] === '#') { skipS++; i--; }
            else if (skipS > 0) { skipS--; i--; }
            else break;
        }
        while (j >= 0) {
            if (t[j] === '#') { skipT++; j--; }
            else if (skipT > 0) { skipT--; j--; }
            else break;
        }
        if (i >= 0 && j >= 0) {
            if (s[i] !== t[j]) return false;
        } else if (i >= 0 || j >= 0) return false;
        i--; j--;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean backspaceCompare(String s, String t) {
        int i = s.length() - 1, j = t.length() - 1;
        int skipS = 0, skipT = 0;
        while (i >= 0 || j >= 0) {
            while (i >= 0) {
                if (s.charAt(i) == '#') { skipS++; i--; }
                else if (skipS > 0) { skipS--; i--; }
                else break;
            }
            while (j >= 0) {
                if (t.charAt(j) == '#') { skipT++; j--; }
                else if (skipT > 0) { skipT--; j--; }
                else break;
            }
            if (i >= 0 && j >= 0) {
                if (s.charAt(i) != t.charAt(j)) return false;
            } else if (i >= 0 || j >= 0) return false;
            i--; j--;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool backspaceCompare(string s, string t) {
        int i = (int)s.size() - 1, j = (int)t.size() - 1;
        int skipS = 0, skipT = 0;
        while (i >= 0 || j >= 0) {
            while (i >= 0) {
                if (s[i] == '#') { skipS++; i--; }
                else if (skipS > 0) { skipS--; i--; }
                else break;
            }
            while (j >= 0) {
                if (t[j] == '#') { skipT++; j--; }
                else if (skipT > 0) { skipT--; j--; }
                else break;
            }
            if (i >= 0 && j >= 0) {
                if (s[i] != t[j]) return false;
            } else if (i >= 0 || j >= 0) return false;
            i--; j--;
        }
        return true;
    }
};
$CPP$,
'O(n + m)', 'O(1)');

-- ============================================================
-- 3) 3sum (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('3sum', 'two-pointers', '3Sum', 'Medium',
$$<p>Given an integer array <code>nums</code>, return all the triplets <code>[nums[i], nums[j], nums[k]]</code> such that <code>i != j</code>, <code>i != k</code>, and <code>j != k</code>, and <code>nums[i] + nums[j] + nums[k] == 0</code>.</p><p>The solution set must not contain duplicate triplets.</p>$$,
'', ARRAY[
  'Sort the array first so you can skip duplicates easily.',
  'Fix one element and use two pointers on the remaining sub-array to find pairs that sum to its negative.',
  'Skip duplicate values for all three positions to avoid duplicate triplets.'
], '400', 'https://leetcode.com/problems/3sum/',
'threeSum',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[-1,0,1,2,-1,-4]"],"expected":"[[-1,-1,2],[-1,0,1]]"},
  {"inputs":["[0,1,1]"],"expected":"[]"},
  {"inputs":["[0,0,0]"],"expected":"[[0,0,0]]"},
  {"inputs":["[-2,0,1,1,2]"],"expected":"[[-2,0,2],[-2,1,1]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('3sum', 'python',
$PY$class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        $PY$),
('3sum', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {

};$JS$),
('3sum', 'java',
$JAVA$import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {

    }
}$JAVA$),
('3sum', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('3sum', 1, 'Sort + Two Pointers',
'After sorting, fix one number and use two pointers on the rest to find a complementary pair. Skip duplicates at every level to ensure uniqueness.',
$ALGO$["Sort nums in ascending order.","For each index i from 0 to n-3: skip if nums[i] == nums[i-1] (duplicate). Set left = i+1, right = n-1.","While left < right: compute total = nums[i] + nums[left] + nums[right].","If total == 0, record the triplet, then advance left and right past duplicates.","If total < 0, increment left. If total > 0, decrement right."]$ALGO$::jsonb,
$PY$class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    res.append([nums[i], nums[left], nums[right]])
                    while left < right and nums[left] == nums[left + 1]:
                        left += 1
                    while left < right and nums[right] == nums[right - 1]:
                        right -= 1
                    left += 1
                    right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1
        return res
$PY$,
$JS$var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let left = i + 1, right = nums.length - 1;
        while (left < right) {
            const total = nums[i] + nums[left] + nums[right];
            if (total === 0) {
                res.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                left++; right--;
            } else if (total < 0) left++;
            else right--;
        }
    }
    return res;
};
$JS$,
$JAVA$import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total == 0) {
                    res.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++; right--;
                } else if (total < 0) left++;
                else right--;
            }
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = (int)nums.size() - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total == 0) {
                    res.push_back({nums[i], nums[left], nums[right]});
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++; right--;
                } else if (total < 0) left++;
                else right--;
            }
        }
        return res;
    }
};
$CPP$,
'O(n^2)', 'O(1)');

-- ============================================================
-- 4) container-with-most-water (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('container-with-most-water', 'two-pointers', 'Container With Most Water', 'Medium',
$$<p>You are given an integer array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the i-th line are <code>(i, 0)</code> and <code>(i, height[i])</code>.</p><p>Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.</p>$$,
'', ARRAY[
  'Use two pointers starting at the widest container (left = 0, right = n-1).',
  'The area is min(height[left], height[right]) * (right - left). Move the shorter side inward.',
  'Moving the shorter side is optimal because the width decreases, so only a taller line can compensate.'
], '400', 'https://leetcode.com/problems/container-with-most-water/',
'maxArea',
'[{"name":"height","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,8,6,2,5,4,8,3,7]"],"expected":"49"},
  {"inputs":["[1,1]"],"expected":"1"},
  {"inputs":["[4,3,2,1,4]"],"expected":"16"},
  {"inputs":["[1,2,1]"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('container-with-most-water', 'python',
$PY$class Solution:
    def maxArea(self, height: List[int]) -> int:
        $PY$),
('container-with-most-water', 'javascript',
$JS$/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {

};$JS$),
('container-with-most-water', 'java',
$JAVA$class Solution {
    public int maxArea(int[] height) {

    }
}$JAVA$),
('container-with-most-water', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('container-with-most-water', 1, 'Two Pointers',
'Start with the widest possible container. The only way to potentially find a larger area as the width shrinks is to move the pointer with the shorter height inward, hoping for a taller line.',
$ALGO$["Initialize left = 0, right = n - 1, maxWater = 0.","Compute area = min(height[left], height[right]) * (right - left). Update maxWater.","If height[left] < height[right], increment left; otherwise decrement right.","Repeat until left meets right."]$ALGO$::jsonb,
$PY$class Solution:
    def maxArea(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        max_water = 0
        while left < right:
            area = min(height[left], height[right]) * (right - left)
            max_water = max(max_water, area)
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return max_water
$PY$,
$JS$var maxArea = function(height) {
    let left = 0, right = height.length - 1, maxWater = 0;
    while (left < right) {
        const area = Math.min(height[left], height[right]) * (right - left);
        maxWater = Math.max(maxWater, area);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxWater;
};
$JS$,
$JAVA$class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1, maxWater = 0;
        while (left < right) {
            int area = Math.min(height[left], height[right]) * (right - left);
            maxWater = Math.max(maxWater, area);
            if (height[left] < height[right]) left++;
            else right--;
        }
        return maxWater;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0, right = (int)height.size() - 1, maxWater = 0;
        while (left < right) {
            int area = min(height[left], height[right]) * (right - left);
            maxWater = max(maxWater, area);
            if (height[left] < height[right]) left++;
            else right--;
        }
        return maxWater;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 5) 3sum-closest (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('3sum-closest', 'two-pointers', '3Sum Closest', 'Medium',
$$<p>Given an integer array <code>nums</code> of length <code>n</code> and an integer <code>target</code>, find three integers in <code>nums</code> such that the sum is closest to <code>target</code>. Return the sum of the three integers.</p><p>You may assume that each input would have exactly one solution.</p>$$,
'', ARRAY[
  'Sort the array first, then for each element use two pointers on the remaining part.',
  'Track the closest sum seen so far and update whenever the absolute difference is smaller.',
  'Move the pointers based on whether the current sum is less than or greater than the target.'
], '400', 'https://leetcode.com/problems/3sum-closest/',
'threeSumClosest',
'[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[-1,2,1,-4]","1"],"expected":"2"},
  {"inputs":["[0,0,0]","1"],"expected":"0"},
  {"inputs":["[1,1,1,0]","-100"],"expected":"2"},
  {"inputs":["[1,2,4,8,16,32,64,128]","82"],"expected":"82"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('3sum-closest', 'python',
$PY$class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        $PY$),
('3sum-closest', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var threeSumClosest = function(nums, target) {

};$JS$),
('3sum-closest', 'java',
$JAVA$class Solution {
    public int threeSumClosest(int[] nums, int target) {

    }
}$JAVA$),
('3sum-closest', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('3sum-closest', 1, 'Sort + Two Pointers',
'Sort the array and for each element run a two-pointer scan on the rest. Track the sum closest to target. Because we sorted, we know which pointer to move to get closer to the target.',
$ALGO$["Sort nums. Initialize closest = nums[0] + nums[1] + nums[2].","For each i from 0 to n-3: set left = i+1, right = n-1.","While left < right: compute total = nums[i] + nums[left] + nums[right].","If abs(total - target) < abs(closest - target), update closest = total.","If total < target, left++. If total > target, right--. If total == target, return target immediately."]$ALGO$::jsonb,
$PY$class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        nums.sort()
        closest = nums[0] + nums[1] + nums[2]
        for i in range(len(nums) - 2):
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if abs(total - target) < abs(closest - target):
                    closest = total
                if total < target:
                    left += 1
                elif total > target:
                    right -= 1
                else:
                    return target
        return closest
$PY$,
$JS$var threeSumClosest = function(nums, target) {
    nums.sort((a, b) => a - b);
    let closest = nums[0] + nums[1] + nums[2];
    for (let i = 0; i < nums.length - 2; i++) {
        let left = i + 1, right = nums.length - 1;
        while (left < right) {
            const total = nums[i] + nums[left] + nums[right];
            if (Math.abs(total - target) < Math.abs(closest - target)) closest = total;
            if (total < target) left++;
            else if (total > target) right--;
            else return target;
        }
    }
    return closest;
};
$JS$,
$JAVA$class Solution {
    public int threeSumClosest(int[] nums, int target) {
        Arrays.sort(nums);
        int closest = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < nums.length - 2; i++) {
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (Math.abs(total - target) < Math.abs(closest - target)) closest = total;
                if (total < target) left++;
                else if (total > target) right--;
                else return target;
            }
        }
        return closest;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int closest = nums[0] + nums[1] + nums[2];
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            int left = i + 1, right = (int)nums.size() - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (abs(total - target) < abs(closest - target)) closest = total;
                if (total < target) left++;
                else if (total > target) right--;
                else return target;
            }
        }
        return closest;
    }
};
$CPP$,
'O(n^2)', 'O(1)');

-- ============================================================
-- 6) four-sum (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('four-sum', 'two-pointers', '4Sum', 'Hard',
$$<p>Given an array <code>nums</code> of <code>n</code> integers, return an array of all the <strong>unique</strong> quadruplets <code>[nums[a], nums[b], nums[c], nums[d]]</code> such that <code>a, b, c, d</code> are distinct indices and <code>nums[a] + nums[b] + nums[c] + nums[d] == target</code>.</p><p>You may return the answer in any order.</p>$$,
'', ARRAY[
  'Extend the 3Sum approach: fix two elements with nested loops, then use two pointers for the remaining pair.',
  'Sort first and skip duplicates at every level to avoid duplicate quadruplets.',
  'Watch out for integer overflow when summing four numbers; use long in Java/C++.'
], '400', 'https://leetcode.com/problems/4sum/',
'fourSum',
'[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[1,0,-1,0,-2,2]","0"],"expected":"[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"},
  {"inputs":["[2,2,2,2,2]","8"],"expected":"[[2,2,2,2]]"},
  {"inputs":["[-3,-1,0,2,4,5]","0"],"expected":"[[-3,-1,0,4]]"},
  {"inputs":["[0,0,0,0]","0"],"expected":"[[0,0,0,0]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('four-sum', 'python',
$PY$class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        $PY$),
('four-sum', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[][]}
 */
var fourSum = function(nums, target) {

};$JS$),
('four-sum', 'java',
$JAVA$import java.util.*;

class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {

    }
}$JAVA$),
('four-sum', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('four-sum', 1, 'Sort + Two Pointers (k-Sum)',
'Generalise 3Sum: sort, fix the first two elements with nested loops, and use two pointers for the remaining pair. Skip duplicates at every level.',
$ALGO$["Sort nums. For i from 0 to n-4 (skip duplicates): for j from i+1 to n-3 (skip duplicates):","Set left = j+1, right = n-1. Compute total = nums[i]+nums[j]+nums[left]+nums[right].","If total == target, record the quadruplet, skip duplicates, advance both pointers.","If total < target, increment left. If total > target, decrement right."]$ALGO$::jsonb,
$PY$class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        nums.sort()
        res = []
        n = len(nums)
        for i in range(n - 3):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            for j in range(i + 1, n - 2):
                if j > i + 1 and nums[j] == nums[j - 1]:
                    continue
                left, right = j + 1, n - 1
                while left < right:
                    total = nums[i] + nums[j] + nums[left] + nums[right]
                    if total == target:
                        res.append([nums[i], nums[j], nums[left], nums[right]])
                        while left < right and nums[left] == nums[left + 1]:
                            left += 1
                        while left < right and nums[right] == nums[right - 1]:
                            right -= 1
                        left += 1
                        right -= 1
                    elif total < target:
                        left += 1
                    else:
                        right -= 1
        return res
$PY$,
$JS$var fourSum = function(nums, target) {
    nums.sort((a, b) => a - b);
    const res = [];
    const n = nums.length;
    for (let i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] === nums[j - 1]) continue;
            let left = j + 1, right = n - 1;
            while (left < right) {
                const total = nums[i] + nums[j] + nums[left] + nums[right];
                if (total === target) {
                    res.push([nums[i], nums[j], nums[left], nums[right]]);
                    while (left < right && nums[left] === nums[left + 1]) left++;
                    while (left < right && nums[right] === nums[right - 1]) right--;
                    left++; right--;
                } else if (total < target) left++;
                else right--;
            }
        }
    }
    return res;
};
$JS$,
$JAVA$import java.util.*;

class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int left = j + 1, right = n - 1;
                while (left < right) {
                    long total = (long)nums[i] + nums[j] + nums[left] + nums[right];
                    if (total == target) {
                        res.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                        while (left < right && nums[left] == nums[left + 1]) left++;
                        while (left < right && nums[right] == nums[right - 1]) right--;
                        left++; right--;
                    } else if (total < target) left++;
                    else right--;
                }
            }
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        int n = (int)nums.size();
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int left = j + 1, right = n - 1;
                while (left < right) {
                    long long total = (long long)nums[i] + nums[j] + nums[left] + nums[right];
                    if (total == target) {
                        res.push_back({nums[i], nums[j], nums[left], nums[right]});
                        while (left < right && nums[left] == nums[left + 1]) left++;
                        while (left < right && nums[right] == nums[right - 1]) right--;
                        left++; right--;
                    } else if (total < target) left++;
                    else right--;
                }
            }
        }
        return res;
    }
};
$CPP$,
'O(n^3)', 'O(1)');

COMMIT;
