-- Grow catalog: dp topic (+5 problems) for roadmap_set='400'.
BEGIN;
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN ('perfect-squares','wiggle-subsequence','longest-string-chain','ones-and-zeroes','stone-game');
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN ('perfect-squares','wiggle-subsequence','longest-string-chain','ones-and-zeroes','stone-game');
DELETE FROM public."PGcode_problems" WHERE id IN ('perfect-squares','wiggle-subsequence','longest-string-chain','ones-and-zeroes','stone-game');

-- 1) perfect-squares (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('perfect-squares','dp','Perfect Squares','Medium',
$$<p>Given an integer <code>n</code>, return the least number of perfect square numbers that sum to <code>n</code>.</p>$$,
'',ARRAY['BFS or DP: dp[i] = 1 + min(dp[i - j*j]) for all j*j <= i.','Initialize dp[0]=0; build up to n.','Lagrange four-square theorem guarantees answer <= 4.'],
'400','https://leetcode.com/problems/perfect-squares/',
'numSquares','[{"name":"n","type":"int"}]'::jsonb,'int',
'[{"inputs":["12"],"expected":"3"},{"inputs":["13"],"expected":"2"},{"inputs":["1"],"expected":"1"},{"inputs":["7"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('perfect-squares','python',$PY$class Solution:
    def numSquares(self, n: int) -> int:
        $PY$),('perfect-squares','javascript',$JS$var numSquares = function(n) {
};$JS$),('perfect-squares','java',$JAVA$class Solution {
    public int numSquares(int n) {
    }
}$JAVA$),('perfect-squares','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int numSquares(int n) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('perfect-squares',1,'Bottom-Up DP','dp[i] = fewest squares summing to i. Try subtracting every j*j <= i.',
'["dp = [0]*(n+1).","For i from 1 to n: dp[i] = min(dp[i - j*j] + 1) for j in 1..sqrt(i).","Return dp[n]."]'::jsonb,
$PY$class Solution:
    def numSquares(self, n: int) -> int:
        dp = [0] * (n + 1)
        for i in range(1, n + 1):
            dp[i] = i
            j = 1
            while j * j <= i:
                dp[i] = min(dp[i], dp[i - j * j] + 1)
                j += 1
        return dp[n]
$PY$,$JS$var numSquares = function(n) {
    const dp = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
        dp[i] = i;
        for (let j = 1; j * j <= i; j++) dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
    }
    return dp[n];
};$JS$,$JAVA$class Solution {
    public int numSquares(int n) {
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            dp[i] = i;
            for (int j = 1; j * j <= i; j++) dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
        }
        return dp[n];
    }
}$JAVA$,$CPP$class Solution {
public:
    int numSquares(int n) {
        vector<int> dp(n + 1, 0);
        for (int i = 1; i <= n; i++) {
            dp[i] = i;
            for (int j = 1; j * j <= i; j++) dp[i] = min(dp[i], dp[i - j * j] + 1);
        }
        return dp[n];
    }
};$CPP$,'O(n * sqrt(n))','O(n)');

-- 2) wiggle-subsequence (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('wiggle-subsequence','dp','Wiggle Subsequence','Medium',
$$<p>A wiggle sequence alternates between rising and falling. Return the length of the longest wiggle subsequence of <code>nums</code>.</p>$$,
'',ARRAY['Track up and down: up = longest ending with a rise, down = longest ending with a fall.','When nums[i] > nums[i-1]: up = down + 1. When nums[i] < nums[i-1]: down = up + 1.','Single pass O(n).'],
'400','https://leetcode.com/problems/wiggle-subsequence/',
'wiggleMaxLength','[{"name":"nums","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[1,7,4,9,2,5]"],"expected":"6"},{"inputs":["[1,17,5,10,13,15,10,5,16,8]"],"expected":"7"},{"inputs":["[1,2,3,4,5]"],"expected":"2"},{"inputs":["[0]"],"expected":"1"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('wiggle-subsequence','python',$PY$class Solution:
    def wiggleMaxLength(self, nums: List[int]) -> int:
        $PY$),('wiggle-subsequence','javascript',$JS$var wiggleMaxLength = function(nums) {
};$JS$),('wiggle-subsequence','java',$JAVA$class Solution {
    public int wiggleMaxLength(int[] nums) {
    }
}$JAVA$),('wiggle-subsequence','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int wiggleMaxLength(vector<int>& nums) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('wiggle-subsequence',1,'Greedy Up/Down','Track two counters: up and down lengths.',
'["up = down = 1.","For i from 1 to n-1: if nums[i] > nums[i-1] then up = down + 1. If nums[i] < nums[i-1] then down = up + 1.","Return max(up, down)."]'::jsonb,
$PY$class Solution:
    def wiggleMaxLength(self, nums: List[int]) -> int:
        if len(nums) < 2:
            return len(nums)
        up = down = 1
        for i in range(1, len(nums)):
            if nums[i] > nums[i - 1]:
                up = down + 1
            elif nums[i] < nums[i - 1]:
                down = up + 1
        return max(up, down)
$PY$,$JS$var wiggleMaxLength = function(nums) {
    if (nums.length < 2) return nums.length;
    let up = 1, down = 1;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i-1]) up = down + 1;
        else if (nums[i] < nums[i-1]) down = up + 1;
    }
    return Math.max(up, down);
};$JS$,$JAVA$class Solution {
    public int wiggleMaxLength(int[] nums) {
        if (nums.length < 2) return nums.length;
        int up = 1, down = 1;
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] > nums[i-1]) up = down + 1;
            else if (nums[i] < nums[i-1]) down = up + 1;
        }
        return Math.max(up, down);
    }
}$JAVA$,$CPP$class Solution {
public:
    int wiggleMaxLength(vector<int>& nums) {
        if (nums.size() < 2) return nums.size();
        int up = 1, down = 1;
        for (int i = 1; i < (int)nums.size(); i++) {
            if (nums[i] > nums[i-1]) up = down + 1;
            else if (nums[i] < nums[i-1]) down = up + 1;
        }
        return max(up, down);
    }
};$CPP$,'O(n)','O(1)');

-- 3) longest-string-chain (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('longest-string-chain','dp','Longest String Chain','Medium',
$$<p>Given <code>words</code>, a word chain is a sequence where each word is formed by inserting exactly one letter into the previous word. Return the longest chain length.</p>$$,
'',ARRAY['Sort words by length.','For each word, try removing each character to form a predecessor.','DP: dp[word] = 1 + max(dp[predecessor]) for all valid predecessors.'],
'400','https://leetcode.com/problems/longest-string-chain/',
'longestStrChain','[{"name":"words","type":"List[str]"}]'::jsonb,'int',
'[{"inputs":["[\"a\",\"b\",\"ba\",\"bca\",\"bda\",\"bdca\"]"],"expected":"4"},{"inputs":["[\"xbc\",\"pcxbcf\",\"xb\",\"cxbc\",\"pcxbc\"]"],"expected":"5"},{"inputs":["[\"abcd\",\"dbqca\"]"],"expected":"1"},{"inputs":["[\"a\"]"],"expected":"1"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('longest-string-chain','python',$PY$class Solution:
    def longestStrChain(self, words: List[str]) -> int:
        $PY$),('longest-string-chain','javascript',$JS$var longestStrChain = function(words) {
};$JS$),('longest-string-chain','java',$JAVA$class Solution {
    public int longestStrChain(String[] words) {
    }
}$JAVA$),('longest-string-chain','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int longestStrChain(vector<string>& words) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('longest-string-chain',1,'Sort by Length + Predecessor DP','Sort words by length. For each word, remove one char at a time and check if the predecessor exists in the DP map.',
'["Sort words by length ascending.","dp = {} mapping word -> longest chain ending there.","For each word: dp[word] = 1 + max(dp.get(word[:i]+word[i+1:], 0)) for i in range(len(word)).","Return max(dp.values())."]'::jsonb,
$PY$class Solution:
    def longestStrChain(self, words: List[str]) -> int:
        words.sort(key=len)
        dp = {}
        best = 1
        for word in words:
            dp[word] = 1
            for i in range(len(word)):
                pred = word[:i] + word[i+1:]
                if pred in dp:
                    dp[word] = max(dp[word], dp[pred] + 1)
            best = max(best, dp[word])
        return best
$PY$,$JS$var longestStrChain = function(words) {
    words.sort((a, b) => a.length - b.length);
    const dp = new Map();
    let best = 1;
    for (const word of words) {
        dp.set(word, 1);
        for (let i = 0; i < word.length; i++) {
            const pred = word.slice(0, i) + word.slice(i + 1);
            if (dp.has(pred)) dp.set(word, Math.max(dp.get(word), dp.get(pred) + 1));
        }
        best = Math.max(best, dp.get(word));
    }
    return best;
};$JS$,$JAVA$class Solution {
    public int longestStrChain(String[] words) {
        Arrays.sort(words, (a, b) -> a.length() - b.length());
        Map<String, Integer> dp = new HashMap<>();
        int best = 1;
        for (String word : words) {
            dp.put(word, 1);
            for (int i = 0; i < word.length(); i++) {
                String pred = word.substring(0, i) + word.substring(i + 1);
                if (dp.containsKey(pred)) dp.put(word, Math.max(dp.get(word), dp.get(pred) + 1));
            }
            best = Math.max(best, dp.get(word));
        }
        return best;
    }
}$JAVA$,$CPP$class Solution {
public:
    int longestStrChain(vector<string>& words) {
        sort(words.begin(), words.end(), [](const string& a, const string& b) { return a.size() < b.size(); });
        unordered_map<string, int> dp;
        int best = 1;
        for (const string& word : words) {
            dp[word] = 1;
            for (int i = 0; i < (int)word.size(); i++) {
                string pred = word.substr(0, i) + word.substr(i + 1);
                auto it = dp.find(pred);
                if (it != dp.end()) dp[word] = max(dp[word], it->second + 1);
            }
            best = max(best, dp[word]);
        }
        return best;
    }
};$CPP$,'O(n * L^2)','O(n * L)');

-- 4) ones-and-zeroes (Medium) — renamed to avoid conflict
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('ones-and-zeroes','dp','Ones and Zeroes','Medium',
$$<p>Given an array of binary strings <code>strs</code> and integers <code>m</code> (max zeros) and <code>n</code> (max ones), return the size of the largest subset where the total zeros <= m and total ones <= n.</p>$$,
'',ARRAY['This is a 0/1 knapsack with two weight dimensions (zeros and ones).','dp[i][j] = max subset size using at most i zeros and j ones.','Process each string: count its zeros and ones, update dp in reverse.'],
'400','https://leetcode.com/problems/ones-and-zeroes/',
'findMaxForm','[{"name":"strs","type":"List[str]"},{"name":"m","type":"int"},{"name":"n","type":"int"}]'::jsonb,'int',
'[{"inputs":["[\"10\",\"0001\",\"111001\",\"1\",\"0\"]","5","3"],"expected":"4"},{"inputs":["[\"10\",\"0\",\"1\"]","1","1"],"expected":"2"},{"inputs":["[\"0\",\"0\",\"0\"]","2","0"],"expected":"2"},{"inputs":["[\"111\",\"000\"]","3","3"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('ones-and-zeroes','python',$PY$class Solution:
    def findMaxForm(self, strs: List[str], m: int, n: int) -> int:
        $PY$),('ones-and-zeroes','javascript',$JS$var findMaxForm = function(strs, m, n) {
};$JS$),('ones-and-zeroes','java',$JAVA$class Solution {
    public int findMaxForm(String[] strs, int m, int n) {
    }
}$JAVA$),('ones-and-zeroes','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int findMaxForm(vector<string>& strs, int m, int n) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('ones-and-zeroes',1,'2D Knapsack','Each string has a cost (zeros, ones). Maximize items fitting in budget (m, n).',
'["dp[i][j] = max subset using at most i zeros and j ones.","For each string s: count z = zeros, o = ones.","Update dp in reverse: for i from m down to z, j from n down to o: dp[i][j] = max(dp[i][j], dp[i-z][j-o] + 1)."]'::jsonb,
$PY$class Solution:
    def findMaxForm(self, strs: List[str], m: int, n: int) -> int:
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for s in strs:
            z = s.count('0')
            o = s.count('1')
            for i in range(m, z - 1, -1):
                for j in range(n, o - 1, -1):
                    dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)
        return dp[m][n]
$PY$,$JS$var findMaxForm = function(strs, m, n) {
    const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
    for (const s of strs) {
        let z = 0, o = 0;
        for (const c of s) { if (c === '0') z++; else o++; }
        for (let i = m; i >= z; i--) for (let j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i-z][j-o] + 1);
    }
    return dp[m][n];
};$JS$,$JAVA$class Solution {
    public int findMaxForm(String[] strs, int m, int n) {
        int[][] dp = new int[m+1][n+1];
        for (String s : strs) {
            int z = 0, o = 0;
            for (char c : s.toCharArray()) { if (c == '0') z++; else o++; }
            for (int i = m; i >= z; i--) for (int j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i-z][j-o] + 1);
        }
        return dp[m][n];
    }
}$JAVA$,$CPP$class Solution {
public:
    int findMaxForm(vector<string>& strs, int m, int n) {
        vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
        for (const string& s : strs) {
            int z = count(s.begin(), s.end(), '0');
            int o = s.size() - z;
            for (int i = m; i >= z; i--) for (int j = n; j >= o; j--) dp[i][j] = max(dp[i][j], dp[i-z][j-o] + 1);
        }
        return dp[m][n];
    }
};$CPP$,'O(L * m * n)','O(m * n)');

-- 5) stone-game (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('stone-game','dp','Stone Game','Easy',
$$<p>Alice and Bob play with piles of stones. They take turns (Alice first), each taking the entire first or last pile. Return <code>true</code> if Alice wins (gets more total stones). Both play optimally.</p>$$,
'',ARRAY['With an even number of piles, Alice can always win.','Alice can choose to take all even-indexed or all odd-indexed piles (by always picking from one side).','Since total is odd, one of those halves is strictly larger — Alice picks that strategy.'],
'400','https://leetcode.com/problems/stone-game/',
'stoneGame','[{"name":"piles","type":"List[int]"}]'::jsonb,'bool',
'[{"inputs":["[5,3,4,5]"],"expected":"true"},{"inputs":["[3,7,2,3]"],"expected":"true"},{"inputs":["[1,2]"],"expected":"true"},{"inputs":["[1,100,1,100]"],"expected":"true"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('stone-game','python',$PY$class Solution:
    def stoneGame(self, piles: List[int]) -> bool:
        $PY$),('stone-game','javascript',$JS$var stoneGame = function(piles) {
};$JS$),('stone-game','java',$JAVA$class Solution {
    public boolean stoneGame(int[] piles) {
    }
}$JAVA$),('stone-game','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    bool stoneGame(vector<int>& piles) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('stone-game',1,'Mathematical Proof','Alice always wins with even piles — she controls parity.',
'["Return True. Alice can always choose all even-indexed or all odd-indexed piles, and one set is strictly larger."]'::jsonb,
$PY$class Solution:
    def stoneGame(self, piles: List[int]) -> bool:
        return True
$PY$,$JS$var stoneGame = function(piles) {
    return true;
};$JS$,$JAVA$class Solution {
    public boolean stoneGame(int[] piles) {
        return true;
    }
}$JAVA$,$CPP$class Solution {
public:
    bool stoneGame(vector<int>& piles) {
        return true;
    }
};$CPP$,'O(1)','O(1)');

COMMIT;
