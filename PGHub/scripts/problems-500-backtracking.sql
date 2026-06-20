-- Grow catalog 400 → 500: backtracking topic (+8 problems: 2E, 4M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'letter-case-permutation','binary-watch',
  'combination-sum-iii','splitting-a-string','fair-distribution-cookies','matchsticks-to-square',
  'sudoku-solver','word-squares'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'letter-case-permutation','binary-watch',
  'combination-sum-iii','splitting-a-string','fair-distribution-cookies','matchsticks-to-square',
  'sudoku-solver','word-squares'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'letter-case-permutation','binary-watch',
  'combination-sum-iii','splitting-a-string','fair-distribution-cookies','matchsticks-to-square',
  'sudoku-solver','word-squares'
);

-- ============================================================
-- 1) letter-case-permutation (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('letter-case-permutation', 'backtracking', 'Letter Case Permutation', 'Easy',
$$<p>Given a string <code>s</code>, you can transform every letter individually to be lowercase or uppercase to create another string. Return a list of all possible strings we could create. Return the output in <strong>any order</strong>.</p>$$,
'', ARRAY[
  'At each character position, if it is a letter you have two choices (lower/upper); if it is a digit you have one choice.',
  'Use backtracking: build the string character by character.',
  'The total number of results is 2^(number of letters).'
], '500', 'https://leetcode.com/problems/letter-case-permutation/',
'letterCasePermutation',
'[{"name":"s","type":"str"}]'::jsonb,
'List[str]',
'[
  {"inputs":["\"a1b2\""],"expected":"[\"a1b2\",\"a1B2\",\"A1b2\",\"A1B2\"]"},
  {"inputs":["\"3z4\""],"expected":"[\"3z4\",\"3Z4\"]"},
  {"inputs":["\"ab\""],"expected":"[\"ab\",\"aB\",\"Ab\",\"AB\"]"},
  {"inputs":["\"12\""],"expected":"[\"12\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('letter-case-permutation', 'python',
$PY$class Solution:
    def letterCasePermutation(self, s: str) -> List[str]:
        $PY$),
('letter-case-permutation', 'javascript',
$JS$var letterCasePermutation = function(s) {

};$JS$),
('letter-case-permutation', 'java',
$JAVA$class Solution {
    public List<String> letterCasePermutation(String s) {

    }
}$JAVA$),
('letter-case-permutation', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> letterCasePermutation(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('letter-case-permutation', 1, 'Backtracking',
'At each index, if the character is a letter we branch into two paths (lowercase and uppercase). If it is a digit we just continue. This naturally generates all 2^k permutations where k is the number of letters.',
'["Define backtrack(i, path).","If i == len(s), append path to results and return.","If s[i] is a digit, recurse with s[i] appended.","If s[i] is a letter, recurse with lowercase, then recurse with uppercase."]'::jsonb,
$PY$class Solution:
    def letterCasePermutation(self, s: str) -> List[str]:
        result = []
        def backtrack(i, path):
            if i == len(s):
                result.append("".join(path))
                return
            if s[i].isdigit():
                path.append(s[i])
                backtrack(i + 1, path)
                path.pop()
            else:
                path.append(s[i].lower())
                backtrack(i + 1, path)
                path.pop()
                path.append(s[i].upper())
                backtrack(i + 1, path)
                path.pop()
        backtrack(0, [])
        return result
$PY$,
$JS$var letterCasePermutation = function(s) {
    const result = [];
    const backtrack = (i, path) => {
        if (i === s.length) {
            result.push(path.join(""));
            return;
        }
        if (s[i] >= '0' && s[i] <= '9') {
            path.push(s[i]);
            backtrack(i + 1, path);
            path.pop();
        } else {
            path.push(s[i].toLowerCase());
            backtrack(i + 1, path);
            path.pop();
            path.push(s[i].toUpperCase());
            backtrack(i + 1, path);
            path.pop();
        }
    };
    backtrack(0, []);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> letterCasePermutation(String s) {
        List<String> result = new ArrayList<>();
        backtrack(s.toCharArray(), 0, result);
        return result;
    }
    private void backtrack(char[] arr, int i, List<String> result) {
        if (i == arr.length) {
            result.add(new String(arr));
            return;
        }
        if (Character.isDigit(arr[i])) {
            backtrack(arr, i + 1, result);
        } else {
            arr[i] = Character.toLowerCase(arr[i]);
            backtrack(arr, i + 1, result);
            arr[i] = Character.toUpperCase(arr[i]);
            backtrack(arr, i + 1, result);
        }
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> letterCasePermutation(string s) {
        vector<string> result;
        backtrack(s, 0, result);
        return result;
    }
    void backtrack(string& s, int i, vector<string>& result) {
        if (i == (int)s.size()) {
            result.push_back(s);
            return;
        }
        if (isdigit(s[i])) {
            backtrack(s, i + 1, result);
        } else {
            s[i] = tolower(s[i]);
            backtrack(s, i + 1, result);
            s[i] = toupper(s[i]);
            backtrack(s, i + 1, result);
        }
    }
};
$CPP$,
'O(2^k * n) where k = number of letters', 'O(n) recursion depth');

-- ============================================================
-- 2) binary-watch (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-watch', 'backtracking', 'Binary Watch', 'Easy',
$$<p>A binary watch has 4 LEDs on the top for hours (0-11) and 6 LEDs on the bottom for minutes (0-59). Given an integer <code>turnedOn</code> which represents the number of LEDs currently turned on, return all possible times the watch could represent. The output should be in <code>"h:mm"</code> format.</p>$$,
'', ARRAY[
  'Enumerate all (hour, minute) pairs and count the total number of 1-bits.',
  'If the bit count equals turnedOn, format and add to the result.',
  'Hours range 0-11, minutes 0-59.'
], '500', 'https://leetcode.com/problems/binary-watch/',
'readBinaryWatch',
'[{"name":"turnedOn","type":"int"}]'::jsonb,
'List[str]',
'[
  {"inputs":["1"],"expected":"[\"0:01\",\"0:02\",\"0:04\",\"0:08\",\"0:16\",\"0:32\",\"1:00\",\"2:00\",\"4:00\",\"8:00\"]"},
  {"inputs":["0"],"expected":"[\"0:00\"]"},
  {"inputs":["9"],"expected":"[]"},
  {"inputs":["2"],"expected":"[\"0:03\",\"0:05\",\"0:06\",\"0:09\",\"0:10\",\"0:12\",\"0:17\",\"0:18\",\"0:20\",\"0:24\",\"0:33\",\"0:34\",\"0:36\",\"0:40\",\"0:48\",\"1:01\",\"1:02\",\"1:04\",\"1:08\",\"1:16\",\"1:32\",\"2:01\",\"2:02\",\"2:04\",\"2:08\",\"2:16\",\"2:32\",\"3:00\",\"4:01\",\"4:02\",\"4:04\",\"4:08\",\"4:16\",\"4:32\",\"5:00\",\"6:00\",\"8:01\",\"8:02\",\"8:04\",\"8:08\",\"8:16\",\"8:32\",\"9:00\",\"10:00\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-watch', 'python',
$PY$class Solution:
    def readBinaryWatch(self, turnedOn: int) -> List[str]:
        $PY$),
('binary-watch', 'javascript',
$JS$var readBinaryWatch = function(turnedOn) {

};$JS$),
('binary-watch', 'java',
$JAVA$class Solution {
    public List<String> readBinaryWatch(int turnedOn) {

    }
}$JAVA$),
('binary-watch', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> readBinaryWatch(int turnedOn) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-watch', 1, 'Enumerate All Times',
'There are only 12 * 60 = 720 possible times. For each, count the number of 1-bits in the hour and minute combined. If it equals turnedOn, add that time to the result.',
'["For h from 0 to 11, for m from 0 to 59:","Count bits in h plus bits in m.","If total bits == turnedOn, format as h:mm and add to result.","Return result."]'::jsonb,
$PY$class Solution:
    def readBinaryWatch(self, turnedOn: int) -> List[str]:
        result = []
        for h in range(12):
            for m in range(60):
                if bin(h).count('1') + bin(m).count('1') == turnedOn:
                    result.append(f"{h}:{m:02d}")
        return result
$PY$,
$JS$var readBinaryWatch = function(turnedOn) {
    const result = [];
    for (let h = 0; h < 12; h++) {
        for (let m = 0; m < 60; m++) {
            const bits = (h.toString(2) + m.toString(2)).split('').filter(c => c === '1').length;
            if (bits === turnedOn) {
                result.push(h + ":" + (m < 10 ? "0" + m : m));
            }
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> readBinaryWatch(int turnedOn) {
        List<String> result = new ArrayList<>();
        for (int h = 0; h < 12; h++) {
            for (int m = 0; m < 60; m++) {
                if (Integer.bitCount(h) + Integer.bitCount(m) == turnedOn) {
                    result.add(h + ":" + (m < 10 ? "0" + m : "" + m));
                }
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<string> readBinaryWatch(int turnedOn) {
        vector<string> result;
        for (int h = 0; h < 12; h++) {
            for (int m = 0; m < 60; m++) {
                if (__builtin_popcount(h) + __builtin_popcount(m) == turnedOn) {
                    result.push_back(to_string(h) + ":" + (m < 10 ? "0" : "") + to_string(m));
                }
            }
        }
        return result;
    }
};
$CPP$,
'O(1) — bounded by 720 iterations', 'O(1)');

-- ============================================================
-- 3) combination-sum-iii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('combination-sum-iii', 'backtracking', 'Combination Sum III', 'Medium',
$$<p>Find all valid combinations of <code>k</code> numbers that sum up to <code>n</code> such that only numbers 1 through 9 are used, and each combination uses each number at most once. Return the list of all unique combinations.</p>$$,
'', ARRAY[
  'Backtrack choosing numbers from 1 to 9 in increasing order.',
  'At each step, choose the next number greater than the last chosen, decrement the remaining sum, and reduce k.',
  'Prune when remaining sum < 0 or k < 0.'
], '500', 'https://leetcode.com/problems/combination-sum-iii/',
'combinationSum3',
'[{"name":"k","type":"int"},{"name":"n","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["3","7"],"expected":"[[1,2,4]]"},
  {"inputs":["3","9"],"expected":"[[1,2,6],[1,3,5],[2,3,4]]"},
  {"inputs":["4","1"],"expected":"[]"},
  {"inputs":["2","18"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('combination-sum-iii', 'python',
$PY$class Solution:
    def combinationSum3(self, k: int, n: int) -> List[List[int]]:
        $PY$),
('combination-sum-iii', 'javascript',
$JS$var combinationSum3 = function(k, n) {

};$JS$),
('combination-sum-iii', 'java',
$JAVA$class Solution {
    public List<List<Integer>> combinationSum3(int k, int n) {

    }
}$JAVA$),
('combination-sum-iii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> combinationSum3(int k, int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('combination-sum-iii', 1, 'Backtracking with Pruning',
'We pick numbers in increasing order from 1 to 9 so each combination is unique and sorted. We prune branches where the remaining sum goes negative or we cannot pick enough numbers.',
$ALGO$["Define backtrack(start, remaining, path).","If len(path) == k and remaining == 0, add path to result.","If len(path) == k or remaining <= 0, return.","For i from start to 9: add i to path, recurse with (i+1, remaining-i, path), remove i."]$ALGO$::jsonb,
$PY$class Solution:
    def combinationSum3(self, k: int, n: int) -> List[List[int]]:
        result = []
        def backtrack(start, remaining, path):
            if len(path) == k and remaining == 0:
                result.append(path[:])
                return
            if len(path) == k or remaining <= 0:
                return
            for i in range(start, 10):
                path.append(i)
                backtrack(i + 1, remaining - i, path)
                path.pop()
        backtrack(1, n, [])
        return result
$PY$,
$JS$var combinationSum3 = function(k, n) {
    const result = [];
    const backtrack = (start, remaining, path) => {
        if (path.length === k && remaining === 0) {
            result.push([...path]);
            return;
        }
        if (path.length === k || remaining <= 0) return;
        for (let i = start; i <= 9; i++) {
            path.push(i);
            backtrack(i + 1, remaining - i, path);
            path.pop();
        }
    };
    backtrack(1, n, []);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> combinationSum3(int k, int n) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(1, n, k, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int start, int remaining, int k, List<Integer> path, List<List<Integer>> result) {
        if (path.size() == k && remaining == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        if (path.size() == k || remaining <= 0) return;
        for (int i = start; i <= 9; i++) {
            path.add(i);
            backtrack(i + 1, remaining - i, k, path, result);
            path.remove(path.size() - 1);
        }
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> combinationSum3(int k, int n) {
        vector<vector<int>> result;
        vector<int> path;
        backtrack(1, n, k, path, result);
        return result;
    }
    void backtrack(int start, int remaining, int k, vector<int>& path, vector<vector<int>>& result) {
        if ((int)path.size() == k && remaining == 0) {
            result.push_back(path);
            return;
        }
        if ((int)path.size() == k || remaining <= 0) return;
        for (int i = start; i <= 9; i++) {
            path.push_back(i);
            backtrack(i + 1, remaining - i, k, path, result);
            path.pop_back();
        }
    }
};
$CPP$,
'O(C(9,k))', 'O(k)');

-- ============================================================
-- 4) splitting-a-string (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('splitting-a-string', 'backtracking', 'Splitting a String Into Descending Consecutive Values', 'Medium',
$$<p>You are given a string <code>s</code> that consists of only digits. Check if we can split <code>s</code> into two or more substrings where the numeric values form a strictly descending sequence with consecutive difference of 1.</p>$$,
'', ARRAY[
  'Try every possible first number (every prefix of s).',
  'Then backtrack: the next number must be exactly first - 1, try to find it as the next prefix.',
  'If you reach the end of the string with at least 2 parts, return true.'
], '500', 'https://leetcode.com/problems/splitting-a-string-into-descending-consecutive-values/',
'splitString',
'[{"name":"s","type":"str"}]'::jsonb,
'bool',
'[
  {"inputs":["\"1234\""],"expected":"false"},
  {"inputs":["\"050043\""],"expected":"true"},
  {"inputs":["\"9080701\""],"expected":"false"},
  {"inputs":["\"10009998\""],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('splitting-a-string', 'python',
$PY$class Solution:
    def splitString(self, s: str) -> bool:
        $PY$),
('splitting-a-string', 'javascript',
$JS$var splitString = function(s) {

};$JS$),
('splitting-a-string', 'java',
$JAVA$class Solution {
    public boolean splitString(String s) {

    }
}$JAVA$),
('splitting-a-string', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool splitString(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('splitting-a-string', 1, 'Backtracking',
'We try every possible first number by taking prefixes. Then we recursively try to find the next number (prev - 1) as the next prefix. If we consume the entire string with 2 or more parts, we succeed.',
$ALGO$["Define backtrack(index, prev, count).","If index == len(s), return count >= 2.","For end from index+1 to len(s): parse s[index:end] as num. If num == prev - 1, recurse with (end, num, count+1). If match found, return true.","For the first call (prev = -1), try all prefixes as the first number."]$ALGO$::jsonb,
$PY$class Solution:
    def splitString(self, s: str) -> bool:
        def backtrack(index, prev, count):
            if index == len(s):
                return count >= 2
            for end in range(index + 1, len(s) + 1):
                num = int(s[index:end])
                if num > 10**18:
                    break
                if prev == -1 or num == prev - 1:
                    if backtrack(end, num, count + 1):
                        return True
            return False
        return backtrack(0, -1, 0)
$PY$,
$JS$var splitString = function(s) {
    const backtrack = (index, prev, count) => {
        if (index === s.length) return count >= 2;
        for (let end = index + 1; end <= s.length; end++) {
            const num = BigInt(s.substring(index, end));
            if (prev === -1n || num === prev - 1n) {
                if (backtrack(end, num, count + 1)) return true;
            }
        }
        return false;
    };
    return backtrack(0, -1n, 0);
};
$JS$,
$JAVA$class Solution {
    public boolean splitString(String s) {
        return backtrack(s, 0, -1, 0);
    }
    private boolean backtrack(String s, int index, long prev, int count) {
        if (index == s.length()) return count >= 2;
        long num = 0;
        for (int end = index; end < s.length(); end++) {
            num = num * 10 + (s.charAt(end) - '0');
            if (num < 0) break;
            if (prev == -1 || num == prev - 1) {
                if (backtrack(s, end + 1, num, count + 1)) return true;
            }
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool splitString(string s) {
        return backtrack(s, 0, -1, 0);
    }
    bool backtrack(string& s, int index, long long prev, int count) {
        if (index == (int)s.size()) return count >= 2;
        long long num = 0;
        for (int end = index; end < (int)s.size(); end++) {
            num = num * 10 + (s[end] - '0');
            if (num > 1e18) break;
            if (prev == -1 || num == prev - 1) {
                if (backtrack(s, end + 1, num, count + 1)) return true;
            }
        }
        return false;
    }
};
$CPP$,
'O(n^n) worst case, practically much less due to pruning', 'O(n)');

-- ============================================================
-- 5) fair-distribution-cookies (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('fair-distribution-cookies', 'backtracking', 'Fair Distribution of Cookies', 'Medium',
$$<p>You are given an integer array <code>cookies</code>, where <code>cookies[i]</code> denotes the number of cookies in the i-th bag, and an integer <code>k</code> denoting the number of children. Distribute all bags to children such that the <strong>unfairness</strong> (the maximum total cookies any single child gets) is minimized. Return the minimum unfairness.</p>$$,
'', ARRAY[
  'Try assigning each bag to each child via backtracking.',
  'Keep track of each child''s total and prune when current max already exceeds best answer.',
  'Sort cookies descending to prune earlier.'
], '500', 'https://leetcode.com/problems/fair-distribution-of-cookies/',
'distributeCookies',
'[{"name":"cookies","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[8,15,10,20,8]","2"],"expected":"31"},
  {"inputs":["[6,1,3,2,2,4,1,2]","3"],"expected":"7"},
  {"inputs":["[1,2,3]","3"],"expected":"3"},
  {"inputs":["[10]","1"],"expected":"10"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('fair-distribution-cookies', 'python',
$PY$class Solution:
    def distributeCookies(self, cookies: List[int], k: int) -> int:
        $PY$),
('fair-distribution-cookies', 'javascript',
$JS$var distributeCookies = function(cookies, k) {

};$JS$),
('fair-distribution-cookies', 'java',
$JAVA$class Solution {
    public int distributeCookies(int[] cookies, int k) {

    }
}$JAVA$),
('fair-distribution-cookies', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distributeCookies(vector<int>& cookies, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('fair-distribution-cookies', 1, 'Backtracking with Pruning',
'We assign each bag to one of k children. At each step we try assigning the current bag to each child, tracking per-child totals. We prune when the current maximum already exceeds our best known answer. Sorting cookies descending helps prune early.',
$ALGO$["Sort cookies descending. Initialize children array of size k to 0, best = sum(cookies).","Define backtrack(i): if i == len(cookies), update best = min(best, max(children)). Otherwise for each child j: if children[j] + cookies[i] < best, assign and recurse, then undo. Skip duplicate children values.","Return best."]$ALGO$::jsonb,
$PY$class Solution:
    def distributeCookies(self, cookies: List[int], k: int) -> int:
        cookies.sort(reverse=True)
        children = [0] * k
        self.best = sum(cookies)
        def backtrack(i):
            if i == len(cookies):
                self.best = min(self.best, max(children))
                return
            seen = set()
            for j in range(k):
                if children[j] in seen:
                    continue
                if children[j] + cookies[i] >= self.best:
                    continue
                seen.add(children[j])
                children[j] += cookies[i]
                backtrack(i + 1)
                children[j] -= cookies[i]
        backtrack(0)
        return self.best
$PY$,
$JS$var distributeCookies = function(cookies, k) {
    cookies.sort((a, b) => b - a);
    const children = new Array(k).fill(0);
    let best = cookies.reduce((a, b) => a + b, 0);
    const backtrack = (i) => {
        if (i === cookies.length) {
            best = Math.min(best, Math.max(...children));
            return;
        }
        const seen = new Set();
        for (let j = 0; j < k; j++) {
            if (seen.has(children[j])) continue;
            if (children[j] + cookies[i] >= best) continue;
            seen.add(children[j]);
            children[j] += cookies[i];
            backtrack(i + 1);
            children[j] -= cookies[i];
        }
    };
    backtrack(0);
    return best;
};
$JS$,
$JAVA$class Solution {
    int best;
    public int distributeCookies(int[] cookies, int k) {
        Arrays.sort(cookies);
        for (int l = 0, r = cookies.length - 1; l < r; l++, r--) {
            int tmp = cookies[l]; cookies[l] = cookies[r]; cookies[r] = tmp;
        }
        int[] children = new int[k];
        best = 0;
        for (int c : cookies) best += c;
        backtrack(cookies, children, 0, k);
        return best;
    }
    private void backtrack(int[] cookies, int[] children, int i, int k) {
        if (i == cookies.length) {
            int mx = 0;
            for (int c : children) mx = Math.max(mx, c);
            best = Math.min(best, mx);
            return;
        }
        Set<Integer> seen = new HashSet<>();
        for (int j = 0; j < k; j++) {
            if (seen.contains(children[j])) continue;
            if (children[j] + cookies[i] >= best) continue;
            seen.add(children[j]);
            children[j] += cookies[i];
            backtrack(cookies, children, i + 1, k);
            children[j] -= cookies[i];
        }
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int best;
    int distributeCookies(vector<int>& cookies, int k) {
        sort(cookies.rbegin(), cookies.rend());
        vector<int> children(k, 0);
        best = 0;
        for (int c : cookies) best += c;
        backtrack(cookies, children, 0, k);
        return best;
    }
    void backtrack(vector<int>& cookies, vector<int>& children, int i, int k) {
        if (i == (int)cookies.size()) {
            best = min(best, *max_element(children.begin(), children.end()));
            return;
        }
        unordered_set<int> seen;
        for (int j = 0; j < k; j++) {
            if (seen.count(children[j])) continue;
            if (children[j] + cookies[i] >= best) continue;
            seen.insert(children[j]);
            children[j] += cookies[i];
            backtrack(cookies, children, i + 1, k);
            children[j] -= cookies[i];
        }
    }
};
$CPP$,
'O(k^n) where n = number of bags', 'O(n + k)');

-- ============================================================
-- 6) matchsticks-to-square (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('matchsticks-to-square', 'backtracking', 'Matchsticks to Square', 'Medium',
$$<p>You are given an integer array <code>matchsticks</code> where <code>matchsticks[i]</code> is the length of the i-th matchstick. You want to use all the matchsticks to make one square. You should not break any stick, but you can link them up. Return <code>true</code> if you can make this square and <code>false</code> otherwise.</p>$$,
'', ARRAY[
  'The total sum must be divisible by 4; each side has length sum/4.',
  'Sort matchsticks descending for early pruning.',
  'Backtrack: assign each matchstick to one of 4 sides, prune if a side exceeds target.'
], '500', 'https://leetcode.com/problems/matchsticks-to-square/',
'makesquare',
'[{"name":"matchsticks","type":"List[int]"}]'::jsonb,
'bool',
'[
  {"inputs":["[1,1,2,2,2]"],"expected":"true"},
  {"inputs":["[3,3,3,3,4]"],"expected":"false"},
  {"inputs":["[5,5,5,5,4,4,4,4,3,3,3,3]"],"expected":"true"},
  {"inputs":["[1,2,3,4,5,6,7,8,9,10]"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('matchsticks-to-square', 'python',
$PY$class Solution:
    def makesquare(self, matchsticks: List[int]) -> bool:
        $PY$),
('matchsticks-to-square', 'javascript',
$JS$var makesquare = function(matchsticks) {

};$JS$),
('matchsticks-to-square', 'java',
$JAVA$class Solution {
    public boolean makesquare(int[] matchsticks) {

    }
}$JAVA$),
('matchsticks-to-square', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool makesquare(vector<int>& matchsticks) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('matchsticks-to-square', 1, 'Backtracking with 4 Sides',
'We partition matchsticks into 4 groups each summing to total/4. Sorting descending and assigning each matchstick to a side with backtracking, pruning when a side exceeds the target, makes this feasible for typical input sizes.',
$ALGO$["If total sum is not divisible by 4, return false. Target = sum / 4.","Sort matchsticks descending.","Define backtrack(i, sides[4]). If i == len(matchsticks), return all sides == target.","For each side j from 0 to 3: if sides[j] + matchsticks[i] <= target, add and recurse. Skip duplicate side values."]$ALGO$::jsonb,
$PY$class Solution:
    def makesquare(self, matchsticks: List[int]) -> bool:
        total = sum(matchsticks)
        if total % 4 != 0:
            return False
        target = total // 4
        matchsticks.sort(reverse=True)
        sides = [0] * 4
        def backtrack(i):
            if i == len(matchsticks):
                return all(s == target for s in sides)
            seen = set()
            for j in range(4):
                if sides[j] in seen:
                    continue
                if sides[j] + matchsticks[i] <= target:
                    seen.add(sides[j])
                    sides[j] += matchsticks[i]
                    if backtrack(i + 1):
                        return True
                    sides[j] -= matchsticks[i]
            return False
        return backtrack(0)
$PY$,
$JS$var makesquare = function(matchsticks) {
    const total = matchsticks.reduce((a, b) => a + b, 0);
    if (total % 4 !== 0) return false;
    const target = total / 4;
    matchsticks.sort((a, b) => b - a);
    const sides = [0, 0, 0, 0];
    const backtrack = (i) => {
        if (i === matchsticks.length) return sides.every(s => s === target);
        const seen = new Set();
        for (let j = 0; j < 4; j++) {
            if (seen.has(sides[j])) continue;
            if (sides[j] + matchsticks[i] <= target) {
                seen.add(sides[j]);
                sides[j] += matchsticks[i];
                if (backtrack(i + 1)) return true;
                sides[j] -= matchsticks[i];
            }
        }
        return false;
    };
    return backtrack(0);
};
$JS$,
$JAVA$class Solution {
    public boolean makesquare(int[] matchsticks) {
        int total = 0;
        for (int m : matchsticks) total += m;
        if (total % 4 != 0) return false;
        int target = total / 4;
        Arrays.sort(matchsticks);
        for (int l = 0, r = matchsticks.length - 1; l < r; l++, r--) {
            int t = matchsticks[l]; matchsticks[l] = matchsticks[r]; matchsticks[r] = t;
        }
        return backtrack(matchsticks, new int[4], 0, target);
    }
    private boolean backtrack(int[] m, int[] sides, int i, int target) {
        if (i == m.length) {
            for (int s : sides) if (s != target) return false;
            return true;
        }
        Set<Integer> seen = new HashSet<>();
        for (int j = 0; j < 4; j++) {
            if (seen.contains(sides[j])) continue;
            if (sides[j] + m[i] <= target) {
                seen.add(sides[j]);
                sides[j] += m[i];
                if (backtrack(m, sides, i + 1, target)) return true;
                sides[j] -= m[i];
            }
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool makesquare(vector<int>& matchsticks) {
        int total = 0;
        for (int m : matchsticks) total += m;
        if (total % 4 != 0) return false;
        int target = total / 4;
        sort(matchsticks.rbegin(), matchsticks.rend());
        vector<int> sides(4, 0);
        return backtrack(matchsticks, sides, 0, target);
    }
    bool backtrack(vector<int>& m, vector<int>& sides, int i, int target) {
        if (i == (int)m.size()) {
            for (int s : sides) if (s != target) return false;
            return true;
        }
        unordered_set<int> seen;
        for (int j = 0; j < 4; j++) {
            if (seen.count(sides[j])) continue;
            if (sides[j] + m[i] <= target) {
                seen.insert(sides[j]);
                sides[j] += m[i];
                if (backtrack(m, sides, i + 1, target)) return true;
                sides[j] -= m[i];
            }
        }
        return false;
    }
};
$CPP$,
'O(4^n)', 'O(n)');

-- ============================================================
-- 7) sudoku-solver (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('sudoku-solver', 'backtracking', 'Sudoku Solver', 'Hard',
$$<p>Write a program to solve a Sudoku puzzle by filling the empty cells. A sudoku solution must satisfy all of the following rules: each of the digits 1-9 must occur exactly once in each row, each column, and each of the 9 3x3 sub-boxes. The character <code>'.'</code> indicates an empty cell.</p><p>Given a partially filled board, return the solved board as a 9x9 grid of strings.</p>$$,
'', ARRAY[
  'Use sets/bitmasks to track which digits are used in each row, column, and box.',
  'Find the first empty cell, try digits 1-9, check constraints, and recurse.',
  'Backtrack if no valid digit works for a cell.'
], '500', 'https://leetcode.com/problems/sudoku-solver/',
'solveSudoku',
'[{"name":"board","type":"List[List[str]]"}]'::jsonb,
'List[List[str]]',
'[
  {"inputs":["[[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"],[\"6\",\".\",\".\",\"1\",\"9\",\"5\",\".\",\".\",\".\"],[\".\",\"9\",\"8\",\".\",\".\",\".\",\".\",\"6\",\".\"],[\"8\",\".\",\".\",\".\",\"6\",\".\",\".\",\".\",\"3\"],[\"4\",\".\",\".\",\"8\",\".\",\"3\",\".\",\".\",\"1\"],[\"7\",\".\",\".\",\".\",\"2\",\".\",\".\",\".\",\"6\"],[\".\",\"6\",\".\",\".\",\".\",\".\",\"2\",\"8\",\".\"],[\".\",\".\",\".\",\"4\",\"1\",\"9\",\".\",\".\",\"5\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\"7\",\"9\"]]"],"expected":"[[\"5\",\"3\",\"4\",\"6\",\"7\",\"8\",\"9\",\"1\",\"2\"],[\"6\",\"7\",\"2\",\"1\",\"9\",\"5\",\"3\",\"4\",\"8\"],[\"1\",\"9\",\"8\",\"3\",\"4\",\"2\",\"5\",\"6\",\"7\"],[\"8\",\"5\",\"9\",\"7\",\"6\",\"1\",\"4\",\"2\",\"3\"],[\"4\",\"2\",\"6\",\"8\",\"5\",\"3\",\"7\",\"9\",\"1\"],[\"7\",\"1\",\"3\",\"9\",\"2\",\"4\",\"8\",\"5\",\"6\"],[\"9\",\"6\",\"1\",\"5\",\"3\",\"7\",\"2\",\"8\",\"4\"],[\"2\",\"8\",\"7\",\"4\",\"1\",\"9\",\"6\",\"3\",\"5\"],[\"3\",\"4\",\"5\",\"2\",\"8\",\"6\",\"1\",\"7\",\"9\"]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('sudoku-solver', 'python',
$PY$class Solution:
    def solveSudoku(self, board: List[List[str]]) -> List[List[str]]:
        $PY$),
('sudoku-solver', 'javascript',
$JS$var solveSudoku = function(board) {

};$JS$),
('sudoku-solver', 'java',
$JAVA$class Solution {
    public String[][] solveSudoku(String[][] board) {

    }
}$JAVA$),
('sudoku-solver', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<string>> solveSudoku(vector<vector<string>>& board) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('sudoku-solver', 1, 'Backtracking with Constraint Sets',
'Maintain sets of used digits for each row, column, and 3x3 box. For each empty cell, try placing digits 1-9 that do not violate any constraint. If we fill all cells, we have a solution; otherwise backtrack.',
$ALGO$["Initialize rows, cols, boxes as sets from existing digits.","Find the first empty cell (dot).","Try digits 1-9: if digit not in row/col/box set, place it, add to sets, recurse.","If recursion succeeds, return true. Otherwise remove digit and try next.","If no digit works, return false (backtrack)."]$ALGO$::jsonb,
$PY$class Solution:
    def solveSudoku(self, board: List[List[str]]) -> List[List[str]]:
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]
        empty = []
        for i in range(9):
            for j in range(9):
                if board[i][j] == '.':
                    empty.append((i, j))
                else:
                    d = board[i][j]
                    rows[i].add(d)
                    cols[j].add(d)
                    boxes[(i // 3) * 3 + j // 3].add(d)
        def solve(idx):
            if idx == len(empty):
                return True
            r, c = empty[idx]
            b = (r // 3) * 3 + c // 3
            for d in '123456789':
                if d not in rows[r] and d not in cols[c] and d not in boxes[b]:
                    board[r][c] = d
                    rows[r].add(d)
                    cols[c].add(d)
                    boxes[b].add(d)
                    if solve(idx + 1):
                        return True
                    board[r][c] = '.'
                    rows[r].remove(d)
                    cols[c].remove(d)
                    boxes[b].remove(d)
            return False
        solve(0)
        return board
$PY$,
$JS$var solveSudoku = function(board) {
    const rows = Array.from({length: 9}, () => new Set());
    const cols = Array.from({length: 9}, () => new Set());
    const boxes = Array.from({length: 9}, () => new Set());
    const empty = [];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === '.') {
                empty.push([i, j]);
            } else {
                rows[i].add(board[i][j]);
                cols[j].add(board[i][j]);
                boxes[Math.floor(i/3)*3 + Math.floor(j/3)].add(board[i][j]);
            }
        }
    }
    const solve = (idx) => {
        if (idx === empty.length) return true;
        const [r, c] = empty[idx];
        const b = Math.floor(r/3)*3 + Math.floor(c/3);
        for (let d = 1; d <= 9; d++) {
            const ds = String(d);
            if (!rows[r].has(ds) && !cols[c].has(ds) && !boxes[b].has(ds)) {
                board[r][c] = ds;
                rows[r].add(ds); cols[c].add(ds); boxes[b].add(ds);
                if (solve(idx + 1)) return true;
                board[r][c] = '.';
                rows[r].delete(ds); cols[c].delete(ds); boxes[b].delete(ds);
            }
        }
        return false;
    };
    solve(0);
    return board;
};
$JS$,
$JAVA$class Solution {
    public String[][] solveSudoku(String[][] board) {
        boolean[][] rows = new boolean[9][10];
        boolean[][] cols = new boolean[9][10];
        boolean[][] boxes = new boolean[9][10];
        List<int[]> empty = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                if (board[i][j].equals(".")) {
                    empty.add(new int[]{i, j});
                } else {
                    int d = Integer.parseInt(board[i][j]);
                    rows[i][d] = cols[j][d] = boxes[(i/3)*3+j/3][d] = true;
                }
            }
        }
        solve(board, rows, cols, boxes, empty, 0);
        return board;
    }
    private boolean solve(String[][] board, boolean[][] rows, boolean[][] cols, boolean[][] boxes, List<int[]> empty, int idx) {
        if (idx == empty.size()) return true;
        int r = empty.get(idx)[0], c = empty.get(idx)[1];
        int b = (r/3)*3 + c/3;
        for (int d = 1; d <= 9; d++) {
            if (!rows[r][d] && !cols[c][d] && !boxes[b][d]) {
                board[r][c] = String.valueOf(d);
                rows[r][d] = cols[c][d] = boxes[b][d] = true;
                if (solve(board, rows, cols, boxes, empty, idx + 1)) return true;
                board[r][c] = ".";
                rows[r][d] = cols[c][d] = boxes[b][d] = false;
            }
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<string>> solveSudoku(vector<vector<string>>& board) {
        bool rows[9][10] = {}, cols[9][10] = {}, boxes[9][10] = {};
        vector<pair<int,int>> empty;
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                if (board[i][j] == ".") {
                    empty.push_back({i, j});
                } else {
                    int d = stoi(board[i][j]);
                    rows[i][d] = cols[j][d] = boxes[(i/3)*3+j/3][d] = true;
                }
            }
        }
        solve(board, rows, cols, boxes, empty, 0);
        return board;
    }
    bool solve(vector<vector<string>>& board, bool rows[][10], bool cols[][10], bool boxes[][10], vector<pair<int,int>>& empty, int idx) {
        if (idx == (int)empty.size()) return true;
        auto [r, c] = empty[idx];
        int b = (r/3)*3 + c/3;
        for (int d = 1; d <= 9; d++) {
            if (!rows[r][d] && !cols[c][d] && !boxes[b][d]) {
                board[r][c] = to_string(d);
                rows[r][d] = cols[c][d] = boxes[b][d] = true;
                if (solve(board, rows, cols, boxes, empty, idx + 1)) return true;
                board[r][c] = ".";
                rows[r][d] = cols[c][d] = boxes[b][d] = false;
            }
        }
        return false;
    }
};
$CPP$,
'O(9^E) where E = empty cells', 'O(E)');

-- ============================================================
-- 8) word-squares (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('word-squares', 'backtracking', 'Word Squares', 'Hard',
$$<p>Given an array of <strong>unique</strong> strings <code>words</code>, return all <strong>word squares</strong> you can build from them. A word square is a sequence of words where the k-th row and k-th column read the same string. Each word in <code>words</code> has the same length.</p>$$,
'', ARRAY[
  'Build a trie or prefix map from all words for fast prefix lookup.',
  'Place words row by row. When placing row k, the required prefix is formed by taking column k from rows 0..k-1.',
  'Backtrack through all words matching the required prefix.'
], '500', 'https://leetcode.com/problems/word-squares/',
'wordSquares',
'[{"name":"words","type":"List[str]"}]'::jsonb,
'List[List[str]]',
'[
  {"inputs":["[\"area\",\"lead\",\"wall\",\"lady\",\"ball\"]"],"expected":"[[\"ball\",\"area\",\"lead\",\"lady\"],[\"wall\",\"area\",\"lead\",\"lady\"]]"},
  {"inputs":["[\"abat\",\"baba\",\"atan\",\"atal\"]"],"expected":"[[\"baba\",\"abat\",\"baba\",\"atan\"],[\"baba\",\"abat\",\"baba\",\"atal\"]]"},
  {"inputs":["[\"ab\",\"ba\"]"],"expected":"[[\"ab\",\"ba\"]]"},
  {"inputs":["[\"abc\"]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('word-squares', 'python',
$PY$class Solution:
    def wordSquares(self, words: List[str]) -> List[List[str]]:
        $PY$),
('word-squares', 'javascript',
$JS$var wordSquares = function(words) {

};$JS$),
('word-squares', 'java',
$JAVA$class Solution {
    public List<List<String>> wordSquares(String[] words) {

    }
}$JAVA$),
('word-squares', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<string>> wordSquares(vector<string>& words) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('word-squares', 1, 'Backtracking with Prefix Map',
'Build a prefix-to-words map. Place words row by row. When placing row k, the required prefix for the next word is the characters at column k from rows 0..k-1. Look up all words with that prefix and try each one.',
$ALGO$["Build a map: prefix -> list of words, for all prefixes of each word.","Define backtrack(square). If len(square) == word_length, add square to results.","Otherwise, k = len(square). Build prefix from square[0][k], square[1][k], ..., square[k-1][k].","For each word matching the prefix, add to square and recurse, then remove."]$ALGO$::jsonb,
$PY$class Solution:
    def wordSquares(self, words: List[str]) -> List[List[str]]:
        from collections import defaultdict
        n = len(words[0])
        prefix_map = defaultdict(list)
        for w in words:
            for i in range(n):
                prefix_map[w[:i]].append(w)
        result = []
        def backtrack(square):
            if len(square) == n:
                result.append(square[:])
                return
            k = len(square)
            prefix = "".join(sq[k] for sq in square)
            for w in prefix_map.get(prefix, []):
                square.append(w)
                backtrack(square)
                square.pop()
        for w in words:
            backtrack([w])
        return result
$PY$,
$JS$var wordSquares = function(words) {
    const n = words[0].length;
    const prefixMap = {};
    for (const w of words) {
        for (let i = 0; i <= n; i++) {
            const p = w.substring(0, i);
            if (!prefixMap[p]) prefixMap[p] = [];
            prefixMap[p].push(w);
        }
    }
    const result = [];
    const backtrack = (square) => {
        if (square.length === n) {
            result.push([...square]);
            return;
        }
        const k = square.length;
        let prefix = "";
        for (let i = 0; i < k; i++) prefix += square[i][k];
        for (const w of (prefixMap[prefix] || [])) {
            square.push(w);
            backtrack(square);
            square.pop();
        }
    };
    for (const w of words) backtrack([w]);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<String>> wordSquares(String[] words) {
        int n = words[0].length();
        Map<String, List<String>> prefixMap = new HashMap<>();
        for (String w : words) {
            for (int i = 0; i <= n; i++) {
                String p = w.substring(0, i);
                prefixMap.computeIfAbsent(p, k -> new ArrayList<>()).add(w);
            }
        }
        List<List<String>> result = new ArrayList<>();
        for (String w : words) {
            List<String> square = new ArrayList<>();
            square.add(w);
            backtrack(square, n, prefixMap, result);
        }
        return result;
    }
    private void backtrack(List<String> square, int n, Map<String, List<String>> prefixMap, List<List<String>> result) {
        if (square.size() == n) {
            result.add(new ArrayList<>(square));
            return;
        }
        int k = square.size();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < k; i++) sb.append(square.get(i).charAt(k));
        String prefix = sb.toString();
        for (String w : prefixMap.getOrDefault(prefix, new ArrayList<>())) {
            square.add(w);
            backtrack(square, n, prefixMap, result);
            square.remove(square.size() - 1);
        }
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<string>> wordSquares(vector<string>& words) {
        int n = words[0].size();
        unordered_map<string, vector<string>> prefixMap;
        for (auto& w : words) {
            for (int i = 0; i <= n; i++) {
                prefixMap[w.substr(0, i)].push_back(w);
            }
        }
        vector<vector<string>> result;
        for (auto& w : words) {
            vector<string> square = {w};
            backtrack(square, n, prefixMap, result);
        }
        return result;
    }
    void backtrack(vector<string>& square, int n, unordered_map<string, vector<string>>& prefixMap, vector<vector<string>>& result) {
        if ((int)square.size() == n) {
            result.push_back(square);
            return;
        }
        int k = square.size();
        string prefix;
        for (int i = 0; i < k; i++) prefix += square[i][k];
        auto it = prefixMap.find(prefix);
        if (it == prefixMap.end()) return;
        for (auto& w : it->second) {
            square.push_back(w);
            backtrack(square, n, prefixMap, result);
            square.pop_back();
        }
    }
};
$CPP$,
'O(N * 26^L) worst case where L = word length', 'O(N * L)');

COMMIT;
