-- Grow catalog 200 → 300: sliding-window topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'maximum-average-subarray-i','contains-duplicate-ii','find-all-anagrams',
  'binary-subarrays-with-sum','minimum-operations-reduce-x-to-zero',
  'grumpy-bookstore-owner','max-points-from-cards','substring-with-concatenation'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'maximum-average-subarray-i','contains-duplicate-ii','find-all-anagrams',
  'binary-subarrays-with-sum','minimum-operations-reduce-x-to-zero',
  'grumpy-bookstore-owner','max-points-from-cards','substring-with-concatenation'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'maximum-average-subarray-i','contains-duplicate-ii','find-all-anagrams',
  'binary-subarrays-with-sum','minimum-operations-reduce-x-to-zero',
  'grumpy-bookstore-owner','max-points-from-cards','substring-with-concatenation'
);

-- ============================================================
-- 1) maximum-average-subarray-i (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('maximum-average-subarray-i', 'sliding-window', 'Maximum Average Subarray I', 'Easy',
$$<p>Given an integer array <code>nums</code> and an integer <code>k</code>, find a contiguous subarray of length <code>k</code> with the maximum average and return that average.</p>$$,
'', ARRAY[
  'All candidate subarrays share the same length, so max sum and max average are equivalent. Track the running sum in a fixed-size window.',
  'Initialize the sum of the first k elements; then slide by adding nums[i] and subtracting nums[i - k].',
  'Convert the best sum to a double by dividing by k.'
], '300', 'https://leetcode.com/problems/maximum-average-subarray-i/',
'findMaxAverage',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'float',
'[
  {"inputs":["[1,12,-5,-6,50,3]","4"],"expected":"12.75"},
  {"inputs":["[5]","1"],"expected":"5"},
  {"inputs":["[0,1,1,3,3]","4"],"expected":"2"},
  {"inputs":["[-1]","1"],"expected":"-1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('maximum-average-subarray-i', 'python',
$PY$class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        $PY$),
('maximum-average-subarray-i', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findMaxAverage = function(nums, k) {

};$JS$),
('maximum-average-subarray-i', 'java',
$JAVA$class Solution {
    public double findMaxAverage(int[] nums, int k) {

    }
}$JAVA$),
('maximum-average-subarray-i', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('maximum-average-subarray-i', 1, 'Fixed-Size Window Sum',
'The window is a constant size k, so maximizing the average collapses to maximizing the sum. Maintain a rolling sum that adds the incoming element and subtracts the outgoing one at each step.',
'["Compute current = sum of nums[0..k-1] and set best = current.","For i from k to n - 1: current += nums[i] - nums[i - k]; best = max(best, current).","Return best / k."]'::jsonb,
$PY$class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        current = sum(nums[:k])
        best = current
        for i in range(k, len(nums)):
            current += nums[i] - nums[i - k]
            if current > best:
                best = current
        return best / k
$PY$,
$JS$var findMaxAverage = function(nums, k) {
    let current = 0;
    for (let i = 0; i < k; i++) current += nums[i];
    let best = current;
    for (let i = k; i < nums.length; i++) {
        current += nums[i] - nums[i - k];
        if (current > best) best = current;
    }
    return best / k;
};
$JS$,
$JAVA$class Solution {
    public double findMaxAverage(int[] nums, int k) {
        double current = 0;
        for (int i = 0; i < k; i++) current += nums[i];
        double best = current;
        for (int i = k; i < nums.length; i++) {
            current += nums[i] - nums[i - k];
            if (current > best) best = current;
        }
        return best / k;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        double current = 0;
        for (int i = 0; i < k; i++) current += nums[i];
        double best = current;
        for (int i = k; i < (int)nums.size(); i++) {
            current += nums[i] - nums[i - k];
            if (current > best) best = current;
        }
        return best / k;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 2) contains-duplicate-ii (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('contains-duplicate-ii', 'sliding-window', 'Contains Duplicate II', 'Easy',
$$<p>Given an integer array <code>nums</code> and integer <code>k</code>, return <code>true</code> if there are two distinct indices <code>i</code> and <code>j</code> such that <code>nums[i] == nums[j]</code> and <code>abs(i - j) &lt;= k</code>.</p>$$,
'', ARRAY[
  'Maintain a sliding window of the last k + 1 elements as a hash set. If the incoming value is already in the set, we found a close duplicate.',
  'Evict the element at index i - k - 1 when it leaves the window.',
  'O(n) time, O(min(n, k)) space.'
], '300', 'https://leetcode.com/problems/contains-duplicate-ii/',
'containsNearbyDuplicate',
'[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["[1,2,3,1]","3"],"expected":"true"},
  {"inputs":["[1,0,1,1]","1"],"expected":"true"},
  {"inputs":["[1,2,3,1,2,3]","2"],"expected":"false"},
  {"inputs":["[99,99]","2"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('contains-duplicate-ii', 'python',
$PY$class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        $PY$),
('contains-duplicate-ii', 'javascript',
$JS$var containsNearbyDuplicate = function(nums, k) {

};$JS$),
('contains-duplicate-ii', 'java',
$JAVA$class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {

    }
}$JAVA$),
('contains-duplicate-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool containsNearbyDuplicate(vector<int>& nums, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('contains-duplicate-ii', 1, 'Hash Set Sliding Window',
'Keep a hash set of the last k + 1 values. Any repeat inside that window satisfies the |i - j| <= k constraint.',
'["Initialize an empty hash set window.","For i, num in enumerate(nums): if num in window, return True; else add num to window.","If i >= k, remove nums[i - k] from window.","Return False if the loop completes."]'::jsonb,
$PY$class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        window = set()
        for i, num in enumerate(nums):
            if num in window:
                return True
            window.add(num)
            if i >= k:
                window.remove(nums[i - k])
        return False
$PY$,
$JS$var containsNearbyDuplicate = function(nums, k) {
    const window = new Set();
    for (let i = 0; i < nums.length; i++) {
        if (window.has(nums[i])) return true;
        window.add(nums[i]);
        if (i >= k) window.delete(nums[i - k]);
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> window = new HashSet<>();
        for (int i = 0; i < nums.length; i++) {
            if (!window.add(nums[i])) return true;
            if (i >= k) window.remove(nums[i - k]);
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool containsNearbyDuplicate(vector<int>& nums, int k) {
        unordered_set<int> window;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (!window.insert(nums[i]).second) return true;
            if (i >= k) window.erase(nums[i - k]);
        }
        return false;
    }
};
$CPP$,
'O(n)', 'O(min(n, k))');

-- ============================================================
-- 3) find-all-anagrams (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-all-anagrams', 'sliding-window', 'Find All Anagrams in a String', 'Medium',
$$<p>Given strings <code>s</code> and <code>p</code>, return every start index in <code>s</code> of substrings that are anagrams of <code>p</code>.</p>$$,
'', ARRAY[
  'Slide a fixed-size window of length |p| across s. Two windows are anagrams iff their 26-letter frequency arrays match.',
  'Update the frequency array incrementally: add the incoming letter, subtract the outgoing one.',
  'Comparing two 26-int arrays is O(26) per slide — amortizes to O(n).'
], '300', 'https://leetcode.com/problems/find-all-anagrams-in-a-string/',
'findAnagrams',
'[{"name":"s","type":"str"},{"name":"p","type":"str"}]'::jsonb,
'List[int]',
'[
  {"inputs":["\"cbaebabacd\"","\"abc\""],"expected":"[0,6]"},
  {"inputs":["\"abab\"","\"ab\""],"expected":"[0,1,2]"},
  {"inputs":["\"aa\"","\"bb\""],"expected":"[]"},
  {"inputs":["\"ab\"","\"abcd\""],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-all-anagrams', 'python',
$PY$class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        $PY$),
('find-all-anagrams', 'javascript',
$JS$var findAnagrams = function(s, p) {

};$JS$),
('find-all-anagrams', 'java',
$JAVA$class Solution {
    public List<Integer> findAnagrams(String s, String p) {

    }
}$JAVA$),
('find-all-anagrams', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findAnagrams(string& s, string& p) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-all-anagrams', 1, 'Fixed-Size Frequency Window',
'A window of length |p| is an anagram of p iff their character frequencies match. Maintain the window''s 26-letter counts incrementally and compare to p''s counts at each step.',
'["Build need[26] from p. Initialize have[26] by filling the first |p| chars of s.","Compare have to need; if equal, record index 0.","For each i from |p| to |s| - 1: have[s[i]]++; have[s[i - |p|]]--. If arrays match, record i - |p| + 1.","Return the indices list."]'::jsonb,
$PY$class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        if len(p) > len(s):
            return []
        need = [0] * 26
        have = [0] * 26
        for ch in p:
            need[ord(ch) - 97] += 1
        for i in range(len(p)):
            have[ord(s[i]) - 97] += 1
        result = []
        if have == need:
            result.append(0)
        for i in range(len(p), len(s)):
            have[ord(s[i]) - 97] += 1
            have[ord(s[i - len(p)]) - 97] -= 1
            if have == need:
                result.append(i - len(p) + 1)
        return result
$PY$,
$JS$var findAnagrams = function(s, p) {
    if (p.length > s.length) return [];
    const need = new Array(26).fill(0);
    const have = new Array(26).fill(0);
    for (const ch of p) need[ch.charCodeAt(0) - 97]++;
    for (let i = 0; i < p.length; i++) have[s.charCodeAt(i) - 97]++;
    const eq = () => need.every((v, i) => v === have[i]);
    const result = [];
    if (eq()) result.push(0);
    for (let i = p.length; i < s.length; i++) {
        have[s.charCodeAt(i) - 97]++;
        have[s.charCodeAt(i - p.length) - 97]--;
        if (eq()) result.push(i - p.length + 1);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> result = new ArrayList<>();
        if (p.length() > s.length()) return result;
        int[] need = new int[26];
        int[] have = new int[26];
        for (char c : p.toCharArray()) need[c - 'a']++;
        for (int i = 0; i < p.length(); i++) have[s.charAt(i) - 'a']++;
        if (Arrays.equals(need, have)) result.add(0);
        for (int i = p.length(); i < s.length(); i++) {
            have[s.charAt(i) - 'a']++;
            have[s.charAt(i - p.length()) - 'a']--;
            if (Arrays.equals(need, have)) result.add(i - p.length() + 1);
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> findAnagrams(string& s, string& p) {
        vector<int> result;
        if (p.size() > s.size()) return result;
        int need[26] = {0}, have[26] = {0};
        for (char c : p) need[c - 'a']++;
        for (int i = 0; i < (int)p.size(); i++) have[s[i] - 'a']++;
        auto eq = [&]() {
            for (int i = 0; i < 26; i++) if (need[i] != have[i]) return false;
            return true;
        };
        if (eq()) result.push_back(0);
        for (int i = p.size(); i < (int)s.size(); i++) {
            have[s[i] - 'a']++;
            have[s[i - p.size()] - 'a']--;
            if (eq()) result.push_back(i - p.size() + 1);
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) binary-subarrays-with-sum (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-subarrays-with-sum', 'sliding-window', 'Binary Subarrays With Sum', 'Medium',
$$<p>Given a binary array <code>nums</code> and integer <code>goal</code>, return the number of non-empty contiguous subarrays whose sum equals <code>goal</code>.</p>$$,
'', ARRAY[
  'Direct sliding window is awkward because zeros don''t change the sum. Use "at most" windows: count(exactly k) = count(at most k) - count(at most k - 1).',
  'Write a helper that counts subarrays with sum <= k in O(n) using a shrinking right-expanding left window.',
  'Return helper(goal) - helper(goal - 1).'
], '300', 'https://leetcode.com/problems/binary-subarrays-with-sum/',
'numSubarraysWithSum',
'[{"name":"nums","type":"List[int]"},{"name":"goal","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,0,1,0,1]","2"],"expected":"4"},
  {"inputs":["[0,0,0,0,0]","0"],"expected":"15"},
  {"inputs":["[1,1,1]","2"],"expected":"2"},
  {"inputs":["[0,1,0,0,1]","1"],"expected":"9"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-subarrays-with-sum', 'python',
$PY$class Solution:
    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:
        $PY$),
('binary-subarrays-with-sum', 'javascript',
$JS$var numSubarraysWithSum = function(nums, goal) {

};$JS$),
('binary-subarrays-with-sum', 'java',
$JAVA$class Solution {
    public int numSubarraysWithSum(int[] nums, int goal) {

    }
}$JAVA$),
('binary-subarrays-with-sum', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numSubarraysWithSum(vector<int>& nums, int goal) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-subarrays-with-sum', 1, '"At Most" Trick with Sliding Window',
'Sliding window struggles with exact-sum queries when the array contains zeros, but it easily counts subarrays with sum <= k. "Exactly goal" = "at most goal" − "at most goal − 1", and each at-most count is a clean O(n) window.',
'["Define at_most(k): return 0 if k < 0. Two pointers l = 0, sum = 0, count = 0. For r in 0..n - 1: sum += nums[r]. While sum > k, sum -= nums[l]; l += 1. count += r - l + 1.","Return at_most(goal) - at_most(goal - 1)."]'::jsonb,
$PY$class Solution:
    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:
        def at_most(k):
            if k < 0:
                return 0
            l = 0
            s = 0
            count = 0
            for r in range(len(nums)):
                s += nums[r]
                while s > k:
                    s -= nums[l]
                    l += 1
                count += r - l + 1
            return count
        return at_most(goal) - at_most(goal - 1)
$PY$,
$JS$var numSubarraysWithSum = function(nums, goal) {
    const atMost = (k) => {
        if (k < 0) return 0;
        let l = 0, s = 0, count = 0;
        for (let r = 0; r < nums.length; r++) {
            s += nums[r];
            while (s > k) { s -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    };
    return atMost(goal) - atMost(goal - 1);
};
$JS$,
$JAVA$class Solution {
    public int numSubarraysWithSum(int[] nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }
    private int atMost(int[] nums, int k) {
        if (k < 0) return 0;
        int l = 0, s = 0, count = 0;
        for (int r = 0; r < nums.length; r++) {
            s += nums[r];
            while (s > k) { s -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
}
$JAVA$,
$CPP$class Solution {
    int atMost(vector<int>& nums, int k) {
        if (k < 0) return 0;
        int l = 0, s = 0, count = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            s += nums[r];
            while (s > k) { s -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
public:
    int numSubarraysWithSum(vector<int>& nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 5) minimum-operations-reduce-x-to-zero (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-operations-reduce-x-to-zero', 'sliding-window', 'Minimum Operations to Reduce X to Zero', 'Medium',
$$<p>Each operation removes either the leftmost or the rightmost element of <code>nums</code>, subtracting it from <code>x</code>. Return the minimum number of operations to make <code>x</code> exactly zero, or <code>-1</code> if impossible.</p>$$,
'', ARRAY[
  'Flip the problem around: find the LONGEST contiguous subarray whose sum equals total(nums) - x. The operations used = n - length of that subarray.',
  'Use a sliding window to find the longest subarray with sum equal to a fixed target.',
  'If no such subarray exists (or the target is negative), return -1.'
], '300', 'https://leetcode.com/problems/minimum-operations-to-reduce-x-to-zero/',
'minOperations',
'[{"name":"nums","type":"List[int]"},{"name":"x","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,1,4,2,3]","5"],"expected":"2"},
  {"inputs":["[5,6,7,8,9]","4"],"expected":"-1"},
  {"inputs":["[3,2,20,1,1,3]","10"],"expected":"5"},
  {"inputs":["[1,1]","3"],"expected":"-1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-operations-reduce-x-to-zero', 'python',
$PY$class Solution:
    def minOperations(self, nums: List[int], x: int) -> int:
        $PY$),
('minimum-operations-reduce-x-to-zero', 'javascript',
$JS$var minOperations = function(nums, x) {

};$JS$),
('minimum-operations-reduce-x-to-zero', 'java',
$JAVA$class Solution {
    public int minOperations(int[] nums, int x) {

    }
}$JAVA$),
('minimum-operations-reduce-x-to-zero', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minOperations(vector<int>& nums, int x) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-operations-reduce-x-to-zero', 1, 'Complement Subarray Sum',
'Removing a prefix and a suffix that together sum to x is equivalent to keeping a contiguous middle subarray whose sum is total - x. Minimizing removed elements = maximizing kept length, which a sliding window delivers in O(n).',
'["Let target = sum(nums) - x. If target < 0, return -1.","Two pointers l = 0, running = 0, best_len = -1.","For r in 0..n - 1: running += nums[r]. While running > target and l <= r: running -= nums[l]; l += 1.","If running == target, best_len = max(best_len, r - l + 1).","Return n - best_len if best_len != -1 else -1. Careful: best_len = 0 (empty kept subarray) means answer is n."]'::jsonb,
$PY$class Solution:
    def minOperations(self, nums: List[int], x: int) -> int:
        target = sum(nums) - x
        if target < 0:
            return -1
        l = 0
        running = 0
        best_len = -1
        for r in range(len(nums)):
            running += nums[r]
            while running > target and l <= r:
                running -= nums[l]
                l += 1
            if running == target:
                best_len = max(best_len, r - l + 1)
        if target == 0:
            best_len = max(best_len, 0)
        return -1 if best_len == -1 else len(nums) - best_len
$PY$,
$JS$var minOperations = function(nums, x) {
    const total = nums.reduce((a, b) => a + b, 0);
    const target = total - x;
    if (target < 0) return -1;
    let l = 0, running = 0, bestLen = -1;
    for (let r = 0; r < nums.length; r++) {
        running += nums[r];
        while (running > target && l <= r) { running -= nums[l]; l++; }
        if (running === target) bestLen = Math.max(bestLen, r - l + 1);
    }
    if (target === 0) bestLen = Math.max(bestLen, 0);
    return bestLen === -1 ? -1 : nums.length - bestLen;
};
$JS$,
$JAVA$class Solution {
    public int minOperations(int[] nums, int x) {
        long total = 0;
        for (int v : nums) total += v;
        long target = total - x;
        if (target < 0) return -1;
        int l = 0, bestLen = -1;
        long running = 0;
        for (int r = 0; r < nums.length; r++) {
            running += nums[r];
            while (running > target && l <= r) { running -= nums[l]; l++; }
            if (running == target) bestLen = Math.max(bestLen, r - l + 1);
        }
        if (target == 0) bestLen = Math.max(bestLen, 0);
        return bestLen == -1 ? -1 : nums.length - bestLen;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minOperations(vector<int>& nums, int x) {
        long long total = 0;
        for (int v : nums) total += v;
        long long target = total - x;
        if (target < 0) return -1;
        int l = 0, bestLen = -1;
        long long running = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            running += nums[r];
            while (running > target && l <= r) { running -= nums[l]; l++; }
            if (running == target) bestLen = max(bestLen, r - l + 1);
        }
        if (target == 0) bestLen = max(bestLen, 0);
        return bestLen == -1 ? -1 : (int)nums.size() - bestLen;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 6) grumpy-bookstore-owner (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('grumpy-bookstore-owner', 'sliding-window', 'Grumpy Bookstore Owner', 'Medium',
$$<p>A shop receives <code>customers[i]</code> customers in minute <code>i</code>. The owner is grumpy at minute <code>i</code> iff <code>grumpy[i] == 1</code>; customers are satisfied when the owner is not grumpy. The owner may stay non-grumpy for one contiguous window of <code>minutes</code> minutes. Return the maximum total satisfied customers.</p>$$,
'', ARRAY[
  'The always-satisfied baseline is sum over i where grumpy[i] == 0.',
  'The quiet window saves the grumpy customers inside it. Slide a fixed window of size minutes over customers[i] * grumpy[i] to find the maximum additional save.',
  'Answer = baseline + best window save.'
], '300', 'https://leetcode.com/problems/grumpy-bookstore-owner/',
'maxSatisfied',
'[{"name":"customers","type":"List[int]"},{"name":"grumpy","type":"List[int]"},{"name":"minutes","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,0,1,2,1,1,7,5]","[0,1,0,1,0,1,0,1]","3"],"expected":"16"},
  {"inputs":["[1]","[0]","1"],"expected":"1"},
  {"inputs":["[4,10,10]","[1,1,0]","2"],"expected":"24"},
  {"inputs":["[2,6,6,9]","[0,0,1,1]","1"],"expected":"23"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('grumpy-bookstore-owner', 'python',
$PY$class Solution:
    def maxSatisfied(self, customers: List[int], grumpy: List[int], minutes: int) -> int:
        $PY$),
('grumpy-bookstore-owner', 'javascript',
$JS$var maxSatisfied = function(customers, grumpy, minutes) {

};$JS$),
('grumpy-bookstore-owner', 'java',
$JAVA$class Solution {
    public int maxSatisfied(int[] customers, int[] grumpy, int minutes) {

    }
}$JAVA$),
('grumpy-bookstore-owner', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSatisfied(vector<int>& customers, vector<int>& grumpy, int minutes) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('grumpy-bookstore-owner', 1, 'Baseline + Best Rescue Window',
'Customers in non-grumpy minutes are guaranteed satisfied. The "technique" only rescues customers in minutes where grumpy = 1. Sliding a window of length minutes across customers[i] * grumpy[i] finds the largest rescue.',
'["baseline = sum(customers[i] for i where grumpy[i] == 0).","Build cost[i] = customers[i] * grumpy[i].","Compute window = sum of cost[0..minutes - 1] and best = window.","For i from minutes to n - 1: window += cost[i] - cost[i - minutes]; best = max(best, window).","Return baseline + best."]'::jsonb,
$PY$class Solution:
    def maxSatisfied(self, customers: List[int], grumpy: List[int], minutes: int) -> int:
        baseline = sum(c for c, g in zip(customers, grumpy) if g == 0)
        window = sum(customers[i] * grumpy[i] for i in range(minutes))
        best = window
        for i in range(minutes, len(customers)):
            window += customers[i] * grumpy[i] - customers[i - minutes] * grumpy[i - minutes]
            best = max(best, window)
        return baseline + best
$PY$,
$JS$var maxSatisfied = function(customers, grumpy, minutes) {
    let baseline = 0;
    for (let i = 0; i < customers.length; i++) if (grumpy[i] === 0) baseline += customers[i];
    let window = 0;
    for (let i = 0; i < minutes; i++) window += customers[i] * grumpy[i];
    let best = window;
    for (let i = minutes; i < customers.length; i++) {
        window += customers[i] * grumpy[i] - customers[i - minutes] * grumpy[i - minutes];
        if (window > best) best = window;
    }
    return baseline + best;
};
$JS$,
$JAVA$class Solution {
    public int maxSatisfied(int[] customers, int[] grumpy, int minutes) {
        int baseline = 0;
        for (int i = 0; i < customers.length; i++) if (grumpy[i] == 0) baseline += customers[i];
        int window = 0;
        for (int i = 0; i < minutes; i++) window += customers[i] * grumpy[i];
        int best = window;
        for (int i = minutes; i < customers.length; i++) {
            window += customers[i] * grumpy[i] - customers[i - minutes] * grumpy[i - minutes];
            if (window > best) best = window;
        }
        return baseline + best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxSatisfied(vector<int>& customers, vector<int>& grumpy, int minutes) {
        int baseline = 0;
        for (int i = 0; i < (int)customers.size(); i++) if (grumpy[i] == 0) baseline += customers[i];
        int window = 0;
        for (int i = 0; i < minutes; i++) window += customers[i] * grumpy[i];
        int best = window;
        for (int i = minutes; i < (int)customers.size(); i++) {
            window += customers[i] * grumpy[i] - customers[i - minutes] * grumpy[i - minutes];
            if (window > best) best = window;
        }
        return baseline + best;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 7) max-points-from-cards (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('max-points-from-cards', 'sliding-window', 'Maximum Points You Can Obtain from Cards', 'Medium',
$$<p>There are cards in a row with values <code>cardPoints[i]</code>. In each step you take one card from either the beginning or the end of the row. Return the maximum total points attainable after exactly <code>k</code> steps.</p>$$,
'', ARRAY[
  'Taking p cards from the left and k - p from the right leaves a contiguous untouched window of size n - k in the middle. Minimize that middle sum → maximize your score.',
  'Slide a fixed-size window of length n - k across cardPoints and track its minimum sum.',
  'Answer = total sum - min middle window sum.'
], '300', 'https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/',
'maxScore',
'[{"name":"cardPoints","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3,4,5,6,1]","3"],"expected":"12"},
  {"inputs":["[2,2,2]","2"],"expected":"4"},
  {"inputs":["[9,7,7,9,7,7,9]","7"],"expected":"55"},
  {"inputs":["[1,1000,1]","1"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('max-points-from-cards', 'python',
$PY$class Solution:
    def maxScore(self, cardPoints: List[int], k: int) -> int:
        $PY$),
('max-points-from-cards', 'javascript',
$JS$var maxScore = function(cardPoints, k) {

};$JS$),
('max-points-from-cards', 'java',
$JAVA$class Solution {
    public int maxScore(int[] cardPoints, int k) {

    }
}$JAVA$),
('max-points-from-cards', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxScore(vector<int>& cardPoints, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('max-points-from-cards', 1, 'Minimize Middle Window',
'You keep exactly n - k contiguous cards in the middle. Minimizing their total maximizes what you take. Slide a window of size n - k and find its minimum sum in O(n).',
'["total = sum(cardPoints). If k == n, return total.","window_size = n - k. Initialize window = sum of cardPoints[0..window_size - 1] and best_min = window.","For i from window_size to n - 1: window += cardPoints[i] - cardPoints[i - window_size]; best_min = min(best_min, window).","Return total - best_min."]'::jsonb,
$PY$class Solution:
    def maxScore(self, cardPoints: List[int], k: int) -> int:
        n = len(cardPoints)
        total = sum(cardPoints)
        if k == n:
            return total
        window_size = n - k
        window = sum(cardPoints[:window_size])
        best_min = window
        for i in range(window_size, n):
            window += cardPoints[i] - cardPoints[i - window_size]
            if window < best_min:
                best_min = window
        return total - best_min
$PY$,
$JS$var maxScore = function(cardPoints, k) {
    const n = cardPoints.length;
    const total = cardPoints.reduce((a, b) => a + b, 0);
    if (k === n) return total;
    const ws = n - k;
    let window = 0;
    for (let i = 0; i < ws; i++) window += cardPoints[i];
    let bestMin = window;
    for (let i = ws; i < n; i++) {
        window += cardPoints[i] - cardPoints[i - ws];
        if (window < bestMin) bestMin = window;
    }
    return total - bestMin;
};
$JS$,
$JAVA$class Solution {
    public int maxScore(int[] cardPoints, int k) {
        int n = cardPoints.length;
        int total = 0;
        for (int v : cardPoints) total += v;
        if (k == n) return total;
        int ws = n - k;
        int window = 0;
        for (int i = 0; i < ws; i++) window += cardPoints[i];
        int bestMin = window;
        for (int i = ws; i < n; i++) {
            window += cardPoints[i] - cardPoints[i - ws];
            if (window < bestMin) bestMin = window;
        }
        return total - bestMin;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxScore(vector<int>& cardPoints, int k) {
        int n = cardPoints.size();
        int total = 0;
        for (int v : cardPoints) total += v;
        if (k == n) return total;
        int ws = n - k;
        int window = 0;
        for (int i = 0; i < ws; i++) window += cardPoints[i];
        int bestMin = window;
        for (int i = ws; i < n; i++) {
            window += cardPoints[i] - cardPoints[i - ws];
            if (window < bestMin) bestMin = window;
        }
        return total - bestMin;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 8) substring-with-concatenation (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('substring-with-concatenation', 'sliding-window', 'Substring with Concatenation of All Words', 'Hard',
$$<p>Given a string <code>s</code> and a list of equal-length words <code>words</code>, return every starting index in <code>s</code> of a substring that is a concatenation of every word exactly once (in any order).</p>$$,
'', ARRAY[
  'Each candidate substring has length L * k where k = len(words) and L = len(words[0]). The length is fixed.',
  'Use a sliding window of length L * k, but step by L so every window is word-aligned. That gives L parallel sliding-window passes.',
  'For each word-length offset 0..L - 1, maintain a frequency map of the last k words; compare against need on each slide.'
], '300', 'https://leetcode.com/problems/substring-with-concatenation-of-all-words/',
'findSubstring',
'[{"name":"s","type":"str"},{"name":"words","type":"List[str]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["\"barfoothefoobarman\"","[\"foo\",\"bar\"]"],"expected":"[0,9]"},
  {"inputs":["\"wordgoodgoodgoodbestword\"","[\"word\",\"good\",\"best\",\"word\"]"],"expected":"[]"},
  {"inputs":["\"barfoofoobarthefoobarman\"","[\"bar\",\"foo\",\"the\"]"],"expected":"[6,9,12]"},
  {"inputs":["\"aaa\"","[\"a\",\"a\"]"],"expected":"[0,1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('substring-with-concatenation', 'python',
$PY$class Solution:
    def findSubstring(self, s: str, words: List[str]) -> List[int]:
        $PY$),
('substring-with-concatenation', 'javascript',
$JS$var findSubstring = function(s, words) {

};$JS$),
('substring-with-concatenation', 'java',
$JAVA$class Solution {
    public List<Integer> findSubstring(String s, String[] words) {

    }
}$JAVA$),
('substring-with-concatenation', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findSubstring(string& s, vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('substring-with-concatenation', 1, 'Word-Aligned Sliding Window',
'Every valid substring is exactly k concatenated words, so any start must lie on a multiple of L from some base offset in 0..L - 1. For each offset, scan chunks of length L as a sliding window of words, maintaining a frequency map to compare against the needed multiset.',
'["Let L = len(words[0]), k = len(words). Build need: word -> count.","For offset in 0..L - 1: slide with l = offset, have = {}, count = 0.","  For r in offset, offset + L, offset + 2L, ... while r + L <= len(s):","    word = s[r:r + L]. If word not in need, reset have and count, l = r + L.","    Else: have[word] += 1. While have[word] > need[word]: have[s[l:l + L]] -= 1; l += L; count -= 1.","    count += 1. If count == k, record l; slide l forward by L and count -= 1.","Return all recorded indices."]'::jsonb,
$PY$class Solution:
    def findSubstring(self, s: str, words: List[str]) -> List[int]:
        if not words or not s:
            return []
        L = len(words[0])
        k = len(words)
        need = {}
        for w in words:
            need[w] = need.get(w, 0) + 1
        result = []
        n = len(s)
        for offset in range(L):
            l = offset
            have = {}
            count = 0
            r = offset
            while r + L <= n:
                word = s[r:r + L]
                r += L
                if word in need:
                    have[word] = have.get(word, 0) + 1
                    count += 1
                    while have[word] > need[word]:
                        left_word = s[l:l + L]
                        have[left_word] -= 1
                        l += L
                        count -= 1
                    if count == k:
                        result.append(l)
                        left_word = s[l:l + L]
                        have[left_word] -= 1
                        l += L
                        count -= 1
                else:
                    have.clear()
                    count = 0
                    l = r
        return result
$PY$,
$JS$var findSubstring = function(s, words) {
    if (!s || words.length === 0) return [];
    const L = words[0].length;
    const k = words.length;
    const need = new Map();
    for (const w of words) need.set(w, (need.get(w) || 0) + 1);
    const result = [];
    const n = s.length;
    for (let offset = 0; offset < L; offset++) {
        let l = offset, count = 0;
        const have = new Map();
        let r = offset;
        while (r + L <= n) {
            const word = s.slice(r, r + L);
            r += L;
            if (need.has(word)) {
                have.set(word, (have.get(word) || 0) + 1);
                count++;
                while (have.get(word) > need.get(word)) {
                    const left = s.slice(l, l + L);
                    have.set(left, have.get(left) - 1);
                    l += L;
                    count--;
                }
                if (count === k) {
                    result.push(l);
                    const left = s.slice(l, l + L);
                    have.set(left, have.get(left) - 1);
                    l += L;
                    count--;
                }
            } else {
                have.clear();
                count = 0;
                l = r;
            }
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> findSubstring(String s, String[] words) {
        List<Integer> result = new ArrayList<>();
        if (s == null || s.isEmpty() || words.length == 0) return result;
        int L = words[0].length();
        int k = words.length;
        Map<String, Integer> need = new HashMap<>();
        for (String w : words) need.merge(w, 1, Integer::sum);
        int n = s.length();
        for (int offset = 0; offset < L; offset++) {
            int l = offset, count = 0;
            Map<String, Integer> have = new HashMap<>();
            for (int r = offset; r + L <= n; ) {
                String word = s.substring(r, r + L);
                r += L;
                if (need.containsKey(word)) {
                    have.merge(word, 1, Integer::sum);
                    count++;
                    while (have.get(word) > need.get(word)) {
                        String left = s.substring(l, l + L);
                        have.merge(left, -1, Integer::sum);
                        l += L;
                        count--;
                    }
                    if (count == k) {
                        result.add(l);
                        String left = s.substring(l, l + L);
                        have.merge(left, -1, Integer::sum);
                        l += L;
                        count--;
                    }
                } else {
                    have.clear();
                    count = 0;
                    l = r;
                }
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> findSubstring(string& s, vector<string>& words) {
        vector<int> result;
        if (s.empty() || words.empty()) return result;
        int L = words[0].size();
        int k = words.size();
        unordered_map<string, int> need;
        for (const string& w : words) need[w]++;
        int n = s.size();
        for (int offset = 0; offset < L; offset++) {
            int l = offset, count = 0;
            unordered_map<string, int> have;
            for (int r = offset; r + L <= n; ) {
                string word = s.substr(r, L);
                r += L;
                auto it = need.find(word);
                if (it != need.end()) {
                    have[word]++;
                    count++;
                    while (have[word] > it->second) {
                        string left = s.substr(l, L);
                        have[left]--;
                        l += L;
                        count--;
                    }
                    if (count == k) {
                        result.push_back(l);
                        string left = s.substr(l, L);
                        have[left]--;
                        l += L;
                        count--;
                    }
                } else {
                    have.clear();
                    count = 0;
                    l = r;
                }
            }
        }
        return result;
    }
};
$CPP$,
'O(n * L)', 'O(k)');

COMMIT;
