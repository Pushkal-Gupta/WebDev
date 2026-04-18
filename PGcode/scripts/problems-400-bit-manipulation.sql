-- Grow catalog 300 → 400: bit-manipulation topic (+6 problems).
-- Each problem ships with metadata + test cases + 4-language starter templates
-- + one reference approach with Python/JS/Java/C++ code and complexity.
BEGIN;

-- Idempotent: drop any prior rows for these IDs so the file can be re-applied.
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'bitwise-and-of-numbers-range','gray-code',
  'find-the-duplicate-number','total-hamming-distance',
  'decode-xored-permutation','maximum-xor-of-two-numbers-in-an-array'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'bitwise-and-of-numbers-range','gray-code',
  'find-the-duplicate-number','total-hamming-distance',
  'decode-xored-permutation','maximum-xor-of-two-numbers-in-an-array'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'bitwise-and-of-numbers-range','gray-code',
  'find-the-duplicate-number','total-hamming-distance',
  'decode-xored-permutation','maximum-xor-of-two-numbers-in-an-array'
);

-- ============================================================
-- 1) bitwise-and-of-numbers-range (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('bitwise-and-of-numbers-range', 'bit-manipulation', 'Bitwise AND of Numbers Range', 'Easy',
$$<p>Given two integers <code>left</code> and <code>right</code> that represent the range <code>[left, right]</code>, return the bitwise AND of all numbers in this range, inclusive.</p>$$,
'', ARRAY[
  'The AND of a range zeros out all bits that differ between left and right.',
  'Shift both numbers right until they are equal — the common prefix is the answer.',
  'Shift the common prefix back left by the number of shifts to get the final result.'
], '400', 'https://leetcode.com/problems/bitwise-and-of-numbers-range/',
'rangeBitwiseAnd',
'[{"name":"left","type":"int"},{"name":"right","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["5","7"],"expected":"4"},
  {"inputs":["0","0"],"expected":"0"},
  {"inputs":["1","2147483647"],"expected":"0"},
  {"inputs":["6","7"],"expected":"6"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('bitwise-and-of-numbers-range', 'python',
$PY$class Solution:
    def rangeBitwiseAnd(self, left: int, right: int) -> int:
        $PY$),
('bitwise-and-of-numbers-range', 'javascript',
$JS$/**
 * @param {number} left
 * @param {number} right
 * @return {number}
 */
var rangeBitwiseAnd = function(left, right) {

};$JS$),
('bitwise-and-of-numbers-range', 'java',
$JAVA$class Solution {
    public int rangeBitwiseAnd(int left, int right) {

    }
}$JAVA$),
('bitwise-and-of-numbers-range', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('bitwise-and-of-numbers-range', 1, 'Common Prefix',
'The AND of a continuous range keeps only the common prefix bits of left and right. All lower bits get zeroed because at least one number in the range flips each of them.',
$ALGO$["Set shift = 0.","While left != right: right-shift both left and right by 1, increment shift.","Return left << shift (the common prefix shifted back)."]$ALGO$::jsonb,
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
    while (left !== right) {
        left >>= 1;
        right >>= 1;
        shift++;
    }
    return left << shift;
};
$JS$,
$JAVA$class Solution {
    public int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 2) gray-code (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('gray-code', 'bit-manipulation', 'Gray Code', 'Easy',
$$<p>An <strong>n-bit gray code sequence</strong> is a sequence of <code>2^n</code> integers where:</p><ul><li>Every integer is in the inclusive range <code>[0, 2^n - 1]</code>,</li><li>The first integer is 0,</li><li>An integer appears no more than once in the sequence,</li><li>The binary representation of every pair of adjacent integers differs by exactly one bit, and</li><li>The binary representation of the first and last integers also differs by exactly one bit.</li></ul><p>Given an integer <code>n</code>, return any valid n-bit gray code sequence.</p>$$,
'', ARRAY[
  'The i-th Gray code is i XOR (i >> 1).',
  'This formula produces a sequence where consecutive values differ by exactly one bit.',
  'Generate all values from 0 to 2^n - 1 using this formula.'
], '400', 'https://leetcode.com/problems/gray-code/',
'grayCode',
'[{"name":"n","type":"int"}]'::jsonb,
'List[int]',
'[
  {"inputs":["2"],"expected":"[0,1,3,2]"},
  {"inputs":["1"],"expected":"[0,1]"},
  {"inputs":["3"],"expected":"[0,1,3,2,6,7,5,4]"},
  {"inputs":["4"],"expected":"[0,1,3,2,6,7,5,4,12,13,15,14,10,11,9,8]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('gray-code', 'python',
$PY$class Solution:
    def grayCode(self, n: int) -> List[int]:
        $PY$),
('gray-code', 'javascript',
$JS$/**
 * @param {number} n
 * @return {number[]}
 */
var grayCode = function(n) {

};$JS$),
('gray-code', 'java',
$JAVA$import java.util.*;

class Solution {
    public List<Integer> grayCode(int n) {

    }
}$JAVA$),
('gray-code', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> grayCode(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('gray-code', 1, 'XOR Formula',
'The i-th Gray code value is i XOR (i >> 1). This guarantees consecutive values differ by exactly one bit.',
$ALGO$["Initialize result list.","For i from 0 to 2^n - 1: append i XOR (i >> 1) to result.","Return result."]$ALGO$::jsonb,
$PY$class Solution:
    def grayCode(self, n: int) -> List[int]:
        return [i ^ (i >> 1) for i in range(1 << n)]
$PY$,
$JS$var grayCode = function(n) {
    const res = [];
    for (let i = 0; i < (1 << n); i++) {
        res.push(i ^ (i >> 1));
    }
    return res;
};
$JS$,
$JAVA$import java.util.*;

class Solution {
    public List<Integer> grayCode(int n) {
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < (1 << n); i++) {
            res.add(i ^ (i >> 1));
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> grayCode(int n) {
        vector<int> res;
        for (int i = 0; i < (1 << n); i++) {
            res.push_back(i ^ (i >> 1));
        }
        return res;
    }
};
$CPP$,
'O(2^n)', 'O(1)');

-- ============================================================
-- 3) find-the-duplicate-number (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-the-duplicate-number', 'bit-manipulation', 'Find the Duplicate Number', 'Medium',
$$<p>Given an array of integers <code>nums</code> containing <code>n + 1</code> integers where each integer is in the range <code>[1, n]</code> inclusive, there is only one repeated number. Return the repeated number.</p><p>You must solve the problem <strong>without</strong> modifying the array and using only constant extra space.</p>$$,
'', ARRAY[
  'Think of the array as a linked list where index i points to nums[i]. The duplicate creates a cycle.',
  'Use Floyd cycle detection (tortoise and hare) to find the cycle entry point.',
  'Alternatively, use bit counting: for each bit position, compare the count of set bits in nums vs the count in [1, n].'
], '400', 'https://leetcode.com/problems/find-the-duplicate-number/',
'findDuplicate',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,3,4,2,2]"],"expected":"2"},
  {"inputs":["[3,1,3,4,2]"],"expected":"3"},
  {"inputs":["[1,1]"],"expected":"1"},
  {"inputs":["[2,5,9,6,9,3,8,9,7,1]"],"expected":"9"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-the-duplicate-number', 'python',
$PY$class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        $PY$),
('find-the-duplicate-number', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var findDuplicate = function(nums) {

};$JS$),
('find-the-duplicate-number', 'java',
$JAVA$class Solution {
    public int findDuplicate(int[] nums) {

    }
}$JAVA$),
('find-the-duplicate-number', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findDuplicate(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-the-duplicate-number', 1, 'Floyd Cycle Detection',
'Treat the array as a linked list where i -> nums[i]. A duplicate value means two indices point to the same node, creating a cycle. The duplicate is the cycle entrance.',
$ALGO$["Phase 1 (find intersection): slow = nums[0], fast = nums[0]. Move slow one step and fast two steps until they meet.","Phase 2 (find entrance): Reset slow to nums[0]. Move both one step at a time until they meet.","Return the meeting point — this is the duplicate number."]$ALGO$::jsonb,
$PY$class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        slow = nums[0]
        fast = nums[0]
        while True:
            slow = nums[slow]
            fast = nums[nums[fast]]
            if slow == fast:
                break
        slow = nums[0]
        while slow != fast:
            slow = nums[slow]
            fast = nums[fast]
        return slow
$PY$,
$JS$var findDuplicate = function(nums) {
    let slow = nums[0], fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow !== fast);
    slow = nums[0];
    while (slow !== fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
};
$JS$,
$JAVA$class Solution {
    public int findDuplicate(int[] nums) {
        int slow = nums[0], fast = nums[0];
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);
        slow = nums[0];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int slow = nums[0], fast = nums[0];
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);
        slow = nums[0];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) total-hamming-distance (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('total-hamming-distance', 'bit-manipulation', 'Total Hamming Distance', 'Medium',
$$<p>The <strong>Hamming distance</strong> between two integers is the number of positions at which the corresponding bits differ.</p><p>Given an integer array <code>nums</code>, return the sum of Hamming distances between all pairs of integers in <code>nums</code>.</p>$$,
'', ARRAY[
  'For each bit position, count how many numbers have that bit set (c) and how many do not (n - c).',
  'The contribution of that bit position to the total is c * (n - c).',
  'Sum across all 32 bit positions for the answer.'
], '400', 'https://leetcode.com/problems/total-hamming-distance/',
'totalHammingDistance',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[4,14,2]"],"expected":"6"},
  {"inputs":["[4,14,4]"],"expected":"4"},
  {"inputs":["[0,0,0]"],"expected":"0"},
  {"inputs":["[1,2,3,4,5]"],"expected":"18"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('total-hamming-distance', 'python',
$PY$class Solution:
    def totalHammingDistance(self, nums: List[int]) -> int:
        $PY$),
('total-hamming-distance', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var totalHammingDistance = function(nums) {

};$JS$),
('total-hamming-distance', 'java',
$JAVA$class Solution {
    public int totalHammingDistance(int[] nums) {

    }
}$JAVA$),
('total-hamming-distance', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalHammingDistance(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('total-hamming-distance', 1, 'Bit-by-Bit Counting',
'For each of the 32 bit positions, count numbers with that bit set. The pairs that differ at that bit contribute count * (n - count) to the total.',
$ALGO$["Initialize total = 0. Let n = len(nums).","For each bit position b from 0 to 31: count how many numbers have bit b set.","Add count * (n - count) to total.","Return total."]$ALGO$::jsonb,
$PY$class Solution:
    def totalHammingDistance(self, nums: List[int]) -> int:
        total = 0
        n = len(nums)
        for b in range(32):
            count = sum(1 for x in nums if (x >> b) & 1)
            total += count * (n - count)
        return total
$PY$,
$JS$var totalHammingDistance = function(nums) {
    let total = 0;
    const n = nums.length;
    for (let b = 0; b < 32; b++) {
        let count = 0;
        for (const x of nums) if ((x >> b) & 1) count++;
        total += count * (n - count);
    }
    return total;
};
$JS$,
$JAVA$class Solution {
    public int totalHammingDistance(int[] nums) {
        int total = 0, n = nums.length;
        for (int b = 0; b < 32; b++) {
            int count = 0;
            for (int x : nums) if (((x >> b) & 1) == 1) count++;
            total += count * (n - count);
        }
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int totalHammingDistance(vector<int>& nums) {
        int total = 0, n = (int)nums.size();
        for (int b = 0; b < 32; b++) {
            int count = 0;
            for (int x : nums) if ((x >> b) & 1) count++;
            total += count * (n - count);
        }
        return total;
    }
};
$CPP$,
'O(32 * n)', 'O(1)');

-- ============================================================
-- 5) decode-xored-permutation (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('decode-xored-permutation', 'bit-manipulation', 'Decode XORed Permutation', 'Medium',
$$<p>There is an integer array <code>perm</code> that is a permutation of the first <code>n</code> positive integers, where <code>n</code> is always odd. It was encoded into another integer array <code>encoded</code> of length <code>n - 1</code>, such that <code>encoded[i] = perm[i] XOR perm[i + 1]</code>.</p><p>Given the encoded array, return the original array <code>perm</code>.</p>$$,
'', ARRAY[
  'You know all values 1..n appear exactly once. XOR of 1..n gives you perm[0] XOR perm[1] XOR ... XOR perm[n-1].',
  'XOR of encoded[1], encoded[3], ... (odd indices) gives perm[1] XOR perm[2] XOR ... XOR perm[n-1].',
  'XOR these two results to recover perm[0]. Then decode the rest sequentially.'
], '400', 'https://leetcode.com/problems/decode-xored-permutation/',
'decode',
'[{"name":"encoded","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[3,1]"],"expected":"[1,2,3]"},
  {"inputs":["[6,5,4,6]"],"expected":"[2,4,1,5,3]"},
  {"inputs":["[1,3]"],"expected":"[3,2,1]"},
  {"inputs":["[3,1,7,1,3,1]"],"expected":"[1,2,3,4,5,6,7]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('decode-xored-permutation', 'python',
$PY$class Solution:
    def decode(self, encoded: List[int]) -> List[int]:
        $PY$),
('decode-xored-permutation', 'javascript',
$JS$/**
 * @param {number[]} encoded
 * @return {number[]}
 */
var decode = function(encoded) {

};$JS$),
('decode-xored-permutation', 'java',
$JAVA$class Solution {
    public int[] decode(int[] encoded) {

    }
}$JAVA$),
('decode-xored-permutation', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> decode(vector<int>& encoded) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('decode-xored-permutation', 1, 'XOR Properties',
'XOR all numbers 1..n to get totalXor. XOR encoded values at odd indices to get allExceptFirst. Then perm[0] = totalXor XOR allExceptFirst. Decode the rest with perm[i+1] = perm[i] XOR encoded[i].',
$ALGO$["Compute n = len(encoded) + 1. Compute totalXor = XOR of 1 to n.","Compute allExceptFirst = XOR of encoded[1], encoded[3], encoded[5], ... (odd indices).","perm[0] = totalXor XOR allExceptFirst.","For i from 0 to n-2: perm[i+1] = perm[i] XOR encoded[i].","Return perm."]$ALGO$::jsonb,
$PY$class Solution:
    def decode(self, encoded: List[int]) -> List[int]:
        n = len(encoded) + 1
        total_xor = 0
        for i in range(1, n + 1):
            total_xor ^= i
        all_except_first = 0
        for i in range(1, len(encoded), 2):
            all_except_first ^= encoded[i]
        perm = [total_xor ^ all_except_first]
        for e in encoded:
            perm.append(perm[-1] ^ e)
        return perm
$PY$,
$JS$var decode = function(encoded) {
    const n = encoded.length + 1;
    let totalXor = 0;
    for (let i = 1; i <= n; i++) totalXor ^= i;
    let allExceptFirst = 0;
    for (let i = 1; i < encoded.length; i += 2) allExceptFirst ^= encoded[i];
    const perm = [totalXor ^ allExceptFirst];
    for (const e of encoded) perm.push(perm[perm.length - 1] ^ e);
    return perm;
};
$JS$,
$JAVA$class Solution {
    public int[] decode(int[] encoded) {
        int n = encoded.length + 1;
        int totalXor = 0;
        for (int i = 1; i <= n; i++) totalXor ^= i;
        int allExceptFirst = 0;
        for (int i = 1; i < encoded.length; i += 2) allExceptFirst ^= encoded[i];
        int[] perm = new int[n];
        perm[0] = totalXor ^ allExceptFirst;
        for (int i = 0; i < encoded.length; i++) perm[i + 1] = perm[i] ^ encoded[i];
        return perm;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> decode(vector<int>& encoded) {
        int n = (int)encoded.size() + 1;
        int totalXor = 0;
        for (int i = 1; i <= n; i++) totalXor ^= i;
        int allExceptFirst = 0;
        for (int i = 1; i < (int)encoded.size(); i += 2) allExceptFirst ^= encoded[i];
        vector<int> perm(n);
        perm[0] = totalXor ^ allExceptFirst;
        for (int i = 0; i < (int)encoded.size(); i++) perm[i + 1] = perm[i] ^ encoded[i];
        return perm;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 6) maximum-xor-of-two-numbers-in-an-array (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('maximum-xor-of-two-numbers-in-an-array', 'bit-manipulation', 'Maximum XOR of Two Numbers in an Array', 'Hard',
$$<p>Given an integer array <code>nums</code>, return the maximum result of <code>nums[i] XOR nums[j]</code>, where <code>0 <= i <= j < n</code>.</p>$$,
'', ARRAY[
  'Build the answer bit by bit from the most significant bit to the least significant.',
  'For each bit position, check if the current candidate (with this bit set) is achievable using a hash set and the XOR property: if a XOR b = c then a XOR c = b.',
  'Alternatively, use a trie to find the maximum XOR in O(n * 32) time.'
], '400', 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/',
'findMaximumXOR',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,10,5,25,2,8]"],"expected":"28"},
  {"inputs":["[14,70,53,83,49,91,36,80,92,51,66,70]"],"expected":"127"},
  {"inputs":["[0]"],"expected":"0"},
  {"inputs":["[1,2]"],"expected":"3"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('maximum-xor-of-two-numbers-in-an-array', 'python',
$PY$class Solution:
    def findMaximumXOR(self, nums: List[int]) -> int:
        $PY$),
('maximum-xor-of-two-numbers-in-an-array', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var findMaximumXOR = function(nums) {

};$JS$),
('maximum-xor-of-two-numbers-in-an-array', 'java',
$JAVA$class Solution {
    public int findMaximumXOR(int[] nums) {

    }
}$JAVA$),
('maximum-xor-of-two-numbers-in-an-array', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('maximum-xor-of-two-numbers-in-an-array', 1, 'Greedy Bit-by-Bit with Hash Set',
'Build the maximum XOR from the most significant bit down. At each step, try to set the current bit in the answer. Use the property that if a XOR b = candidate, then a XOR candidate = b. Check feasibility with a hash set of prefixes.',
$ALGO$["Initialize maxXor = 0, mask = 0.","For bit from 31 down to 0: set mask |= (1 << bit). Collect all prefixes (num & mask) into a set.","Set candidate = maxXor | (1 << bit).","For each prefix p: if (p XOR candidate) is in the set, then maxXor = candidate and break.","Return maxXor."]$ALGO$::jsonb,
$PY$class Solution:
    def findMaximumXOR(self, nums: List[int]) -> int:
        max_xor = 0
        mask = 0
        for bit in range(31, -1, -1):
            mask |= (1 << bit)
            prefixes = set()
            for num in nums:
                prefixes.add(num & mask)
            candidate = max_xor | (1 << bit)
            for p in prefixes:
                if (p ^ candidate) in prefixes:
                    max_xor = candidate
                    break
        return max_xor
$PY$,
$JS$var findMaximumXOR = function(nums) {
    let maxXor = 0, mask = 0;
    for (let bit = 31; bit >= 0; bit--) {
        mask |= (1 << bit);
        const prefixes = new Set();
        for (const num of nums) prefixes.add(num & mask);
        const candidate = maxXor | (1 << bit);
        for (const p of prefixes) {
            if (prefixes.has(p ^ candidate)) {
                maxXor = candidate;
                break;
            }
        }
    }
    return maxXor;
};
$JS$,
$JAVA$class Solution {
    public int findMaximumXOR(int[] nums) {
        int maxXor = 0, mask = 0;
        for (int bit = 31; bit >= 0; bit--) {
            mask |= (1 << bit);
            Set<Integer> prefixes = new HashSet<>();
            for (int num : nums) prefixes.add(num & mask);
            int candidate = maxXor | (1 << bit);
            for (int p : prefixes) {
                if (prefixes.contains(p ^ candidate)) {
                    maxXor = candidate;
                    break;
                }
            }
        }
        return maxXor;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {
        int maxXor = 0, mask = 0;
        for (int bit = 31; bit >= 0; bit--) {
            mask |= (1 << bit);
            unordered_set<int> prefixes;
            for (int num : nums) prefixes.insert(num & mask);
            int candidate = maxXor | (1 << bit);
            for (int p : prefixes) {
                if (prefixes.count(p ^ candidate)) {
                    maxXor = candidate;
                    break;
                }
            }
        }
        return maxXor;
    }
};
$CPP$,
'O(32 * n)', 'O(n)');

COMMIT;
