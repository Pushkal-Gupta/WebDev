-- Grow catalog 400 → 500 batch b3: arrays (5) + binary-search (5) + bit-manipulation (5) = 15 problems
BEGIN;

-- ============ IDEMPOTENT CLEANUP ============
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'majority-element-ii','spiral-matrix-ii','next-permutation-500',
  'minimum-size-subarray-sum','first-missing-positive-500',
  'find-minimum-in-rotated-sorted-array-500','search-in-rotated-sorted-array-ii',
  'find-peak-element-500','median-of-two-sorted-arrays-500','peak-index-in-a-mountain-array',
  'single-number-ii','binary-number-with-alternating-bits','power-of-two-500',
  'bitwise-and-of-numbers-range-500','minimum-flips-to-make-a-or-b-equal-to-c'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'majority-element-ii','spiral-matrix-ii','next-permutation-500',
  'minimum-size-subarray-sum','first-missing-positive-500',
  'find-minimum-in-rotated-sorted-array-500','search-in-rotated-sorted-array-ii',
  'find-peak-element-500','median-of-two-sorted-arrays-500','peak-index-in-a-mountain-array',
  'single-number-ii','binary-number-with-alternating-bits','power-of-two-500',
  'bitwise-and-of-numbers-range-500','minimum-flips-to-make-a-or-b-equal-to-c'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'majority-element-ii','spiral-matrix-ii','next-permutation-500',
  'minimum-size-subarray-sum','first-missing-positive-500',
  'find-minimum-in-rotated-sorted-array-500','search-in-rotated-sorted-array-ii',
  'find-peak-element-500','median-of-two-sorted-arrays-500','peak-index-in-a-mountain-array',
  'single-number-ii','binary-number-with-alternating-bits','power-of-two-500',
  'bitwise-and-of-numbers-range-500','minimum-flips-to-make-a-or-b-equal-to-c'
);

-- ================================================================
-- ARRAYS (1E, 3M, 1H)
-- ================================================================

-- A1) spiral-matrix-ii (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('spiral-matrix-ii','arrays','Spiral Matrix II','Easy',
$$<p>Given a positive integer <code>n</code>, generate an <code>n x n</code> matrix filled with elements from 1 to n^2 in spiral order.</p>$$,
'',ARRAY['Maintain four boundaries: top, bottom, left, right.','Fill top row left-to-right, right column top-to-bottom, bottom row right-to-left, left column bottom-to-top.','Shrink boundaries after each pass.'],
'500','https://leetcode.com/problems/spiral-matrix-ii/',
'generateMatrix','[{"name":"n","type":"int"}]'::jsonb,'List[List[int]]',
'[{"inputs":["3"],"expected":"[[1,2,3],[8,9,4],[7,6,5]]"},{"inputs":["1"],"expected":"[[1]]"},{"inputs":["2"],"expected":"[[1,2],[4,3]]"},{"inputs":["4"],"expected":"[[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('spiral-matrix-ii','python',$PY$class Solution:
    def generateMatrix(self, n: int) -> List[List[int]]:
        $PY$),
('spiral-matrix-ii','javascript',$JS$var generateMatrix = function(n) {

};$JS$),
('spiral-matrix-ii','java',$JAVA$class Solution {
    public int[][] generateMatrix(int n) {

    }
}$JAVA$),
('spiral-matrix-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('spiral-matrix-ii',1,'Layer by Layer',
'Fill the matrix in spiral order by maintaining four boundaries and shrinking them inward after filling each layer.',
'["Initialize an n x n matrix with zeros. Set top=0, bottom=n-1, left=0, right=n-1, num=1.","Fill top row left to right, then top++.","Fill right column top to bottom, then right--.","Fill bottom row right to left, then bottom--.","Fill left column bottom to top, then left++.","Repeat until num > n*n."]'::jsonb,
$PY$class Solution:
    def generateMatrix(self, n: int) -> List[List[int]]:
        matrix = [[0] * n for _ in range(n)]
        top, bottom, left, right = 0, n - 1, 0, n - 1
        num = 1
        while num <= n * n:
            for j in range(left, right + 1):
                matrix[top][j] = num
                num += 1
            top += 1
            for i in range(top, bottom + 1):
                matrix[i][right] = num
                num += 1
            right -= 1
            for j in range(right, left - 1, -1):
                matrix[bottom][j] = num
                num += 1
            bottom -= 1
            for i in range(bottom, top - 1, -1):
                matrix[i][left] = num
                num += 1
            left += 1
        return matrix
$PY$,
$JS$var generateMatrix = function(n) {
    const matrix = Array.from({length: n}, () => new Array(n).fill(0));
    let top = 0, bottom = n - 1, left = 0, right = n - 1, num = 1;
    while (num <= n * n) {
        for (let j = left; j <= right; j++) matrix[top][j] = num++;
        top++;
        for (let i = top; i <= bottom; i++) matrix[i][right] = num++;
        right--;
        for (let j = right; j >= left; j--) matrix[bottom][j] = num++;
        bottom--;
        for (let i = bottom; i >= top; i--) matrix[i][left] = num++;
        left++;
    }
    return matrix;
};
$JS$,
$JAVA$class Solution {
    public int[][] generateMatrix(int n) {
        int[][] matrix = new int[n][n];
        int top = 0, bottom = n - 1, left = 0, right = n - 1, num = 1;
        while (num <= n * n) {
            for (int j = left; j <= right; j++) matrix[top][j] = num++;
            top++;
            for (int i = top; i <= bottom; i++) matrix[i][right] = num++;
            right--;
            for (int j = right; j >= left; j--) matrix[bottom][j] = num++;
            bottom--;
            for (int i = bottom; i >= top; i--) matrix[i][left] = num++;
            left++;
        }
        return matrix;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        vector<vector<int>> matrix(n, vector<int>(n, 0));
        int top = 0, bottom = n - 1, left = 0, right = n - 1, num = 1;
        while (num <= n * n) {
            for (int j = left; j <= right; j++) matrix[top][j] = num++;
            top++;
            for (int i = top; i <= bottom; i++) matrix[i][right] = num++;
            right--;
            for (int j = right; j >= left; j--) matrix[bottom][j] = num++;
            bottom--;
            for (int i = bottom; i >= top; i--) matrix[i][left] = num++;
            left++;
        }
        return matrix;
    }
};
$CPP$,'O(n^2)','O(n^2)');

-- A2) majority-element-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('majority-element-ii','arrays','Majority Element II','Medium',
$$<p>Given an integer array <code>nums</code> of size <code>n</code>, find all elements that appear more than <code>n/3</code> times. Return them in any order.</p>$$,
'',ARRAY['There can be at most 2 elements appearing more than n/3 times.','Use Boyer-Moore voting for two candidates.','Verify the candidates with a second pass.'],
'500','https://leetcode.com/problems/majority-element-ii/',
'majorityElement','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[3,2,3]"],"expected":"[3]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[1,2]"],"expected":"[1,2]"},{"inputs":["[2,2,1,1,1,2,2]"],"expected":"[1,2]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('majority-element-ii','python',$PY$class Solution:
    def majorityElement(self, nums: List[int]) -> List[int]:
        $PY$),
('majority-element-ii','javascript',$JS$var majorityElement = function(nums) {

};$JS$),
('majority-element-ii','java',$JAVA$class Solution {
    public List<Integer> majorityElement(int[] nums) {

    }
}$JAVA$),
('majority-element-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('majority-element-ii',1,'Boyer-Moore Voting',
'Extend Boyer-Moore to track two candidates. Then verify each candidate actually appears more than n/3 times.',
$ALGO$["Initialize two candidates and two counts to 0.","For each num: if it matches a candidate, increment its count. Else if a count is 0, set that candidate. Else decrement both counts.","Second pass: count actual occurrences of each candidate. Include those > n/3."]$ALGO$::jsonb,
$PY$class Solution:
    def majorityElement(self, nums: List[int]) -> List[int]:
        c1 = c2 = None
        cnt1 = cnt2 = 0
        for n in nums:
            if n == c1:
                cnt1 += 1
            elif n == c2:
                cnt2 += 1
            elif cnt1 == 0:
                c1, cnt1 = n, 1
            elif cnt2 == 0:
                c2, cnt2 = n, 1
            else:
                cnt1 -= 1
                cnt2 -= 1
        threshold = len(nums) // 3
        result = []
        if nums.count(c1) > threshold:
            result.append(c1)
        if c2 != c1 and nums.count(c2) > threshold:
            result.append(c2)
        return result
$PY$,
$JS$var majorityElement = function(nums) {
    let c1 = null, c2 = null, cnt1 = 0, cnt2 = 0;
    for (const n of nums) {
        if (n === c1) cnt1++;
        else if (n === c2) cnt2++;
        else if (cnt1 === 0) { c1 = n; cnt1 = 1; }
        else if (cnt2 === 0) { c2 = n; cnt2 = 1; }
        else { cnt1--; cnt2--; }
    }
    const threshold = Math.floor(nums.length / 3);
    const result = [];
    if (nums.filter(x => x === c1).length > threshold) result.push(c1);
    if (c2 !== c1 && nums.filter(x => x === c2).length > threshold) result.push(c2);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> majorityElement(int[] nums) {
        int c1 = 0, c2 = 0, cnt1 = 0, cnt2 = 0;
        for (int n : nums) {
            if (n == c1) cnt1++;
            else if (n == c2) cnt2++;
            else if (cnt1 == 0) { c1 = n; cnt1 = 1; }
            else if (cnt2 == 0) { c2 = n; cnt2 = 1; }
            else { cnt1--; cnt2--; }
        }
        cnt1 = 0; cnt2 = 0;
        for (int n : nums) {
            if (n == c1) cnt1++;
            else if (n == c2) cnt2++;
        }
        List<Integer> result = new ArrayList<>();
        if (cnt1 > nums.length / 3) result.add(c1);
        if (cnt2 > nums.length / 3) result.add(c2);
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {
        int c1 = 0, c2 = 0, cnt1 = 0, cnt2 = 0;
        for (int n : nums) {
            if (n == c1) cnt1++;
            else if (n == c2) cnt2++;
            else if (cnt1 == 0) { c1 = n; cnt1 = 1; }
            else if (cnt2 == 0) { c2 = n; cnt2 = 1; }
            else { cnt1--; cnt2--; }
        }
        cnt1 = 0; cnt2 = 0;
        for (int n : nums) {
            if (n == c1) cnt1++;
            else if (n == c2) cnt2++;
        }
        vector<int> result;
        if (cnt1 > (int)nums.size() / 3) result.push_back(c1);
        if (cnt2 > (int)nums.size() / 3) result.push_back(c2);
        return result;
    }
};
$CPP$,'O(n)','O(1)');

-- A3) next-permutation-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('next-permutation-500','arrays','Next Permutation','Medium',
$$<p>Given an array of integers <code>nums</code>, rearrange it into the lexicographically next greater permutation. If no such permutation exists (the array is in descending order), rearrange to the lowest possible order (ascending). Do it in-place and return the modified array.</p>$$,
'',ARRAY['Find the largest index i where nums[i] < nums[i+1] (the pivot).','Find the largest index j > i where nums[j] > nums[i].','Swap nums[i] and nums[j], then reverse the suffix from i+1.'],
'500','https://leetcode.com/problems/next-permutation/',
'nextPermutation','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[1,2,3]"],"expected":"[1,3,2]"},{"inputs":["[3,2,1]"],"expected":"[1,2,3]"},{"inputs":["[1,1,5]"],"expected":"[1,5,1]"},{"inputs":["[1,3,2]"],"expected":"[2,1,3]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('next-permutation-500','python',$PY$class Solution:
    def nextPermutation(self, nums: List[int]) -> List[int]:
        $PY$),
('next-permutation-500','javascript',$JS$var nextPermutation = function(nums) {

};$JS$),
('next-permutation-500','java',$JAVA$class Solution {
    public int[] nextPermutation(int[] nums) {

    }
}$JAVA$),
('next-permutation-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextPermutation(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('next-permutation-500',1,'Find Pivot + Swap + Reverse',
'Find the rightmost ascent (pivot), swap with the smallest larger element to its right, then reverse the suffix to get the next permutation.',
$ALGO$["Find the largest i where nums[i] < nums[i+1]. If none, reverse entire array.","Find the largest j > i where nums[j] > nums[i].","Swap nums[i] and nums[j].","Reverse nums[i+1:].","Return the modified array."]$ALGO$::jsonb,
$PY$class Solution:
    def nextPermutation(self, nums: List[int]) -> List[int]:
        n = len(nums)
        i = n - 2
        while i >= 0 and nums[i] >= nums[i + 1]:
            i -= 1
        if i >= 0:
            j = n - 1
            while nums[j] <= nums[i]:
                j -= 1
            nums[i], nums[j] = nums[j], nums[i]
        left, right = i + 1, n - 1
        while left < right:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
            right -= 1
        return nums
$PY$,
$JS$var nextPermutation = function(nums) {
    const n = nums.length;
    let i = n - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        let j = n - 1;
        while (nums[j] <= nums[i]) j--;
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    let l = i + 1, r = n - 1;
    while (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
    return nums;
};
$JS$,
$JAVA$class Solution {
    public int[] nextPermutation(int[] nums) {
        int n = nums.length, i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;
        }
        int l = i + 1, r = n - 1;
        while (l < r) { int tmp = nums[l]; nums[l] = nums[r]; nums[r] = tmp; l++; r--; }
        return nums;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> nextPermutation(vector<int>& nums) {
        int n = nums.size(), i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            swap(nums[i], nums[j]);
        }
        reverse(nums.begin() + i + 1, nums.end());
        return nums;
    }
};
$CPP$,'O(n)','O(1)');

-- A4) minimum-size-subarray-sum (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-size-subarray-sum','arrays','Minimum Size Subarray Sum','Medium',
$$<p>Given an array of positive integers <code>nums</code> and a positive integer <code>target</code>, return the minimal length of a subarray whose sum is greater than or equal to <code>target</code>. If there is no such subarray, return <code>0</code>.</p>$$,
'',ARRAY['Use a sliding window approach.','Expand the window by moving the right pointer and adding elements.','Shrink from the left while the window sum >= target, tracking the minimum length.'],
'500','https://leetcode.com/problems/minimum-size-subarray-sum/',
'minSubArrayLen','[{"name":"target","type":"int"},{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["7","[2,3,1,2,4,3]"],"expected":"2"},{"inputs":["4","[1,4,4]"],"expected":"1"},{"inputs":["11","[1,1,1,1,1,1,1,1]"],"expected":"0"},{"inputs":["15","[1,2,3,4,5]"],"expected":"5"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-size-subarray-sum','python',$PY$class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        $PY$),
('minimum-size-subarray-sum','javascript',$JS$var minSubArrayLen = function(target, nums) {

};$JS$),
('minimum-size-subarray-sum','java',$JAVA$class Solution {
    public int minSubArrayLen(int target, int[] nums) {

    }
}$JAVA$),
('minimum-size-subarray-sum','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-size-subarray-sum',1,'Sliding Window',
'Expand right pointer to grow the sum, then shrink left pointer while sum >= target, updating the minimum length.',
$ALGO$["Initialize left = 0, windowSum = 0, minLen = infinity.","For each right from 0 to n-1: add nums[right] to windowSum.","While windowSum >= target: update minLen = min(minLen, right - left + 1), subtract nums[left], left++.","Return minLen if found, else 0."]$ALGO$::jsonb,
$PY$class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        left = 0
        window_sum = 0
        min_len = float('inf')
        for right in range(len(nums)):
            window_sum += nums[right]
            while window_sum >= target:
                min_len = min(min_len, right - left + 1)
                window_sum -= nums[left]
                left += 1
        return min_len if min_len != float('inf') else 0
$PY$,
$JS$var minSubArrayLen = function(target, nums) {
    let left = 0, windowSum = 0, minLen = Infinity;
    for (let right = 0; right < nums.length; right++) {
        windowSum += nums[right];
        while (windowSum >= target) {
            minLen = Math.min(minLen, right - left + 1);
            windowSum -= nums[left++];
        }
    }
    return minLen === Infinity ? 0 : minLen;
};
$JS$,
$JAVA$class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, windowSum = 0, minLen = Integer.MAX_VALUE;
        for (int right = 0; right < nums.length; right++) {
            windowSum += nums[right];
            while (windowSum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                windowSum -= nums[left++];
            }
        }
        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int left = 0, windowSum = 0, minLen = INT_MAX;
        for (int right = 0; right < (int)nums.size(); right++) {
            windowSum += nums[right];
            while (windowSum >= target) {
                minLen = min(minLen, right - left + 1);
                windowSum -= nums[left++];
            }
        }
        return minLen == INT_MAX ? 0 : minLen;
    }
};
$CPP$,'O(n)','O(1)');

-- A5) first-missing-positive-500 (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('first-missing-positive-500','arrays','First Missing Positive','Hard',
$$<p>Given an unsorted integer array <code>nums</code>, return the smallest missing positive integer. You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.</p>$$,
'',ARRAY['The answer must be in [1, n+1] where n is the length of nums.','Use the array itself as a hash map by placing each value v at index v-1.','After rearranging, the first index i where nums[i] != i+1 gives the answer i+1.'],
'500','https://leetcode.com/problems/first-missing-positive/',
'firstMissingPositive','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[1,2,0]"],"expected":"3"},{"inputs":["[3,4,-1,1]"],"expected":"2"},{"inputs":["[7,8,9,11,12]"],"expected":"1"},{"inputs":["[1]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('first-missing-positive-500','python',$PY$class Solution:
    def firstMissingPositive(self, nums: List[int]) -> int:
        $PY$),
('first-missing-positive-500','javascript',$JS$var firstMissingPositive = function(nums) {

};$JS$),
('first-missing-positive-500','java',$JAVA$class Solution {
    public int firstMissingPositive(int[] nums) {

    }
}$JAVA$),
('first-missing-positive-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('first-missing-positive-500',1,'Cyclic Sort',
'Place each number v in the range [1, n] at index v-1. Then scan for the first index where nums[i] != i+1.',
$ALGO$["For each index i, while nums[i] is in [1, n] and nums[i] != nums[nums[i]-1], swap nums[i] with nums[nums[i]-1].","After placement, scan for the first i where nums[i] != i+1.","Return i+1, or n+1 if all are placed correctly."]$ALGO$::jsonb,
$PY$class Solution:
    def firstMissingPositive(self, nums: List[int]) -> int:
        n = len(nums)
        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                nums[nums[i] - 1], nums[i] = nums[i], nums[nums[i] - 1]
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1
$PY$,
$JS$var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const j = nums[i] - 1;
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
    }
    for (let i = 0; i < n; i++) {
        if (nums[i] !== i + 1) return i + 1;
    }
    return n + 1;
};
$JS$,
$JAVA$class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int j = nums[i] - 1;
                int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int n = nums.size();
        for (int i = 0; i < n; i++) {
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                swap(nums[i], nums[nums[i] - 1]);
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
};
$CPP$,'O(n)','O(1)');

-- ================================================================
-- BINARY SEARCH (1E, 3M, 1H)
-- ================================================================

-- BS1) peak-index-in-a-mountain-array (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('peak-index-in-a-mountain-array','binary-search','Peak Index in a Mountain Array','Easy',
$$<p>An array <code>arr</code> is a mountain if arr.length >= 3 and there exists some index <code>i</code> such that arr[0] < ... < arr[i] > ... > arr[arr.length - 1]. Given a mountain array, return the index of the peak element.</p>$$,
'',ARRAY['Binary search: if arr[mid] < arr[mid+1], the peak is to the right.','If arr[mid] > arr[mid+1], the peak is at mid or to the left.','This gives O(log n) instead of O(n).'],
'500','https://leetcode.com/problems/peak-index-in-a-mountain-array/',
'peakIndexInMountainArray','[{"name":"arr","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[0,1,0]"],"expected":"1"},{"inputs":["[0,2,1,0]"],"expected":"1"},{"inputs":["[0,10,5,2]"],"expected":"1"},{"inputs":["[3,4,5,1]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('peak-index-in-a-mountain-array','python',$PY$class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        $PY$),
('peak-index-in-a-mountain-array','javascript',$JS$var peakIndexInMountainArray = function(arr) {

};$JS$),
('peak-index-in-a-mountain-array','java',$JAVA$class Solution {
    public int peakIndexInMountainArray(int[] arr) {

    }
}$JAVA$),
('peak-index-in-a-mountain-array','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int peakIndexInMountainArray(vector<int>& arr) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('peak-index-in-a-mountain-array',1,'Binary Search',
'If arr[mid] < arr[mid+1], the peak must be to the right. Otherwise, mid could be the peak or the peak is to the left.',
$ALGO$["Set lo = 0, hi = len(arr) - 1.","While lo < hi: mid = (lo + hi) // 2.","If arr[mid] < arr[mid+1], lo = mid + 1. Else hi = mid.","Return lo."]$ALGO$::jsonb,
$PY$class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        lo, hi = 0, len(arr) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo
$PY$,
$JS$var peakIndexInMountainArray = function(arr) {
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (arr[mid] < arr[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};
$JS$,
$JAVA$class Solution {
    public int peakIndexInMountainArray(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int peakIndexInMountainArray(vector<int>& arr) {
        int lo = 0, hi = arr.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
$CPP$,'O(log n)','O(1)');

-- BS2) find-minimum-in-rotated-sorted-array-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('find-minimum-in-rotated-sorted-array-500','binary-search','Find Minimum in Rotated Sorted Array','Medium',
$$<p>Given a sorted rotated array of unique elements <code>nums</code>, return the minimum element. You must write an algorithm that runs in O(log n) time.</p>$$,
'',ARRAY['Binary search: compare mid with right boundary.','If nums[mid] > nums[right], the minimum is in the right half.','Otherwise, the minimum is in the left half including mid.'],
'500','https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
'findMin','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[3,4,5,1,2]"],"expected":"1"},{"inputs":["[4,5,6,7,0,1,2]"],"expected":"0"},{"inputs":["[11,13,15,17]"],"expected":"11"},{"inputs":["[2,1]"],"expected":"1"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('find-minimum-in-rotated-sorted-array-500','python',$PY$class Solution:
    def findMin(self, nums: List[int]) -> int:
        $PY$),
('find-minimum-in-rotated-sorted-array-500','javascript',$JS$var findMin = function(nums) {

};$JS$),
('find-minimum-in-rotated-sorted-array-500','java',$JAVA$class Solution {
    public int findMin(int[] nums) {

    }
}$JAVA$),
('find-minimum-in-rotated-sorted-array-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMin(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('find-minimum-in-rotated-sorted-array-500',1,'Binary Search',
'Compare nums[mid] with nums[hi]. If mid > hi, the rotation point (minimum) is in the right half. Otherwise it is in the left half including mid.',
$ALGO$["Set lo = 0, hi = len(nums) - 1.","While lo < hi: mid = (lo + hi) // 2.","If nums[mid] > nums[hi], lo = mid + 1. Else hi = mid.","Return nums[lo]."]$ALGO$::jsonb,
$PY$class Solution:
    def findMin(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] > nums[hi]:
                lo = mid + 1
            else:
                hi = mid
        return nums[lo]
$PY$,
$JS$var findMin = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
};
$JS$,
$JAVA$class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findMin(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
};
$CPP$,'O(log n)','O(1)');

-- BS3) search-in-rotated-sorted-array-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('search-in-rotated-sorted-array-ii','binary-search','Search in Rotated Sorted Array II','Medium',
$$<p>There is an integer array <code>nums</code> sorted in non-decreasing order (with possible duplicates). It is rotated at an unknown pivot. Given <code>target</code>, return <code>true</code> if target is in <code>nums</code>, or <code>false</code> otherwise.</p>$$,
'',ARRAY['Similar to Search in Rotated Sorted Array, but duplicates complicate things.','When nums[lo] == nums[mid] == nums[hi], you cannot determine which half is sorted — just shrink both ends.','Otherwise, determine the sorted half and check if target lies in it.'],
'500','https://leetcode.com/problems/search-in-rotated-sorted-array-ii/',
'search','[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,'bool',
'[{"inputs":["[2,5,6,0,0,1,2]","0"],"expected":"true"},{"inputs":["[2,5,6,0,0,1,2]","3"],"expected":"false"},{"inputs":["[1,0,1,1,1]","0"],"expected":"true"},{"inputs":["[1,1,1,1,1]","2"],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('search-in-rotated-sorted-array-ii','python',$PY$class Solution:
    def search(self, nums: List[int], target: int) -> bool:
        $PY$),
('search-in-rotated-sorted-array-ii','javascript',$JS$var search = function(nums, target) {

};$JS$),
('search-in-rotated-sorted-array-ii','java',$JAVA$class Solution {
    public boolean search(int[] nums, int target) {

    }
}$JAVA$),
('search-in-rotated-sorted-array-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool search(vector<int>& nums, int target) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('search-in-rotated-sorted-array-ii',1,'Modified Binary Search',
'Handle the ambiguous case (nums[lo] == nums[mid] == nums[hi]) by incrementing lo and decrementing hi. Otherwise, use standard rotated array binary search.',
$ALGO$["Set lo = 0, hi = n - 1.","While lo <= hi: mid = (lo + hi) // 2. If nums[mid] == target, return true.","If nums[lo] == nums[mid] == nums[hi], lo++, hi-- (cannot determine sorted half).","Else if left half is sorted (nums[lo] <= nums[mid]): check if target is in [lo, mid), adjust pointers.","Else right half is sorted: check if target is in (mid, hi], adjust pointers.","Return false."]$ALGO$::jsonb,
$PY$class Solution:
    def search(self, nums: List[int], target: int) -> bool:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return True
            if nums[lo] == nums[mid] == nums[hi]:
                lo += 1
                hi -= 1
            elif nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return False
$PY$,
$JS$var search = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] === target) return true;
        if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; }
        else if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool search(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
};
$CPP$,'O(n) worst, O(log n) avg','O(1)');

-- BS4) find-peak-element-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('find-peak-element-500','binary-search','Find Peak Element','Medium',
$$<p>A peak element is an element that is strictly greater than its neighbors. Given an integer array <code>nums</code>, find a peak element and return its index. If the array contains multiple peaks, return the index of any one.</p><p>You may imagine that <code>nums[-1] = nums[n] = -infinity</code>.</p>$$,
'',ARRAY['Binary search works because if nums[mid] < nums[mid+1], there must be a peak to the right.','If nums[mid] > nums[mid+1], there must be a peak at mid or to the left.','This guarantees O(log n) time.'],
'500','https://leetcode.com/problems/find-peak-element/',
'findPeakElement','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[1,2,3,1]"],"expected":"2"},{"inputs":["[1,2,1,3,5,6,4]"],"expected":"5"},{"inputs":["[1]"],"expected":"0"},{"inputs":["[3,2,1]"],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('find-peak-element-500','python',$PY$class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        $PY$),
('find-peak-element-500','javascript',$JS$var findPeakElement = function(nums) {

};$JS$),
('find-peak-element-500','java',$JAVA$class Solution {
    public int findPeakElement(int[] nums) {

    }
}$JAVA$),
('find-peak-element-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findPeakElement(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('find-peak-element-500',1,'Binary Search',
'Move toward the ascending direction. If nums[mid] < nums[mid+1], peak is to the right; otherwise it is at mid or to the left.',
$ALGO$["Set lo = 0, hi = len(nums) - 1.","While lo < hi: mid = (lo + hi) // 2.","If nums[mid] < nums[mid+1], lo = mid + 1. Else hi = mid.","Return lo."]$ALGO$::jsonb,
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
        const mid = Math.floor((lo + hi) / 2);
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
            int mid = (lo + hi) / 2;
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
$CPP$,'O(log n)','O(1)');

-- BS5) median-of-two-sorted-arrays-500 (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('median-of-two-sorted-arrays-500','binary-search','Median of Two Sorted Arrays','Hard',
$$<p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code> respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).</p>$$,
'',ARRAY['Binary search on the smaller array to find the correct partition.','Partition both arrays such that left elements <= right elements.','The median comes from the max of lefts and min of rights.'],
'500','https://leetcode.com/problems/median-of-two-sorted-arrays/',
'findMedianSortedArrays','[{"name":"nums1","type":"List[int]"},{"name":"nums2","type":"List[int]"}]'::jsonb,'float',
'[{"inputs":["[1,3]","[2]"],"expected":"2.0"},{"inputs":["[1,2]","[3,4]"],"expected":"2.5"},{"inputs":["[0,0]","[0,0]"],"expected":"0.0"},{"inputs":["[]","[1]"],"expected":"1.0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('median-of-two-sorted-arrays-500','python',$PY$class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        $PY$),
('median-of-two-sorted-arrays-500','javascript',$JS$var findMedianSortedArrays = function(nums1, nums2) {

};$JS$),
('median-of-two-sorted-arrays-500','java',$JAVA$class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {

    }
}$JAVA$),
('median-of-two-sorted-arrays-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('median-of-two-sorted-arrays-500',1,'Binary Search on Partition',
'Binary search on the shorter array to find where to partition both arrays into equal halves. The median is determined by the boundary elements.',
$ALGO$["Ensure nums1 is the shorter array.","Binary search on nums1 with lo=0, hi=m. For each partition i in nums1, j = (m+n+1)/2 - i in nums2.","Check if maxLeft1 <= minRight2 and maxLeft2 <= minRight1.","If total length is odd, median = max(maxLeft1, maxLeft2). If even, median = (max(lefts) + min(rights)) / 2."]$ALGO$::jsonb,
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
        const i = Math.floor((lo + hi) / 2);
        const j = Math.floor((m + n + 1) / 2) - i;
        const left1 = i > 0 ? nums1[i-1] : -Infinity;
        const right1 = i < m ? nums1[i] : Infinity;
        const left2 = j > 0 ? nums2[j-1] : -Infinity;
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
        if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.length, n = nums2.length, lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2, j = (m + n + 1) / 2 - i;
            int left1 = i > 0 ? nums1[i-1] : Integer.MIN_VALUE;
            int right1 = i < m ? nums1[i] : Integer.MAX_VALUE;
            int left2 = j > 0 ? nums2[j-1] : Integer.MIN_VALUE;
            int right2 = j < n ? nums2[j] : Integer.MAX_VALUE;
            if (left1 <= right2 && left2 <= right1) {
                if ((m + n) % 2 == 1) return Math.max(left1, left2);
                return (Math.max(left1, left2) + Math.min(right1, right2)) / 2.0;
            } else if (left1 > right2) hi = i - 1;
            else lo = i + 1;
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.size(), n = nums2.size(), lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2, j = (m + n + 1) / 2 - i;
            int left1 = i > 0 ? nums1[i-1] : INT_MIN;
            int right1 = i < m ? nums1[i] : INT_MAX;
            int left2 = j > 0 ? nums2[j-1] : INT_MIN;
            int right2 = j < n ? nums2[j] : INT_MAX;
            if (left1 <= right2 && left2 <= right1) {
                if ((m + n) % 2 == 1) return max(left1, left2);
                return (max(left1, left2) + min(right1, right2)) / 2.0;
            } else if (left1 > right2) hi = i - 1;
            else lo = i + 1;
        }
        return 0;
    }
};
$CPP$,'O(log(min(m,n)))','O(1)');

-- ================================================================
-- BIT MANIPULATION (2E, 2M, 1H)
-- ================================================================

-- BM1) power-of-two-500 (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('power-of-two-500','bit-manipulation','Power of Two','Easy',
$$<p>Given an integer <code>n</code>, return <code>true</code> if it is a power of two, or <code>false</code> otherwise. An integer <code>n</code> is a power of two if there exists an integer <code>x</code> such that <code>n == 2^x</code>.</p>$$,
'',ARRAY['A power of two in binary has exactly one 1-bit.','n & (n-1) clears the lowest set bit.','If n > 0 and n & (n-1) == 0, it is a power of two.'],
'500','https://leetcode.com/problems/power-of-two/',
'isPowerOfTwo','[{"name":"n","type":"int"}]'::jsonb,'bool',
'[{"inputs":["1"],"expected":"true"},{"inputs":["16"],"expected":"true"},{"inputs":["3"],"expected":"false"},{"inputs":["0"],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('power-of-two-500','python',$PY$class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        $PY$),
('power-of-two-500','javascript',$JS$var isPowerOfTwo = function(n) {

};$JS$),
('power-of-two-500','java',$JAVA$class Solution {
    public boolean isPowerOfTwo(int n) {

    }
}$JAVA$),
('power-of-two-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPowerOfTwo(int n) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('power-of-two-500',1,'Bit Manipulation',
'A power of two has exactly one set bit. The expression n & (n-1) clears the lowest set bit, so for powers of two it becomes zero.',
$ALGO$["Check n > 0 and n & (n - 1) == 0.","Return true if both conditions hold."]$ALGO$::jsonb,
$PY$class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and (n & (n - 1)) == 0
$PY$,
$JS$var isPowerOfTwo = function(n) {
    return n > 0 && (n & (n - 1)) === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};
$CPP$,'O(1)','O(1)');

-- BM2) binary-number-with-alternating-bits (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('binary-number-with-alternating-bits','bit-manipulation','Binary Number with Alternating Bits','Easy',
$$<p>Given a positive integer <code>n</code>, check whether it has alternating bits: namely, if two adjacent bits will always have different values.</p>$$,
'',ARRAY['XOR n with n>>1. If bits alternate, the result should be all 1s.','Check if the result is of the form 2^k - 1.','Use the n & (n+1) == 0 trick on the XOR result.'],
'500','https://leetcode.com/problems/binary-number-with-alternating-bits/',
'hasAlternatingBits','[{"name":"n","type":"int"}]'::jsonb,'bool',
'[{"inputs":["5"],"expected":"true"},{"inputs":["7"],"expected":"false"},{"inputs":["11"],"expected":"false"},{"inputs":["10"],"expected":"true"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('binary-number-with-alternating-bits','python',$PY$class Solution:
    def hasAlternatingBits(self, n: int) -> bool:
        $PY$),
('binary-number-with-alternating-bits','javascript',$JS$var hasAlternatingBits = function(n) {

};$JS$),
('binary-number-with-alternating-bits','java',$JAVA$class Solution {
    public boolean hasAlternatingBits(int n) {

    }
}$JAVA$),
('binary-number-with-alternating-bits','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasAlternatingBits(int n) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('binary-number-with-alternating-bits',1,'XOR Trick',
'XOR n with n shifted right by 1. If bits alternate, the result is all 1s (like 0111...1). Check this with x & (x+1) == 0.',
$ALGO$["Compute x = n XOR (n >> 1).","Check if x & (x + 1) == 0 — this verifies x is all 1s in binary."]$ALGO$::jsonb,
$PY$class Solution:
    def hasAlternatingBits(self, n: int) -> bool:
        x = n ^ (n >> 1)
        return (x & (x + 1)) == 0
$PY$,
$JS$var hasAlternatingBits = function(n) {
    const x = n ^ (n >> 1);
    return (x & (x + 1)) === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean hasAlternatingBits(int n) {
        int x = n ^ (n >> 1);
        return (x & (x + 1)) == 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool hasAlternatingBits(int n) {
        long x = n ^ (n >> 1);
        return (x & (x + 1)) == 0;
    }
};
$CPP$,'O(1)','O(1)');

-- BM3) single-number-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('single-number-ii','bit-manipulation','Single Number II','Medium',
$$<p>Given an integer array <code>nums</code> where every element appears exactly three times except for one element which appears exactly once. Find the single element and return it. You must implement a solution with O(1) extra memory.</p>$$,
'',ARRAY['Count bits at each position modulo 3.','Use two variables (ones, twos) to track bit counts mod 3.','After processing all numbers, ones holds the single number.'],
'500','https://leetcode.com/problems/single-number-ii/',
'singleNumber','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[2,2,3,2]"],"expected":"3"},{"inputs":["[0,1,0,1,0,1,99]"],"expected":"99"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[5,5,5,3]"],"expected":"3"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('single-number-ii','python',$PY$class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        $PY$),
('single-number-ii','javascript',$JS$var singleNumber = function(nums) {

};$JS$),
('single-number-ii','java',$JAVA$class Solution {
    public int singleNumber(int[] nums) {

    }
}$JAVA$),
('single-number-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int singleNumber(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('single-number-ii',1,'Bitwise State Machine',
'Track bit counts modulo 3 using two variables: ones and twos. For each number, update ones and twos, then clear bits that appear in both (meaning count reached 3).',
$ALGO$["Initialize ones = 0, twos = 0.","For each num: ones = (ones XOR num) AND (NOT twos). twos = (twos XOR num) AND (NOT ones).","After all nums, ones holds the single number."]$ALGO$::jsonb,
$PY$class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        ones = twos = 0
        for num in nums:
            ones = (ones ^ num) & ~twos
            twos = (twos ^ num) & ~ones
        return ones
$PY$,
$JS$var singleNumber = function(nums) {
    let ones = 0, twos = 0;
    for (const num of nums) {
        ones = (ones ^ num) & ~twos;
        twos = (twos ^ num) & ~ones;
    }
    return ones;
};
$JS$,
$JAVA$class Solution {
    public int singleNumber(int[] nums) {
        int ones = 0, twos = 0;
        for (int num : nums) {
            ones = (ones ^ num) & ~twos;
            twos = (twos ^ num) & ~ones;
        }
        return ones;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int ones = 0, twos = 0;
        for (int num : nums) {
            ones = (ones ^ num) & ~twos;
            twos = (twos ^ num) & ~ones;
        }
        return ones;
    }
};
$CPP$,'O(n)','O(1)');

-- BM4) bitwise-and-of-numbers-range-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('bitwise-and-of-numbers-range-500','bit-manipulation','Bitwise AND of Numbers Range','Medium',
$$<p>Given two integers <code>left</code> and <code>right</code> that represent the range <code>[left, right]</code>, return the bitwise AND of all numbers in this range, inclusive.</p>$$,
'',ARRAY['The result is the common prefix of left and right in binary.','Shift both numbers right until they are equal, counting shifts.','Shift the common prefix back left by the count.'],
'500','https://leetcode.com/problems/bitwise-and-of-numbers-range/',
'rangeBitwiseAnd','[{"name":"left","type":"int"},{"name":"right","type":"int"}]'::jsonb,'int',
'[{"inputs":["5","7"],"expected":"4"},{"inputs":["0","0"],"expected":"0"},{"inputs":["1","2147483647"],"expected":"0"},{"inputs":["5","5"],"expected":"5"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('bitwise-and-of-numbers-range-500','python',$PY$class Solution:
    def rangeBitwiseAnd(self, left: int, right: int) -> int:
        $PY$),
('bitwise-and-of-numbers-range-500','javascript',$JS$var rangeBitwiseAnd = function(left, right) {

};$JS$),
('bitwise-and-of-numbers-range-500','java',$JAVA$class Solution {
    public int rangeBitwiseAnd(int left, int right) {

    }
}$JAVA$),
('bitwise-and-of-numbers-range-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('bitwise-and-of-numbers-range-500',1,'Common Prefix',
'The AND of a range zeros out all bits that differ between left and right. Find the common binary prefix by right-shifting both until they match.',
$ALGO$["Initialize shift = 0.","While left != right: right-shift both left and right by 1, increment shift.","Return left << shift (the common prefix shifted back)."]$ALGO$::jsonb,
$PY$class Solution:
    def rangeBitwiseAnd(self, left: int, right: int) -> int:
        shift = 0
        while left != right:
            left >>= 1
            right >>= 1
            shift += 1
        return left << shift
$PY$,
$JS$var rangeBitwiseAnd = function(left, right) {
    let shift = 0;
    while (left !== right) { left >>= 1; right >>= 1; shift++; }
    return left << shift;
};
$JS$,
$JAVA$class Solution {
    public int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) { left >>= 1; right >>= 1; shift++; }
        return left << shift;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) { left >>= 1; right >>= 1; shift++; }
        return left << shift;
    }
};
$CPP$,'O(log n)','O(1)');

-- BM5) minimum-flips-to-make-a-or-b-equal-to-c (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-flips-to-make-a-or-b-equal-to-c','bit-manipulation','Minimum Flips to Make a OR b Equal to c','Hard',
$$<p>Given three positive numbers <code>a</code>, <code>b</code>, and <code>c</code>, return the minimum number of flips required in some bits of <code>a</code> and <code>b</code> to make <code>(a OR b == c)</code>. A flip means changing a bit from 0 to 1 or from 1 to 0.</p>$$,
'',ARRAY['Process bit by bit from LSB to MSB.','If the c bit is 0, both a and b bits must be 0 (each 1-bit is a flip).','If the c bit is 1, at least one of a or b must be 1 (if both are 0, one flip needed).'],
'500','https://leetcode.com/problems/minimum-flips-to-make-a-or-b-equal-to-c/',
'minFlips','[{"name":"a","type":"int"},{"name":"b","type":"int"},{"name":"c","type":"int"}]'::jsonb,'int',
'[{"inputs":["2","6","5"],"expected":"3"},{"inputs":["4","2","7"],"expected":"1"},{"inputs":["1","2","3"],"expected":"0"},{"inputs":["8","3","5"],"expected":"3"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-flips-to-make-a-or-b-equal-to-c','python',$PY$class Solution:
    def minFlips(self, a: int, b: int, c: int) -> int:
        $PY$),
('minimum-flips-to-make-a-or-b-equal-to-c','javascript',$JS$var minFlips = function(a, b, c) {

};$JS$),
('minimum-flips-to-make-a-or-b-equal-to-c','java',$JAVA$class Solution {
    public int minFlips(int a, int b, int c) {

    }
}$JAVA$),
('minimum-flips-to-make-a-or-b-equal-to-c','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFlips(int a, int b, int c) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-flips-to-make-a-or-b-equal-to-c',1,'Bit-by-Bit',
'Check each bit position. If c bit is 1, we need at least one of a or b to be 1. If c bit is 0, both a and b must be 0.',
$ALGO$["Initialize flips = 0.","While a > 0 or b > 0 or c > 0: extract LSBs of a, b, c.","If c_bit == 1 and a_bit == 0 and b_bit == 0: flips += 1.","If c_bit == 0: flips += a_bit + b_bit (each set bit needs a flip).","Right-shift a, b, c. Return flips."]$ALGO$::jsonb,
$PY$class Solution:
    def minFlips(self, a: int, b: int, c: int) -> int:
        flips = 0
        while a or b or c:
            a_bit, b_bit, c_bit = a & 1, b & 1, c & 1
            if c_bit == 1:
                if a_bit == 0 and b_bit == 0:
                    flips += 1
            else:
                flips += a_bit + b_bit
            a >>= 1
            b >>= 1
            c >>= 1
        return flips
$PY$,
$JS$var minFlips = function(a, b, c) {
    let flips = 0;
    while (a || b || c) {
        const ab = a & 1, bb = b & 1, cb = c & 1;
        if (cb === 1) { if (ab === 0 && bb === 0) flips++; }
        else flips += ab + bb;
        a >>= 1; b >>= 1; c >>= 1;
    }
    return flips;
};
$JS$,
$JAVA$class Solution {
    public int minFlips(int a, int b, int c) {
        int flips = 0;
        while (a > 0 || b > 0 || c > 0) {
            int ab = a & 1, bb = b & 1, cb = c & 1;
            if (cb == 1) { if (ab == 0 && bb == 0) flips++; }
            else flips += ab + bb;
            a >>= 1; b >>= 1; c >>= 1;
        }
        return flips;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minFlips(int a, int b, int c) {
        int flips = 0;
        while (a || b || c) {
            int ab = a & 1, bb = b & 1, cb = c & 1;
            if (cb == 1) { if (ab == 0 && bb == 0) flips++; }
            else flips += ab + bb;
            a >>= 1; b >>= 1; c >>= 1;
        }
        return flips;
    }
};
$CPP$,'O(max(log a, log b, log c))','O(1)');

COMMIT;
