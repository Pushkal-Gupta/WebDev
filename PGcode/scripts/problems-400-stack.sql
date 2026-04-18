-- Grow catalog 300 -> 400: stack topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'baseball-game','backspace-string-compare','next-greater-element-ii',
  'simplify-path','online-stock-span','validate-stack-sequences',
  'score-of-parentheses','maximal-rectangle'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'baseball-game','backspace-string-compare','next-greater-element-ii',
  'simplify-path','online-stock-span','validate-stack-sequences',
  'score-of-parentheses','maximal-rectangle'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'baseball-game','backspace-string-compare','next-greater-element-ii',
  'simplify-path','online-stock-span','validate-stack-sequences',
  'score-of-parentheses','maximal-rectangle'
);

-- ============================================================
-- 1) baseball-game (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('baseball-game','stack','Baseball Game','Easy',
$$<p>You are keeping the scores of a baseball game with strange rules. At the beginning of the game, you start with an empty record.</p><p>You are given a list of <code>operations</code>, where each operation is one of the following:</p><ul><li>An integer <code>x</code> - record a new score of <code>x</code>.</li><li><code>"+"</code> - record a new score that is the sum of the previous two scores.</li><li><code>"D"</code> - record a new score that is the double of the previous score.</li><li><code>"C"</code> - invalidate the previous score, removing it from the record.</li></ul><p>Return the sum of all scores on the record after applying all operations.</p>$$,
'',ARRAY[
  'Use a stack to keep track of all valid scores.',
  'For C, pop the top. For D, push 2 * top. For the plus sign, push top + second-to-top.',
  'At the end, sum everything remaining in the stack.'
],'400','https://leetcode.com/problems/baseball-game/',
'calPoints','[{"name":"operations","type":"List[str]"}]'::jsonb,'int',
'[
  {"inputs":["[\"5\",\"2\",\"C\",\"D\",\"+\"]"],"expected":"30"},
  {"inputs":["[\"5\",\"-2\",\"4\",\"C\",\"D\",\"9\",\"+\",\"+\"]"],"expected":"27"},
  {"inputs":["[\"1\",\"C\"]"],"expected":"0"},
  {"inputs":["[\"1\"]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('baseball-game','python',
$PY$class Solution:
    def calPoints(self, operations: List[str]) -> int:
        $PY$),
('baseball-game','javascript',
$JS$/**
 * @param {string[]} operations
 * @return {number}
 */
var calPoints = function(operations) {

};$JS$),
('baseball-game','java',
$JAVA$class Solution {
    public int calPoints(String[] operations) {

    }
}$JAVA$),
('baseball-game','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calPoints(vector<string>& operations) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('baseball-game',1,'Stack Simulation',
'A stack naturally models the record: we push new scores and pop on invalidation. At the end, the answer is the sum of the stack.',
$ALGO$["Initialise an empty stack.","For each operation: if it is C pop the top; if it is D push 2 times the top; if it is the plus sign push the sum of the top two; otherwise push the integer value.","Return the sum of all elements in the stack."]$ALGO$::jsonb,
$PY$class Solution:
    def calPoints(self, operations: List[str]) -> int:
        stack = []
        for op in operations:
            if op == 'C':
                stack.pop()
            elif op == 'D':
                stack.append(2 * stack[-1])
            elif op == '+':
                stack.append(stack[-1] + stack[-2])
            else:
                stack.append(int(op))
        return sum(stack)
$PY$,
$JS$var calPoints = function(operations) {
    const stack = [];
    for (const op of operations) {
        if (op === 'C') stack.pop();
        else if (op === 'D') stack.push(2 * stack[stack.length - 1]);
        else if (op === '+') stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
        else stack.push(parseInt(op));
    }
    return stack.reduce((a, b) => a + b, 0);
};
$JS$,
$JAVA$class Solution {
    public int calPoints(String[] operations) {
        List<Integer> stack = new ArrayList<>();
        for (String op : operations) {
            int n = stack.size();
            if (op.equals("C")) stack.remove(n - 1);
            else if (op.equals("D")) stack.add(2 * stack.get(n - 1));
            else if (op.equals("+")) stack.add(stack.get(n - 1) + stack.get(n - 2));
            else stack.add(Integer.parseInt(op));
        }
        int sum = 0;
        for (int v : stack) sum += v;
        return sum;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calPoints(vector<string>& operations) {
        vector<int> stack;
        for (auto& op : operations) {
            int n = stack.size();
            if (op == "C") stack.pop_back();
            else if (op == "D") stack.push_back(2 * stack[n - 1]);
            else if (op == "+") stack.push_back(stack[n - 1] + stack[n - 2]);
            else stack.push_back(stoi(op));
        }
        int sum = 0;
        for (int v : stack) sum += v;
        return sum;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 2) backspace-string-compare (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('backspace-string-compare','stack','Backspace String Compare','Easy',
$$<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if they are equal when both are typed into empty text editors. <code>#</code> means a backspace character.</p><p>Note that after backspacing an empty text, the text will continue empty.</p>$$,
'',ARRAY[
  'Build the final string for each input using a stack: push characters and pop on #.',
  'Compare the two resulting stacks.',
  'An O(1) space approach walks both strings from the end, skipping backspaced characters.'
],'400','https://leetcode.com/problems/backspace-string-compare/',
'backspaceCompare','[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,'bool',
'[
  {"inputs":["\"ab#c\"","\"ad#c\""],"expected":"true"},
  {"inputs":["\"ab##\"","\"#a#c\""],"expected":"false"},
  {"inputs":["\"a#c\"","\"b\""],"expected":"false"},
  {"inputs":["\"y#fo##f\"","\"y#f#o##f\""],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('backspace-string-compare','python',
$PY$class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        $PY$),
('backspace-string-compare','javascript',
$JS$/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var backspaceCompare = function(s, t) {

};$JS$),
('backspace-string-compare','java',
$JAVA$class Solution {
    public boolean backspaceCompare(String s, String t) {

    }
}$JAVA$),
('backspace-string-compare','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool backspaceCompare(string s, string t) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('backspace-string-compare',1,'Stack Build',
'Simulate typing by pushing characters onto a stack and popping on backspace. Two strings are equal if their final stacks match.',
'["Define a helper that builds the final text using a stack: iterate the string, pop on #, push otherwise.","Build the result for both s and t.","Return whether the two results are equal."]'::jsonb,
$PY$class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        def build(st):
            stack = []
            for ch in st:
                if ch == '#':
                    if stack:
                        stack.pop()
                else:
                    stack.append(ch)
            return stack
        return build(s) == build(t)
$PY$,
$JS$var backspaceCompare = function(s, t) {
    function build(str) {
        const stack = [];
        for (const ch of str) {
            if (ch === '#') { if (stack.length) stack.pop(); }
            else stack.push(ch);
        }
        return stack.join('');
    }
    return build(s) === build(t);
};
$JS$,
$JAVA$class Solution {
    public boolean backspaceCompare(String s, String t) {
        return build(s).equals(build(t));
    }
    private String build(String str) {
        StringBuilder sb = new StringBuilder();
        for (char ch : str.toCharArray()) {
            if (ch == '#') { if (sb.length() > 0) sb.deleteCharAt(sb.length() - 1); }
            else sb.append(ch);
        }
        return sb.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool backspaceCompare(string s, string t) {
        auto build = [](const string& str) {
            string stack;
            for (char ch : str) {
                if (ch == '#') { if (!stack.empty()) stack.pop_back(); }
                else stack.push_back(ch);
            }
            return stack;
        };
        return build(s) == build(t);
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 3) next-greater-element-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('next-greater-element-ii','stack','Next Greater Element II','Medium',
$$<p>Given a circular integer array <code>nums</code> (i.e., the next element of <code>nums[nums.length - 1]</code> is <code>nums[0]</code>), return the <strong>next greater number</strong> for every element in <code>nums</code>.</p><p>The next greater number of a number <code>x</code> is the first greater number to its traversing-order next in the array, which means you could search circularly to find its next greater number. If it does not exist, return <code>-1</code> for this number.</p>$$,
'',ARRAY[
  'Use a monotonic decreasing stack that stores indices.',
  'To handle the circular nature, iterate through the array twice (indices 0 to 2n-1).',
  'While the current element is greater than the element at the stack top index, pop and record the answer.'
],'400','https://leetcode.com/problems/next-greater-element-ii/',
'nextGreaterElements','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[
  {"inputs":["[1,2,1]"],"expected":"[2,-1,2]"},
  {"inputs":["[1,2,3,4,3]"],"expected":"[2,3,4,-1,4]"},
  {"inputs":["[5,4,3,2,1]"],"expected":"[-1,5,5,5,5]"},
  {"inputs":["[1]"],"expected":"[-1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('next-greater-element-ii','python',
$PY$class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        $PY$),
('next-greater-element-ii','javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number[]}
 */
var nextGreaterElements = function(nums) {

};$JS$),
('next-greater-element-ii','java',
$JAVA$class Solution {
    public int[] nextGreaterElements(int[] nums) {

    }
}$JAVA$),
('next-greater-element-ii','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElements(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('next-greater-element-ii',1,'Monotonic Stack with Double Pass',
'A monotonic decreasing stack lets us pair each element with its next greater element in O(n). To handle the circular array, we iterate through the array twice so that every element gets a chance to see elements that wrap around.',
$ALGO$["Initialise result array of size n filled with -1 and an empty stack.","Loop i from 0 to 2n - 1. Use index i mod n to get the current value.","While the stack is not empty and nums[stack top] < current value, pop the index and set result[popped] = current value.","Only push i onto the stack when i < n (first pass).","Return the result array."]$ALGO$::jsonb,
$PY$class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        n = len(nums)
        res = [-1] * n
        stack = []
        for i in range(2 * n):
            while stack and nums[stack[-1]] < nums[i % n]:
                res[stack.pop()] = nums[i % n]
            if i < n:
                stack.append(i)
        return res
$PY$,
$JS$var nextGreaterElements = function(nums) {
    const n = nums.length;
    const res = new Array(n).fill(-1);
    const stack = [];
    for (let i = 0; i < 2 * n; i++) {
        while (stack.length && nums[stack[stack.length - 1]] < nums[i % n]) {
            res[stack.pop()] = nums[i % n];
        }
        if (i < n) stack.push(i);
    }
    return res;
};
$JS$,
$JAVA$class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        Arrays.fill(res, -1);
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < 2 * n; i++) {
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i % n]) {
                res[stack.pop()] = nums[i % n];
            }
            if (i < n) stack.push(i);
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> nextGreaterElements(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, -1);
        stack<int> st;
        for (int i = 0; i < 2 * n; i++) {
            while (!st.empty() && nums[st.top()] < nums[i % n]) {
                res[st.top()] = nums[i % n];
                st.pop();
            }
            if (i < n) st.push(i);
        }
        return res;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 4) simplify-path (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('simplify-path','stack','Simplify Path','Medium',
$$<p>Given an absolute path for a Unix-style file system, which begins with a slash <code>/</code>, transform this path into its <strong>simplified canonical path</strong>.</p><p>The rules are:</p><ul><li>A single period <code>.</code> refers to the current directory.</li><li>A double period <code>..</code> refers to the parent directory.</li><li>Multiple consecutive slashes are treated as a single slash.</li><li>Any other sequence of periods or characters is treated as a valid directory/file name.</li></ul><p>Return the simplified canonical path, which must start with <code>/</code> and have single slashes between directory names, with no trailing slash.</p>$$,
'',ARRAY[
  'Split the path by / and process each token.',
  'Use a stack: push valid directory names, pop on .., and ignore . and empty strings.',
  'Join the stack with / at the end.'
],'400','https://leetcode.com/problems/simplify-path/',
'simplifyPath','[{"name":"path","type":"str"}]'::jsonb,'str',
'[
  {"inputs":["\"/.../a/../b/c/../d/./\""],"expected":"\"/.../b/d\""},
  {"inputs":["\"/../\""],"expected":"\"/\""},
  {"inputs":["\"//home/\""],"expected":"\"/home\""},
  {"inputs":["\"//home//foo/\""],"expected":"\"/home/foo\""},
  {"inputs":["\"/a/./b/../../c/\""],"expected":"\"/c\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('simplify-path','python',
$PY$class Solution:
    def simplifyPath(self, path: str) -> str:
        $PY$),
('simplify-path','javascript',
$JS$/**
 * @param {string} path
 * @return {string}
 */
var simplifyPath = function(path) {

};$JS$),
('simplify-path','java',
$JAVA$class Solution {
    public String simplifyPath(String path) {

    }
}$JAVA$),
('simplify-path','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string simplifyPath(string path) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('simplify-path',1,'Stack of Directory Names',
'Splitting by / gives tokens. A stack naturally handles going up (..) with pop and going down with push. Dots and empty strings are no-ops.',
$ALGO$["Split path by the slash character.","Initialise an empty stack.","For each token: if it is .., pop the stack if non-empty; if it is . or empty, skip; otherwise push the token.","Join the stack with / and prepend a leading /."]$ALGO$::jsonb,
$PY$class Solution:
    def simplifyPath(self, path: str) -> str:
        stack = []
        for token in path.split('/'):
            if token == '..':
                if stack:
                    stack.pop()
            elif token and token != '.':
                stack.append(token)
        return '/' + '/'.join(stack)
$PY$,
$JS$var simplifyPath = function(path) {
    const stack = [];
    for (const token of path.split('/')) {
        if (token === '..') { if (stack.length) stack.pop(); }
        else if (token && token !== '.') stack.push(token);
    }
    return '/' + stack.join('/');
};
$JS$,
$JAVA$class Solution {
    public String simplifyPath(String path) {
        Deque<String> stack = new ArrayDeque<>();
        for (String token : path.split("/")) {
            if (token.equals("..")) { if (!stack.isEmpty()) stack.pollLast(); }
            else if (!token.isEmpty() && !token.equals(".")) stack.addLast(token);
        }
        StringBuilder sb = new StringBuilder();
        for (String dir : stack) sb.append("/").append(dir);
        return sb.length() == 0 ? "/" : sb.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string simplifyPath(string path) {
        vector<string> stack;
        stringstream ss(path);
        string token;
        while (getline(ss, token, '/')) {
            if (token == "..") { if (!stack.empty()) stack.pop_back(); }
            else if (!token.empty() && token != ".") stack.push_back(token);
        }
        string res;
        for (auto& d : stack) res += "/" + d;
        return res.empty() ? "/" : res;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 5) online-stock-span (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('online-stock-span','stack','Online Stock Span','Medium',
$$<p>Design an algorithm that collects daily price quotes for a stock and returns the <strong>span</strong> of that stock price for the current day.</p><p>The span of the stock price on a given day is the maximum number of consecutive days (starting from that day and going backward) for which the stock price was less than or equal to the price on that day.</p><p>Implement the <code>next(price)</code> method that returns the span of the current day price.</p><p>For this problem, you are given a list of prices and must return the list of spans.</p>$$,
'',ARRAY[
  'Use a monotonic decreasing stack of (price, span) pairs.',
  'When a new price comes in, pop all entries with price <= current and accumulate their spans.',
  'Push the current price with its accumulated span.'
],'400','https://leetcode.com/problems/online-stock-span/',
'stockSpan','[{"name":"prices","type":"List[int]"}]'::jsonb,'List[int]',
'[
  {"inputs":["[100,80,60,70,60,75,85]"],"expected":"[1,1,1,2,1,4,6]"},
  {"inputs":["[31,41,48,59,79]"],"expected":"[1,2,3,4,5]"},
  {"inputs":["[10]"],"expected":"[1]"},
  {"inputs":["[5,5,5,5]"],"expected":"[1,2,3,4]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('online-stock-span','python',
$PY$class Solution:
    def stockSpan(self, prices: List[int]) -> List[int]:
        $PY$),
('online-stock-span','javascript',
$JS$/**
 * @param {number[]} prices
 * @return {number[]}
 */
var stockSpan = function(prices) {

};$JS$),
('online-stock-span','java',
$JAVA$class Solution {
    public int[] stockSpan(int[] prices) {

    }
}$JAVA$),
('online-stock-span','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> stockSpan(vector<int>& prices) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('online-stock-span',1,'Monotonic Stack',
'We maintain a stack of (price, span) pairs in decreasing order. When a new price arrives, we pop all entries with price <= current, adding their spans to the current span. This gives amortised O(1) per call.',
$ALGO$["Initialise an empty stack and a result list.","For each price, set span = 1.","While the stack is not empty and the top price <= current price, pop and add the popped span to the current span.","Push (price, span) onto the stack and append span to the result.","Return the result list."]$ALGO$::jsonb,
$PY$class Solution:
    def stockSpan(self, prices: List[int]) -> List[int]:
        stack = []
        res = []
        for price in prices:
            span = 1
            while stack and stack[-1][0] <= price:
                span += stack.pop()[1]
            stack.append((price, span))
            res.append(span)
        return res
$PY$,
$JS$var stockSpan = function(prices) {
    const stack = [];
    const res = [];
    for (const price of prices) {
        let span = 1;
        while (stack.length && stack[stack.length - 1][0] <= price) {
            span += stack.pop()[1];
        }
        stack.push([price, span]);
        res.push(span);
    }
    return res;
};
$JS$,
$JAVA$class Solution {
    public int[] stockSpan(int[] prices) {
        Deque<int[]> stack = new ArrayDeque<>();
        int[] res = new int[prices.length];
        for (int i = 0; i < prices.length; i++) {
            int span = 1;
            while (!stack.isEmpty() && stack.peek()[0] <= prices[i]) {
                span += stack.pop()[1];
            }
            stack.push(new int[]{prices[i], span});
            res[i] = span;
        }
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> stockSpan(vector<int>& prices) {
        stack<pair<int,int>> st;
        vector<int> res;
        for (int price : prices) {
            int span = 1;
            while (!st.empty() && st.top().first <= price) {
                span += st.top().second;
                st.pop();
            }
            st.push({price, span});
            res.push_back(span);
        }
        return res;
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 6) validate-stack-sequences (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('validate-stack-sequences','stack','Validate Stack Sequences','Medium',
$$<p>Given two integer arrays <code>pushed</code> and <code>popped</code>, each with distinct values, return <code>true</code> if this could have been the result of a sequence of push and pop operations on an initially empty stack, or <code>false</code> otherwise.</p>$$,
'',ARRAY[
  'Simulate the process: push values from the pushed array one by one.',
  'After each push, greedily pop from the stack while the top matches the next value in popped.',
  'If the stack is empty at the end, the sequences are valid.'
],'400','https://leetcode.com/problems/validate-stack-sequences/',
'validateStackSequences','[{"name":"pushed","type":"List[int]"},{"name":"popped","type":"List[int]"}]'::jsonb,'bool',
'[
  {"inputs":["[1,2,3,4,5]","[4,5,3,2,1]"],"expected":"true"},
  {"inputs":["[1,2,3,4,5]","[4,3,5,1,2]"],"expected":"false"},
  {"inputs":["[1]","[1]"],"expected":"true"},
  {"inputs":["[1,2,3]","[3,2,1]"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('validate-stack-sequences','python',
$PY$class Solution:
    def validateStackSequences(self, pushed: List[int], popped: List[int]) -> bool:
        $PY$),
('validate-stack-sequences','javascript',
$JS$/**
 * @param {number[]} pushed
 * @param {number[]} popped
 * @return {boolean}
 */
var validateStackSequences = function(pushed, popped) {

};$JS$),
('validate-stack-sequences','java',
$JAVA$class Solution {
    public boolean validateStackSequences(int[] pushed, int[] popped) {

    }
}$JAVA$),
('validate-stack-sequences','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool validateStackSequences(vector<int>& pushed, vector<int>& popped) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('validate-stack-sequences',1,'Greedy Simulation',
'We simulate the stack: push each element and greedily pop whenever the top matches the next expected pop value. If we can empty the stack this way, the sequences are valid.',
'["Initialise an empty stack and a pointer j = 0 into the popped array.","For each value in pushed, push it onto the stack.","After pushing, while the stack is not empty and the top equals popped[j], pop and increment j.","Return whether the stack is empty at the end."]'::jsonb,
$PY$class Solution:
    def validateStackSequences(self, pushed: List[int], popped: List[int]) -> bool:
        stack = []
        j = 0
        for x in pushed:
            stack.append(x)
            while stack and stack[-1] == popped[j]:
                stack.pop()
                j += 1
        return not stack
$PY$,
$JS$var validateStackSequences = function(pushed, popped) {
    const stack = [];
    let j = 0;
    for (const x of pushed) {
        stack.push(x);
        while (stack.length && stack[stack.length - 1] === popped[j]) {
            stack.pop();
            j++;
        }
    }
    return stack.length === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean validateStackSequences(int[] pushed, int[] popped) {
        Deque<Integer> stack = new ArrayDeque<>();
        int j = 0;
        for (int x : pushed) {
            stack.push(x);
            while (!stack.isEmpty() && stack.peek() == popped[j]) {
                stack.pop();
                j++;
            }
        }
        return stack.isEmpty();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool validateStackSequences(vector<int>& pushed, vector<int>& popped) {
        stack<int> st;
        int j = 0;
        for (int x : pushed) {
            st.push(x);
            while (!st.empty() && st.top() == popped[j]) {
                st.pop();
                j++;
            }
        }
        return st.empty();
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 7) score-of-parentheses (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('score-of-parentheses','stack','Score of Parentheses','Medium',
$$<p>Given a balanced parentheses string <code>s</code>, return the <strong>score</strong> of the string.</p><p>The score is based on the following rule:</p><ul><li><code>"()"</code> has score 1.</li><li><code>AB</code> has score <code>A + B</code>, where A and B are balanced parentheses strings.</li><li><code>(A)</code> has score <code>2 * A</code>, where A is a balanced parentheses string.</li></ul>$$,
'',ARRAY[
  'Use a stack of integers to track the running score at each nesting depth.',
  'On ( push 0. On ) pop the top, compute max(2 * popped, 1), and add it to the new top.',
  'The answer is the single value left on the stack.'
],'400','https://leetcode.com/problems/score-of-parentheses/',
'scoreOfParentheses','[{"name":"s","type":"str"}]'::jsonb,'int',
'[
  {"inputs":["\"()\""],"expected":"1"},
  {"inputs":["\"(())\""],"expected":"2"},
  {"inputs":["\"()()\""],"expected":"2"},
  {"inputs":["\"(()(()))\""],"expected":"6"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('score-of-parentheses','python',
$PY$class Solution:
    def scoreOfParentheses(self, s: str) -> int:
        $PY$),
('score-of-parentheses','javascript',
$JS$/**
 * @param {string} s
 * @return {number}
 */
var scoreOfParentheses = function(s) {

};$JS$),
('score-of-parentheses','java',
$JAVA$class Solution {
    public int scoreOfParentheses(String s) {

    }
}$JAVA$),
('score-of-parentheses','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int scoreOfParentheses(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('score-of-parentheses',1,'Stack of Scores',
'We keep a stack where each entry represents the accumulated score at a nesting depth. Opening a bracket pushes a new depth. Closing a bracket computes the score for that depth (at least 1, otherwise double) and adds it to the parent depth.',
$ALGO$["Initialise a stack with a single 0 (base level score).","For each character in s: if it is an opening paren, push 0; if it is a closing paren, pop the top value v, compute max(2 * v, 1), and add the result to the new stack top.","Return the top of the stack."]$ALGO$::jsonb,
$PY$class Solution:
    def scoreOfParentheses(self, s: str) -> int:
        stack = [0]
        for ch in s:
            if ch == '(':
                stack.append(0)
            else:
                v = stack.pop()
                stack[-1] += max(2 * v, 1)
        return stack[0]
$PY$,
$JS$var scoreOfParentheses = function(s) {
    const stack = [0];
    for (const ch of s) {
        if (ch === '(') {
            stack.push(0);
        } else {
            const v = stack.pop();
            stack[stack.length - 1] += Math.max(2 * v, 1);
        }
    }
    return stack[0];
};
$JS$,
$JAVA$class Solution {
    public int scoreOfParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        for (char ch : s.toCharArray()) {
            if (ch == '(') {
                stack.push(0);
            } else {
                int v = stack.pop();
                stack.push(stack.pop() + Math.max(2 * v, 1));
            }
        }
        return stack.pop();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int scoreOfParentheses(string s) {
        stack<int> st;
        st.push(0);
        for (char ch : s) {
            if (ch == '(') {
                st.push(0);
            } else {
                int v = st.top(); st.pop();
                int top = st.top(); st.pop();
                st.push(top + max(2 * v, 1));
            }
        }
        return st.top();
    }
};
$CPP$,'O(n)','O(n)');

-- ============================================================
-- 8) maximal-rectangle (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('maximal-rectangle','stack','Maximal Rectangle','Hard',
$$<p>Given a <code>rows x cols</code> binary matrix filled with <code>0</code>s and <code>1</code>s, find the largest rectangle containing only <code>1</code>s and return its area.</p>$$,
'',ARRAY[
  'Build a histogram of heights for each row: if matrix[r][c] is 1, heights[c] += 1, else reset to 0.',
  'For each row, apply the Largest Rectangle in Histogram algorithm using a monotonic stack.',
  'Track the maximum area across all rows.'
],'400','https://leetcode.com/problems/maximal-rectangle/',
'maximalRectangle','[{"name":"matrix","type":"List[List[str]]"}]'::jsonb,'int',
'[
  {"inputs":["[[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]"],"expected":"6"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[[\"0\"]]"],"expected":"0"},
  {"inputs":["[[\"1\"]]"],"expected":"1"},
  {"inputs":["[[\"1\",\"1\"],[\"1\",\"1\"]]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('maximal-rectangle','python',
$PY$class Solution:
    def maximalRectangle(self, matrix: List[List[str]]) -> int:
        $PY$),
('maximal-rectangle','javascript',
$JS$/**
 * @param {character[][]} matrix
 * @return {number}
 */
var maximalRectangle = function(matrix) {

};$JS$),
('maximal-rectangle','java',
$JAVA$class Solution {
    public int maximalRectangle(char[][] matrix) {

    }
}$JAVA$),
('maximal-rectangle','cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('maximal-rectangle',1,'Histogram + Monotonic Stack',
'Each row can be treated as the base of a histogram where the height of each bar is the number of consecutive 1s above. Then the Largest Rectangle in Histogram algorithm (monotonic stack) finds the max rectangle for that row. The overall answer is the maximum across all rows.',
$ALGO$["If the matrix is empty, return 0. Initialise heights array of zeros with length = number of columns.","For each row, update heights: if cell is 1, increment height; otherwise reset to 0.","Apply the largest-rectangle-in-histogram subroutine using a monotonic stack on heights.","Track the global maximum area and return it."]$ALGO$::jsonb,
$PY$class Solution:
    def maximalRectangle(self, matrix: List[List[str]]) -> int:
        if not matrix or not matrix[0]:
            return 0
        cols = len(matrix[0])
        heights = [0] * cols
        max_area = 0
        for row in matrix:
            for j in range(cols):
                heights[j] = heights[j] + 1 if row[j] == '1' else 0
            max_area = max(max_area, self._largestRect(heights))
        return max_area

    def _largestRect(self, heights: List[int]) -> int:
        stack = []
        max_area = 0
        for i, h in enumerate(heights):
            start = i
            while stack and stack[-1][1] > h:
                idx, height = stack.pop()
                max_area = max(max_area, height * (i - idx))
                start = idx
            stack.append((start, h))
        for idx, height in stack:
            max_area = max(max_area, height * (len(heights) - idx))
        return max_area
$PY$,
$JS$var maximalRectangle = function(matrix) {
    if (!matrix.length || !matrix[0].length) return 0;
    const cols = matrix[0].length;
    const heights = new Array(cols).fill(0);
    let maxArea = 0;
    for (const row of matrix) {
        for (let j = 0; j < cols; j++) {
            heights[j] = row[j] === '1' ? heights[j] + 1 : 0;
        }
        maxArea = Math.max(maxArea, largestRect(heights));
    }
    return maxArea;
};
function largestRect(heights) {
    const stack = [];
    let maxArea = 0;
    for (let i = 0; i < heights.length; i++) {
        let start = i;
        while (stack.length && stack[stack.length - 1][1] > heights[i]) {
            const [idx, h] = stack.pop();
            maxArea = Math.max(maxArea, h * (i - idx));
            start = idx;
        }
        stack.push([start, heights[i]]);
    }
    for (const [idx, h] of stack) {
        maxArea = Math.max(maxArea, h * (heights.length - idx));
    }
    return maxArea;
}
$JS$,
$JAVA$class Solution {
    public int maximalRectangle(char[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return 0;
        int cols = matrix[0].length;
        int[] heights = new int[cols];
        int maxArea = 0;
        for (char[] row : matrix) {
            for (int j = 0; j < cols; j++) {
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = Math.max(maxArea, largestRect(heights));
        }
        return maxArea;
    }
    private int largestRect(int[] heights) {
        Deque<int[]> stack = new ArrayDeque<>();
        int maxArea = 0;
        for (int i = 0; i < heights.length; i++) {
            int start = i;
            while (!stack.isEmpty() && stack.peek()[1] > heights[i]) {
                int[] top = stack.pop();
                maxArea = Math.max(maxArea, top[1] * (i - top[0]));
                start = top[0];
            }
            stack.push(new int[]{start, heights[i]});
        }
        for (int[] entry : stack) {
            maxArea = Math.max(maxArea, entry[1] * (heights.length - entry[0]));
        }
        return maxArea;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return 0;
        int cols = matrix[0].size();
        vector<int> heights(cols, 0);
        int maxArea = 0;
        for (auto& row : matrix) {
            for (int j = 0; j < cols; j++) {
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = max(maxArea, largestRect(heights));
        }
        return maxArea;
    }
    int largestRect(vector<int>& heights) {
        stack<pair<int,int>> st;
        int maxArea = 0;
        for (int i = 0; i < (int)heights.size(); i++) {
            int start = i;
            while (!st.empty() && st.top().second > heights[i]) {
                auto [idx, h] = st.top(); st.pop();
                maxArea = max(maxArea, h * (i - idx));
                start = idx;
            }
            st.push({start, heights[i]});
        }
        while (!st.empty()) {
            auto [idx, h] = st.top(); st.pop();
            maxArea = max(maxArea, h * ((int)heights.size() - idx));
        }
        return maxArea;
    }
};
$CPP$,'O(rows * cols)','O(cols)');

COMMIT;
