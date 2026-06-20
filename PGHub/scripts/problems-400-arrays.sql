-- Grow catalog 300 → 400: arrays topic (+6 problems).
-- Each problem ships with metadata + test cases + 4-language starter templates
-- + one reference approach with Python/JS/Java/C++ code and complexity.
BEGIN;

-- Idempotent: drop any prior rows for these IDs so the file can be re-applied.
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'find-all-numbers-disappeared-in-an-array','find-all-duplicates-in-an-array',
  'product-of-array-except-self','game-of-life','next-permutation','first-missing-positive'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'find-all-numbers-disappeared-in-an-array','find-all-duplicates-in-an-array',
  'product-of-array-except-self','game-of-life','next-permutation','first-missing-positive'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'find-all-numbers-disappeared-in-an-array','find-all-duplicates-in-an-array',
  'product-of-array-except-self','game-of-life','next-permutation','first-missing-positive'
);

-- ============================================================
-- 1) find-all-numbers-disappeared-in-an-array (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-all-numbers-disappeared-in-an-array', 'arrays', 'Find All Numbers Disappeared in an Array', 'Easy',
$$<p>Given an array <code>nums</code> of <code>n</code> integers where <code>nums[i]</code> is in the range <code>[1, n]</code>, return an array of all the integers in the range <code>[1, n]</code> that do not appear in <code>nums</code>.</p><p>Can you do it without extra space (aside from the output) and in O(n) time?</p>$$,
'', ARRAY[
  'Use the array itself as a hash map: for each number, mark the index (number - 1) as visited.',
  'You can mark by negating the value at that index.',
  'After one pass, indices still holding positive values correspond to missing numbers.'
], '400', 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/',
'findDisappearedNumbers',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[4,3,2,7,8,2,3,1]"],"expected":"[5,6]"},
  {"inputs":["[1,1]"],"expected":"[2]"},
  {"inputs":["[1,2,3,4]"],"expected":"[]"},
  {"inputs":["[2,2,2,2]"],"expected":"[1,3,4]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-all-numbers-disappeared-in-an-array', 'python',
$PY$class Solution:
    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:
        $PY$),
('find-all-numbers-disappeared-in-an-array', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var findDisappearedNumbers = function(nums) {

};$JS$),
('find-all-numbers-disappeared-in-an-array', 'java',
$JAVA$import java.util.*;

class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {

    }
}$JAVA$),
('find-all-numbers-disappeared-in-an-array', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findDisappearedNumbers(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-all-numbers-disappeared-in-an-array', 1, 'Index Marking',
'Since values are in [1, n], use each value to index into the array and negate the element there. After processing, positive entries reveal the missing numbers.',
$ALGO$["For each num in nums: idx = abs(num) - 1. If nums[idx] > 0, negate it.","Iterate from 0 to n-1: if nums[i] > 0, then i+1 is missing.","Collect and return all missing numbers."]$ALGO$::jsonb,
$PY$class Solution:
    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:
        for num in nums:
            idx = abs(num) - 1
            if nums[idx] > 0:
                nums[idx] = -nums[idx]
        return [i + 1 for i in range(len(nums)) if nums[i] > 0]
$PY$,
$JS$var findDisappearedNumbers = function(nums) {
    for (const num of nums) {
        const idx = Math.abs(num) - 1;
        if (nums[idx] > 0) nums[idx] = -nums[idx];
    }
    const res = [];
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] > 0) res.push(i + 1);
    }
    return res;
};
$JS$,
$JAVA$import java.util.*;

class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {
        for (int num : nums) {
            int idx = Math.abs(num) - 1;
            if (nums[idx] > 0) nums[idx] = -nums[idx];
        }
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] > 0) res.add(i + 1);
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> findDisappearedNumbers(vector<int>& nums) {
        for (int num : nums) {
            int idx = abs(num) - 1;
            if (nums[idx] > 0) nums[idx] = -nums[idx];
        }
        vector<int> res;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (nums[i] > 0) res.push_back(i + 1);
        }
        return res;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 2) find-all-duplicates-in-an-array (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-all-duplicates-in-an-array', 'arrays', 'Find All Duplicates in an Array', 'Easy',
$$<p>Given an integer array <code>nums</code> of length <code>n</code> where all integers are in the range <code>[1, n]</code> and each integer appears <strong>once</strong> or <strong>twice</strong>, return an array of all integers that appear twice.</p><p>You must write an algorithm that runs in O(n) time and uses only constant extra space.</p>$$,
'', ARRAY[
  'Similar to Find All Numbers Disappeared: use the value as an index and negate.',
  'If the value at that index is already negative, the number is a duplicate.',
  'This works because each number maps to a unique index in [0, n-1].'
], '400', 'https://leetcode.com/problems/find-all-duplicates-in-an-array/',
'findDuplicates',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[4,3,2,7,8,2,3,1]"],"expected":"[2,3]"},
  {"inputs":["[1,1,2]"],"expected":"[1]"},
  {"inputs":["[1]"],"expected":"[]"},
  {"inputs":["[2,1,3,3,2,4]"],"expected":"[3,2]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-all-duplicates-in-an-array', 'python',
$PY$class Solution:
    def findDuplicates(self, nums: List[int]) -> List[int]:
        $PY$),
('find-all-duplicates-in-an-array', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var findDuplicates = function(nums) {

};$JS$),
('find-all-duplicates-in-an-array', 'java',
$JAVA$import java.util.*;

class Solution {
    public List<Integer> findDuplicates(int[] nums) {

    }
}$JAVA$),
('find-all-duplicates-in-an-array', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-all-duplicates-in-an-array', 1, 'Index Marking',
'Use the value as an index. If the element at that index is already negative, the current value is a duplicate. Otherwise negate it to mark as seen.',
$ALGO$["Initialize an empty result list.","For each num in nums: idx = abs(num) - 1.","If nums[idx] < 0, append abs(num) to result (it is a duplicate). Otherwise negate nums[idx].","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def findDuplicates(self, nums: List[int]) -> List[int]:
        res = []
        for num in nums:
            idx = abs(num) - 1
            if nums[idx] < 0:
                res.append(abs(num))
            else:
                nums[idx] = -nums[idx]
        return res
$PY$,
$JS$var findDuplicates = function(nums) {
    const res = [];
    for (const num of nums) {
        const idx = Math.abs(num) - 1;
        if (nums[idx] < 0) res.push(Math.abs(num));
        else nums[idx] = -nums[idx];
    }
    return res;
};
$JS$,
$JAVA$import java.util.*;

class Solution {
    public List<Integer> findDuplicates(int[] nums) {
        List<Integer> res = new ArrayList<>();
        for (int num : nums) {
            int idx = Math.abs(num) - 1;
            if (nums[idx] < 0) res.add(Math.abs(num));
            else nums[idx] = -nums[idx];
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {
        vector<int> res;
        for (int num : nums) {
            int idx = abs(num) - 1;
            if (nums[idx] < 0) res.push_back(abs(num));
            else nums[idx] = -nums[idx];
        }
        return res;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 3) product-of-array-except-self (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('product-of-array-except-self', 'arrays', 'Product of Array Except Self', 'Medium',
$$<p>Given an integer array <code>nums</code>, return an array <code>answer</code> such that <code>answer[i]</code> is equal to the product of all the elements of <code>nums</code> except <code>nums[i]</code>.</p><p>The product of any prefix or suffix of <code>nums</code> is guaranteed to fit in a 32-bit integer.</p><p>You must write an algorithm that runs in O(n) time and <strong>without using the division operation</strong>.</p>$$,
'', ARRAY[
  'For each index, the answer is the product of everything to its left times everything to its right.',
  'Build a prefix product array and a suffix product array, then multiply them element-wise.',
  'You can reduce space by computing prefix products in the output array, then doing a reverse pass with a running suffix product.'
], '400', 'https://leetcode.com/problems/product-of-array-except-self/',
'productExceptSelf',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,2,3,4]"],"expected":"[24,12,8,6]"},
  {"inputs":["[-1,1,0,-3,3]"],"expected":"[0,0,9,0,0]"},
  {"inputs":["[2,3]"],"expected":"[3,2]"},
  {"inputs":["[1,1,1,1]"],"expected":"[1,1,1,1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('product-of-array-except-self', 'python',
$PY$class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        $PY$),
('product-of-array-except-self', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {

};$JS$),
('product-of-array-except-self', 'java',
$JAVA$class Solution {
    public int[] productExceptSelf(int[] nums) {

    }
}$JAVA$),
('product-of-array-except-self', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('product-of-array-except-self', 1, 'Prefix and Suffix Products',
'For each position, multiply the running product of all elements to its left by the running product of all elements to its right. Two passes suffice: left-to-right to fill prefix products, then right-to-left to multiply in suffix products.',
$ALGO$["Create result array of size n, filled with 1.","Left pass: maintain prefix = 1. For i = 0..n-1: result[i] = prefix; prefix *= nums[i].","Right pass: maintain suffix = 1. For i = n-1..0: result[i] *= suffix; suffix *= nums[i].","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [1] * n
        prefix = 1
        for i in range(n):
            result[i] = prefix
            prefix *= nums[i]
        suffix = 1
        for i in range(n - 1, -1, -1):
            result[i] *= suffix
            suffix *= nums[i]
        return result
$PY$,
$JS$var productExceptSelf = function(nums) {
    const n = nums.length;
    const result = new Array(n).fill(1);
    let prefix = 1;
    for (let i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        result[0] = 1;
        for (int i = 1; i < n; i++) result[i] = result[i - 1] * nums[i - 1];
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= nums[i];
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = (int)nums.size();
        vector<int> result(n, 1);
        int prefix = 1;
        for (int i = 0; i < n; i++) {
            result[i] = prefix;
            prefix *= nums[i];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= nums[i];
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) game-of-life (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('game-of-life', 'arrays', 'Game of Life', 'Medium',
$$<p>The board is made up of an <code>m x n</code> grid of cells, where each cell has a current state: live (1) or dead (0). Each cell interacts with its eight neighbors. The next state is determined simultaneously for every cell:</p><ul><li>Any live cell with fewer than two live neighbors dies (under-population).</li><li>Any live cell with two or three live neighbors lives on.</li><li>Any live cell with more than three live neighbors dies (over-population).</li><li>Any dead cell with exactly three live neighbors becomes a live cell (reproduction).</li></ul><p>Given the current state of the board, update it to its next state <strong>in-place</strong>.</p>$$,
'', ARRAY[
  'Use intermediate states to encode transitions so that the original value is not lost when neighbors read it.',
  'For example, 2 means was-alive-now-dead, 3 means was-dead-now-alive. Original alive = value % 2 == 1.',
  'After computing all transitions, convert 2 -> 0 and 3 -> 1 in a second pass.'
], '400', 'https://leetcode.com/problems/game-of-life/',
'gameOfLife',
'[{"name":"board","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]"],"expected":"[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]"},
  {"inputs":["[[1,1],[1,0]]"],"expected":"[[1,1],[1,1]]"},
  {"inputs":["[[0,0,0],[0,0,0],[0,0,0]]"],"expected":"[[0,0,0],[0,0,0],[0,0,0]]"},
  {"inputs":["[[1]]"],"expected":"[[0]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('game-of-life', 'python',
$PY$class Solution:
    def gameOfLife(self, board: List[List[int]]) -> List[List[int]]:
        $PY$),
('game-of-life', 'javascript',
$JS$/**
 * @param {number[][]} board
 * @return {number[][]}
 */
var gameOfLife = function(board) {

};$JS$),
('game-of-life', 'java',
$JAVA$class Solution {
    public int[][] gameOfLife(int[][] board) {
        return board;
    }
}$JAVA$),
('game-of-life', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> gameOfLife(vector<vector<int>>& board) {
        return board;
    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('game-of-life', 1, 'In-Place with State Encoding',
'Encode transitions as intermediate states (2 = was alive now dead, 3 = was dead now alive) so neighbors can still read the original value via value % 2. A second pass finalises the board.',
$ALGO$["For each cell, count live neighbors using value % 2 to read original state.","If cell is alive and live neighbors < 2 or > 3, mark cell as 2 (dying).","If cell is dead and live neighbors == 3, mark cell as 3 (becoming alive).","Second pass: replace 2 with 0 and 3 with 1.","Return the modified board."]$ALGO$::jsonb,
$PY$class Solution:
    def gameOfLife(self, board: List[List[int]]) -> List[List[int]]:
        m, n = len(board), len(board[0])
        for r in range(m):
            for c in range(n):
                live = 0
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        if dr == 0 and dc == 0:
                            continue
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < m and 0 <= nc < n and board[nr][nc] % 2 == 1:
                            live += 1
                if board[r][c] == 1 and (live < 2 or live > 3):
                    board[r][c] = 2
                elif board[r][c] == 0 and live == 3:
                    board[r][c] = 3
        for r in range(m):
            for c in range(n):
                if board[r][c] == 2:
                    board[r][c] = 0
                elif board[r][c] == 3:
                    board[r][c] = 1
        return board
$PY$,
$JS$var gameOfLife = function(board) {
    const m = board.length, n = board[0].length;
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            let live = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] % 2 === 1) live++;
                }
            }
            if (board[r][c] === 1 && (live < 2 || live > 3)) board[r][c] = 2;
            else if (board[r][c] === 0 && live === 3) board[r][c] = 3;
        }
    }
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            if (board[r][c] === 2) board[r][c] = 0;
            else if (board[r][c] === 3) board[r][c] = 1;
        }
    }
    return board;
};
$JS$,
$JAVA$class Solution {
    public int[][] gameOfLife(int[][] board) {
        int m = board.length, n = board[0].length;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                int live = 0;
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        if (dr == 0 && dc == 0) continue;
                        int nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] % 2 == 1) live++;
                    }
                }
                if (board[r][c] == 1 && (live < 2 || live > 3)) board[r][c] = 2;
                else if (board[r][c] == 0 && live == 3) board[r][c] = 3;
            }
        }
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (board[r][c] == 2) board[r][c] = 0;
                else if (board[r][c] == 3) board[r][c] = 1;
            }
        }
        return board;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> gameOfLife(vector<vector<int>>& board) {
        int m = (int)board.size(), n = (int)board[0].size();
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                int live = 0;
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        if (dr == 0 && dc == 0) continue;
                        int nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < m && nc >= 0 && nc < n && board[nr][nc] % 2 == 1) live++;
                    }
                }
                if (board[r][c] == 1 && (live < 2 || live > 3)) board[r][c] = 2;
                else if (board[r][c] == 0 && live == 3) board[r][c] = 3;
            }
        }
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (board[r][c] == 2) board[r][c] = 0;
                else if (board[r][c] == 3) board[r][c] = 1;
            }
        }
        return board;
    }
};
$CPP$,
'O(m * n)', 'O(1)');

-- ============================================================
-- 5) next-permutation (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('next-permutation', 'arrays', 'Next Permutation', 'Medium',
$$<p>Implement the <strong>next permutation</strong> algorithm that rearranges numbers into the lexicographically next greater permutation of numbers.</p><p>If such an arrangement is not possible (the array is in descending order), rearrange it as the lowest possible order (ascending).</p><p>The replacement must be <strong>in place</strong> and use only constant extra memory.</p>$$,
'', ARRAY[
  'Find the largest index i such that nums[i] < nums[i+1]. If none, reverse the whole array.',
  'Find the largest index j > i such that nums[j] > nums[i]. Swap nums[i] and nums[j].',
  'Reverse the suffix starting at nums[i+1] to get the next permutation.'
], '400', 'https://leetcode.com/problems/next-permutation/',
'nextPermutation',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,2,3]"],"expected":"[1,3,2]"},
  {"inputs":["[3,2,1]"],"expected":"[1,2,3]"},
  {"inputs":["[1,1,5]"],"expected":"[1,5,1]"},
  {"inputs":["[1,3,2]"],"expected":"[2,1,3]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('next-permutation', 'python',
$PY$class Solution:
    def nextPermutation(self, nums: List[int]) -> List[int]:
        $PY$),
('next-permutation', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var nextPermutation = function(nums) {

};$JS$),
('next-permutation', 'java',
$JAVA$class Solution {
    public int[] nextPermutation(int[] nums) {
        return nums;
    }
}$JAVA$),
('next-permutation', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextPermutation(vector<int>& nums) {
        return nums;
    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('next-permutation', 1, 'Single Pass Swap + Reverse',
'Find the rightmost ascent (nums[i] < nums[i+1]), swap nums[i] with the smallest element larger than it in the suffix, then reverse the suffix to get the smallest possible tail.',
$ALGO$["Find largest i where nums[i] < nums[i+1]. If none exists, reverse entire array and return.","Find largest j > i where nums[j] > nums[i].","Swap nums[i] and nums[j].","Reverse the sub-array from i+1 to end.","Return the modified array."]$ALGO$::jsonb,
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
    let left = i + 1, right = n - 1;
    while (left < right) {
        [nums[left], nums[right]] = [nums[right], nums[left]];
        left++; right--;
    }
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
        int left = i + 1, right = n - 1;
        while (left < right) {
            int tmp = nums[left]; nums[left] = nums[right]; nums[right] = tmp;
            left++; right--;
        }
        return nums;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> nextPermutation(vector<int>& nums) {
        int n = (int)nums.size(), i = n - 2;
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
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 6) first-missing-positive (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('first-missing-positive', 'arrays', 'First Missing Positive', 'Hard',
$$<p>Given an unsorted integer array <code>nums</code>, return the smallest missing positive integer.</p><p>You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.</p>$$,
'', ARRAY[
  'The answer must be in the range [1, n+1] where n is the length of the array.',
  'Place each number in its correct index position (num 1 at index 0, num 2 at index 1, etc.) using cyclic sort.',
  'After sorting, the first index i where nums[i] != i + 1 gives the answer i + 1.'
], '400', 'https://leetcode.com/problems/first-missing-positive/',
'firstMissingPositive',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,0]"],"expected":"3"},
  {"inputs":["[3,4,-1,1]"],"expected":"2"},
  {"inputs":["[7,8,9,11,12]"],"expected":"1"},
  {"inputs":["[1]"],"expected":"2"},
  {"inputs":["[1,2,3,4,5]"],"expected":"6"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('first-missing-positive', 'python',
$PY$class Solution:
    def firstMissingPositive(self, nums: List[int]) -> int:
        $PY$),
('first-missing-positive', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var firstMissingPositive = function(nums) {

};$JS$),
('first-missing-positive', 'java',
$JAVA$class Solution {
    public int firstMissingPositive(int[] nums) {

    }
}$JAVA$),
('first-missing-positive', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('first-missing-positive', 1, 'Cyclic Sort',
'Place each value v in [1, n] at index v-1. After this in-place rearrangement, scan left to right; the first mismatch reveals the missing positive.',
$ALGO$["For each index i, while nums[i] is in [1, n] and nums[i] != nums[nums[i]-1], swap nums[i] with nums[nums[i]-1].","Scan from i = 0 to n-1: if nums[i] != i+1, return i+1.","If all match, return n+1."]$ALGO$::jsonb,
$PY$class Solution:
    def firstMissingPositive(self, nums: List[int]) -> int:
        n = len(nums)
        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                idx = nums[i] - 1
                nums[i], nums[idx] = nums[idx], nums[i]
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1
$PY$,
$JS$var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const idx = nums[i] - 1;
            [nums[i], nums[idx]] = [nums[idx], nums[i]];
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
                int idx = nums[i] - 1;
                int tmp = nums[i]; nums[i] = nums[idx]; nums[idx] = tmp;
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
        int n = (int)nums.size();
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
$CPP$,
'O(n)', 'O(1)');

COMMIT;
