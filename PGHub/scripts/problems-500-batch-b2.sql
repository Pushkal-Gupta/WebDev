-- Grow catalog 400 → 500 batch b2: stack (6) + strings (6) + two-pointers (5) = 17 problems
BEGIN;

-- ============ IDEMPOTENT CLEANUP ============
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'implement-stack-using-queues','design-a-stack-with-increment','trapping-rain-water-stack',
  'car-fleet-ii','largest-rectangle-in-histogram-500','exclusive-time-of-functions',
  'longest-common-prefix-500','valid-parenthesis-string-500','minimum-remove-to-make-valid',
  'decode-string-500','group-anagrams-500','basic-calculator',
  'sort-colors-500','remove-duplicates-sorted-array-ii','three-sum-closest-500',
  'four-sum-500','trapping-rain-water-tp'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'implement-stack-using-queues','design-a-stack-with-increment','trapping-rain-water-stack',
  'car-fleet-ii','largest-rectangle-in-histogram-500','exclusive-time-of-functions',
  'longest-common-prefix-500','valid-parenthesis-string-500','minimum-remove-to-make-valid',
  'decode-string-500','group-anagrams-500','basic-calculator',
  'sort-colors-500','remove-duplicates-sorted-array-ii','three-sum-closest-500',
  'four-sum-500','trapping-rain-water-tp'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'implement-stack-using-queues','design-a-stack-with-increment','trapping-rain-water-stack',
  'car-fleet-ii','largest-rectangle-in-histogram-500','exclusive-time-of-functions',
  'longest-common-prefix-500','valid-parenthesis-string-500','minimum-remove-to-make-valid',
  'decode-string-500','group-anagrams-500','basic-calculator',
  'sort-colors-500','remove-duplicates-sorted-array-ii','three-sum-closest-500',
  'four-sum-500','trapping-rain-water-tp'
);

-- ================================================================
-- STACK (2E, 3M, 1H)
-- ================================================================

-- S1) implement-stack-using-queues (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('implement-stack-using-queues','stack','Implement Stack using Queues','Easy',
$$<p>Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support push, top, pop, and empty. For this problem, given a list of operations and their values, return a list of results for each operation (push returns nothing, use -1 as placeholder).</p><p>Given a list of integers <code>nums</code>, simulate push for each number, then return the result of popping all elements (should be in reverse order).</p>$$,
'',ARRAY['After each push, rotate the queue so the new element is at the front.','Pop is then just a simple dequeue from the front.','Only one queue is actually needed with this approach.'],
'500','https://leetcode.com/problems/implement-stack-using-queues/',
'stackUsingQueues','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[1,2,3]"],"expected":"[3,2,1]"},{"inputs":["[5]"],"expected":"[5]"},{"inputs":["[1,2]"],"expected":"[2,1]"},{"inputs":["[4,3,2,1]"],"expected":"[1,2,3,4]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('implement-stack-using-queues','python',$PY$class Solution:
    def stackUsingQueues(self, nums: List[int]) -> List[int]:
        $PY$),
('implement-stack-using-queues','javascript',$JS$var stackUsingQueues = function(nums) {

};$JS$),
('implement-stack-using-queues','java',$JAVA$class Solution {
    public List<Integer> stackUsingQueues(int[] nums) {

    }
}$JAVA$),
('implement-stack-using-queues','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> stackUsingQueues(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('implement-stack-using-queues',1,'Single Queue Rotation',
'After pushing an element, rotate the queue so the newest element is at the front. This makes pop O(1) at the cost of O(n) push.',
'["Use a single queue (deque).","On push(x): append x, then rotate n-1 elements from front to back.","On pop: dequeue from front.","Push all nums, then pop all to get reverse order."]'::jsonb,
$PY$class Solution:
    def stackUsingQueues(self, nums: List[int]) -> List[int]:
        from collections import deque
        q = deque()
        for x in nums:
            q.append(x)
            for _ in range(len(q) - 1):
                q.append(q.popleft())
        result = []
        while q:
            result.append(q.popleft())
        return result
$PY$,
$JS$var stackUsingQueues = function(nums) {
    const q = [];
    for (const x of nums) {
        q.push(x);
        for (let i = 0; i < q.length - 1; i++) q.push(q.shift());
    }
    const result = [];
    while (q.length) result.push(q.shift());
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> stackUsingQueues(int[] nums) {
        Queue<Integer> q = new LinkedList<>();
        for (int x : nums) {
            q.add(x);
            for (int i = 0; i < q.size() - 1; i++) q.add(q.poll());
        }
        List<Integer> result = new ArrayList<>();
        while (!q.isEmpty()) result.add(q.poll());
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> stackUsingQueues(vector<int>& nums) {
        queue<int> q;
        for (int x : nums) {
            q.push(x);
            for (int i = 0; i < (int)q.size() - 1; i++) { q.push(q.front()); q.pop(); }
        }
        vector<int> result;
        while (!q.empty()) { result.push_back(q.front()); q.pop(); }
        return result;
    }
};
$CPP$,'O(n^2) total for n pushes','O(n)');

-- S2) next-greater-element-i (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('next-greater-element-i','stack','Next Greater Element I','Easy',
$$<p>You are given two arrays <code>nums1</code> and <code>nums2</code> where <code>nums1</code> is a subset of <code>nums2</code>. For each element in <code>nums1</code>, find the next greater element in <code>nums2</code>. The next greater element of <code>x</code> in <code>nums2</code> is the first element to the right of <code>x</code> that is greater. Return <code>-1</code> if no such element exists.</p>$$,
'',ARRAY['Use a monotonic decreasing stack on nums2 to precompute next greater for each element.','Store results in a hash map.','Look up each nums1 element in the map.'],
'500','https://leetcode.com/problems/next-greater-element-i/',
'nextGreaterElement','[{"name":"nums1","type":"List[int]"},{"name":"nums2","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[4,1,2]","[1,3,4,2]"],"expected":"[-1,3,-1]"},{"inputs":["[2,4]","[1,2,3,4]"],"expected":"[3,-1]"},{"inputs":["[1]","[1,2]"],"expected":"[2]"},{"inputs":["[3,1]","[3,1]"],"expected":"[-1,-1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('next-greater-element-i','python',$PY$class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        $PY$),
('next-greater-element-i','javascript',$JS$var nextGreaterElement = function(nums1, nums2) {

};$JS$),
('next-greater-element-i','java',$JAVA$class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {

    }
}$JAVA$),
('next-greater-element-i','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('next-greater-element-i',1,'Monotonic Stack + Map',
'Use a monotonic decreasing stack on nums2. When we pop elements, the current element is their next greater. Store in a map for O(1) lookup.',
$ALGO$["Iterate through nums2. For each element, pop all stack elements smaller than it and map them to the current element.","Push the current element onto the stack.","For each element in nums1, look up the result in the map (default -1)."]$ALGO$::jsonb,
$PY$class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        nge = {}
        stack = []
        for num in nums2:
            while stack and stack[-1] < num:
                nge[stack.pop()] = num
            stack.append(num)
        return [nge.get(x, -1) for x in nums1]
$PY$,
$JS$var nextGreaterElement = function(nums1, nums2) {
    const nge = {};
    const stack = [];
    for (const num of nums2) {
        while (stack.length && stack[stack.length - 1] < num) nge[stack.pop()] = num;
        stack.push(num);
    }
    return nums1.map(x => nge[x] !== undefined ? nge[x] : -1);
};
$JS$,
$JAVA$class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nge = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num) nge.put(stack.pop(), num);
            stack.push(num);
        }
        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) result[i] = nge.getOrDefault(nums1[i], -1);
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nge;
        stack<int> st;
        for (int num : nums2) {
            while (!st.empty() && st.top() < num) { nge[st.top()] = num; st.pop(); }
            st.push(num);
        }
        vector<int> result;
        for (int x : nums1) result.push_back(nge.count(x) ? nge[x] : -1);
        return result;
    }
};
$CPP$,'O(n + m)','O(n)');

-- S3) exclusive-time-of-functions (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('exclusive-time-of-functions','stack','Exclusive Time of Functions','Medium',
$$<p>On a single-threaded CPU, we execute <code>n</code> functions. Each function has a unique ID from <code>0</code> to <code>n-1</code>. Given a list of <code>logs</code> where each log is <code>"id:start_or_end:timestamp"</code>, return the exclusive time of each function as an array.</p>$$,
'',ARRAY['Use a stack to track the currently running function.','When a function starts, pause the current one (if any).','When a function ends, compute its time and resume the previous one.'],
'500','https://leetcode.com/problems/exclusive-time-of-functions/',
'exclusiveTime','[{"name":"n","type":"int"},{"name":"logs","type":"List[str]"}]'::jsonb,'List[int]',
'[{"inputs":["2","[\"0:start:0\",\"1:start:2\",\"1:end:5\",\"0:end:6\"]"],"expected":"[3,4]"},{"inputs":["1","[\"0:start:0\",\"0:end:0\"]"],"expected":"[1]"},{"inputs":["2","[\"0:start:0\",\"0:start:2\",\"0:end:5\",\"0:end:6\"]"],"expected":"[7,0]"},{"inputs":["2","[\"0:start:0\",\"0:end:0\",\"1:start:1\",\"1:end:1\"]"],"expected":"[1,1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('exclusive-time-of-functions','python',$PY$class Solution:
    def exclusiveTime(self, n: int, logs: List[str]) -> List[int]:
        $PY$),
('exclusive-time-of-functions','javascript',$JS$var exclusiveTime = function(n, logs) {

};$JS$),
('exclusive-time-of-functions','java',$JAVA$class Solution {
    public int[] exclusiveTime(int n, List<String> logs) {

    }
}$JAVA$),
('exclusive-time-of-functions','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('exclusive-time-of-functions',1,'Stack Simulation',
'Maintain a stack of function IDs. On start, push the function. On end, pop and accumulate time. Track previous timestamp to compute deltas.',
$ALGO$["Initialize result array of size n with zeros, an empty stack, and prevTime = 0.","For each log, parse id, type, and timestamp.","If start: add (timestamp - prevTime) to stack top (if any), push id, set prevTime = timestamp.","If end: add (timestamp - prevTime + 1) to current id, pop stack, set prevTime = timestamp + 1."]$ALGO$::jsonb,
$PY$class Solution:
    def exclusiveTime(self, n: int, logs: List[str]) -> List[int]:
        result = [0] * n
        stack = []
        prev = 0
        for log in logs:
            parts = log.split(':')
            fid, typ, ts = int(parts[0]), parts[1], int(parts[2])
            if typ == 'start':
                if stack:
                    result[stack[-1]] += ts - prev
                stack.append(fid)
                prev = ts
            else:
                result[stack.pop()] += ts - prev + 1
                prev = ts + 1
        return result
$PY$,
$JS$var exclusiveTime = function(n, logs) {
    const result = new Array(n).fill(0);
    const stack = [];
    let prev = 0;
    for (const log of logs) {
        const parts = log.split(':');
        const fid = parseInt(parts[0]), typ = parts[1], ts = parseInt(parts[2]);
        if (typ === 'start') {
            if (stack.length) result[stack[stack.length - 1]] += ts - prev;
            stack.push(fid);
            prev = ts;
        } else {
            result[stack.pop()] += ts - prev + 1;
            prev = ts + 1;
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] exclusiveTime(int n, List<String> logs) {
        int[] result = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        int prev = 0;
        for (String log : logs) {
            String[] parts = log.split(":");
            int fid = Integer.parseInt(parts[0]);
            String typ = parts[1];
            int ts = Integer.parseInt(parts[2]);
            if (typ.equals("start")) {
                if (!stack.isEmpty()) result[stack.peek()] += ts - prev;
                stack.push(fid);
                prev = ts;
            } else {
                result[stack.pop()] += ts - prev + 1;
                prev = ts + 1;
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> exclusiveTime(int n, vector<string>& logs) {
        vector<int> result(n, 0);
        stack<int> st;
        int prev = 0;
        for (auto& log : logs) {
            int i1 = log.find(':'), i2 = log.find(':', i1 + 1);
            int fid = stoi(log.substr(0, i1));
            string typ = log.substr(i1 + 1, i2 - i1 - 1);
            int ts = stoi(log.substr(i2 + 1));
            if (typ == "start") {
                if (!st.empty()) result[st.top()] += ts - prev;
                st.push(fid);
                prev = ts;
            } else {
                result[st.top()] += ts - prev + 1;
                st.pop();
                prev = ts + 1;
            }
        }
        return result;
    }
};
$CPP$,'O(L) where L = number of logs','O(n)');

-- S4) design-a-stack-with-increment (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('design-a-stack-with-increment','stack','Design a Stack With Increment Operation','Medium',
$$<p>Design a stack that supports push, pop, and an increment operation on the bottom <code>k</code> elements. Given a list of operations as strings, simulate the stack and return the result of each pop operation. Operations: <code>"push x"</code>, <code>"pop"</code>, <code>"inc k val"</code>.</p><p>Given a list of operations, return the list of values returned by each pop (return -1 for pop on empty stack, ignore push/inc outputs).</p>$$,
'',ARRAY['Use a lazy increment array: instead of updating k elements, just record the increment at index k-1.','On pop, apply the increment at the top and propagate it downward.','This makes all operations O(1).'],
'500','https://leetcode.com/problems/design-a-stack-with-increment-operation/',
'stackWithIncrement','[{"name":"operations","type":"List[str]"}]'::jsonb,'List[int]',
'[{"inputs":["[\"push 1\",\"push 2\",\"pop\",\"push 3\",\"inc 2 100\",\"pop\",\"pop\"]"],"expected":"[2,103,101]"},{"inputs":["[\"pop\",\"push 5\",\"pop\"]"],"expected":"[-1,5]"},{"inputs":["[\"push 1\",\"push 2\",\"push 3\",\"inc 3 10\",\"pop\",\"pop\",\"pop\"]"],"expected":"[13,12,11]"},{"inputs":["[\"push 7\",\"inc 1 3\",\"pop\"]"],"expected":"[10]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('design-a-stack-with-increment','python',$PY$class Solution:
    def stackWithIncrement(self, operations: List[str]) -> List[int]:
        $PY$),
('design-a-stack-with-increment','javascript',$JS$var stackWithIncrement = function(operations) {

};$JS$),
('design-a-stack-with-increment','java',$JAVA$class Solution {
    public List<Integer> stackWithIncrement(String[] operations) {

    }
}$JAVA$),
('design-a-stack-with-increment','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> stackWithIncrement(vector<string>& operations) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('design-a-stack-with-increment',1,'Lazy Increment',
'Maintain an increment array alongside the stack. On inc(k, val), add val to inc[min(k, size)-1]. On pop, add inc[top] to the result and propagate inc[top] to inc[top-1].',
$ALGO$["Maintain stack[] and inc[] arrays.","Push: append value to stack, append 0 to inc.","Pop: remove top value + inc[top], propagate inc[top] to inc[top-1] if exists.","Inc(k, val): add val to inc[min(k, size) - 1]."]$ALGO$::jsonb,
$PY$class Solution:
    def stackWithIncrement(self, operations: List[str]) -> List[int]:
        stack = []
        inc = []
        result = []
        for op in operations:
            parts = op.split()
            if parts[0] == 'push':
                stack.append(int(parts[1]))
                inc.append(0)
            elif parts[0] == 'pop':
                if not stack:
                    result.append(-1)
                else:
                    idx = len(stack) - 1
                    val = stack.pop() + inc[idx]
                    bonus = inc.pop()
                    if inc:
                        inc[-1] += bonus - (val - stack[-1] - inc[-1] if False else 0)
                    result.append(val)
                    if stack and idx > 0:
                        pass
            elif parts[0] == 'inc':
                k, val = int(parts[1]), int(parts[2])
                if stack:
                    idx = min(k, len(stack)) - 1
                    inc[idx] += val
        return result
$PY$,
$JS$var stackWithIncrement = function(operations) {
    const stack = [], inc = [], result = [];
    for (const op of operations) {
        const parts = op.split(' ');
        if (parts[0] === 'push') {
            stack.push(parseInt(parts[1]));
            inc.push(0);
        } else if (parts[0] === 'pop') {
            if (!stack.length) { result.push(-1); continue; }
            const idx = stack.length - 1;
            const val = stack.pop() + inc[idx];
            const bonus = inc.pop();
            if (inc.length) inc[inc.length - 1] += bonus;
            result.push(val);
        } else {
            const k = parseInt(parts[1]), val = parseInt(parts[2]);
            if (stack.length) {
                const idx = Math.min(k, stack.length) - 1;
                inc[idx] += val;
            }
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> stackWithIncrement(String[] operations) {
        List<Integer> stack = new ArrayList<>(), inc = new ArrayList<>(), result = new ArrayList<>();
        for (String op : operations) {
            String[] parts = op.split(" ");
            if (parts[0].equals("push")) {
                stack.add(Integer.parseInt(parts[1]));
                inc.add(0);
            } else if (parts[0].equals("pop")) {
                if (stack.isEmpty()) { result.add(-1); continue; }
                int idx = stack.size() - 1;
                int val = stack.remove(idx) + inc.get(idx);
                int bonus = inc.remove(idx);
                if (!inc.isEmpty()) inc.set(inc.size() - 1, inc.get(inc.size() - 1) + bonus);
                result.add(val);
            } else {
                int k = Integer.parseInt(parts[1]), v = Integer.parseInt(parts[2]);
                if (!stack.isEmpty()) {
                    int idx = Math.min(k, stack.size()) - 1;
                    inc.set(idx, inc.get(idx) + v);
                }
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> stackWithIncrement(vector<string>& operations) {
        vector<int> stack, inc, result;
        for (auto& op : operations) {
            if (op.substr(0, 4) == "push") {
                stack.push_back(stoi(op.substr(5)));
                inc.push_back(0);
            } else if (op.substr(0, 3) == "pop") {
                if (stack.empty()) { result.push_back(-1); continue; }
                int idx = stack.size() - 1;
                int val = stack.back() + inc.back();
                int bonus = inc.back();
                stack.pop_back(); inc.pop_back();
                if (!inc.empty()) inc.back() += bonus;
                result.push_back(val);
            } else {
                int i1 = op.find(' ', 4);
                int k = stoi(op.substr(4, i1 - 4));
                int v = stoi(op.substr(i1 + 1));
                if (!stack.empty()) {
                    int idx = min(k, (int)stack.size()) - 1;
                    inc[idx] += v;
                }
            }
        }
        return result;
    }
};
$CPP$,'O(1) per operation','O(n)');

-- S5) car-fleet-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('car-fleet-ii','stack','Asteroid Collision','Medium',
$$<p>We are given an array <code>asteroids</code> of integers representing asteroids in a row. For each asteroid, the absolute value represents its size, and the sign represents its direction (positive = right, negative = left). When two asteroids meet, the smaller one explodes. If they are equal, both explode. Two asteroids moving in the same direction never meet. Return the state of the asteroids after all collisions.</p>$$,
'',ARRAY['Use a stack to simulate collisions.','Only right-moving (positive) asteroids on the stack can collide with a left-moving (negative) incoming asteroid.','Process each asteroid: if it moves left and the stack top moves right, resolve the collision.'],
'500','https://leetcode.com/problems/asteroid-collision/',
'asteroidCollision','[{"name":"asteroids","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[5,10,-5]"],"expected":"[5,10]"},{"inputs":["[8,-8]"],"expected":"[]"},{"inputs":["[10,2,-5]"],"expected":"[10]"},{"inputs":["[-2,-1,1,2]"],"expected":"[-2,-1,1,2]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('car-fleet-ii','python',$PY$class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        $PY$),
('car-fleet-ii','javascript',$JS$var asteroidCollision = function(asteroids) {

};$JS$),
('car-fleet-ii','java',$JAVA$class Solution {
    public int[] asteroidCollision(int[] asteroids) {

    }
}$JAVA$),
('car-fleet-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('car-fleet-ii',1,'Stack Simulation',
'Use a stack. When a negative asteroid meets a positive one on the stack, resolve the collision by comparing absolute values.',
$ALGO$["For each asteroid, check if it collides with the stack top.","Collision happens when stack top is positive and current is negative.","If |current| > stack top, pop and continue. If equal, pop and discard current. If smaller, discard current.","If no collision, push onto stack."]$ALGO$::jsonb,
$PY$class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        stack = []
        for a in asteroids:
            alive = True
            while alive and a < 0 and stack and stack[-1] > 0:
                if stack[-1] < -a:
                    stack.pop()
                elif stack[-1] == -a:
                    stack.pop()
                    alive = False
                else:
                    alive = False
            if alive:
                stack.append(a)
        return stack
$PY$,
$JS$var asteroidCollision = function(asteroids) {
    const stack = [];
    for (const a of asteroids) {
        let alive = true;
        while (alive && a < 0 && stack.length && stack[stack.length - 1] > 0) {
            if (stack[stack.length - 1] < -a) stack.pop();
            else if (stack[stack.length - 1] === -a) { stack.pop(); alive = false; }
            else alive = false;
        }
        if (alive) stack.push(a);
    }
    return stack;
};
$JS$,
$JAVA$class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int a : asteroids) {
            boolean alive = true;
            while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {
                if (stack.peek() < -a) stack.pop();
                else if (stack.peek() == -a) { stack.pop(); alive = false; }
                else alive = false;
            }
            if (alive) stack.push(a);
        }
        int[] result = new int[stack.size()];
        for (int i = result.length - 1; i >= 0; i--) result[i] = stack.pop();
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stack;
        for (int a : asteroids) {
            bool alive = true;
            while (alive && a < 0 && !stack.empty() && stack.back() > 0) {
                if (stack.back() < -a) stack.pop_back();
                else if (stack.back() == -a) { stack.pop_back(); alive = false; }
                else alive = false;
            }
            if (alive) stack.push_back(a);
        }
        return stack;
    }
};
$CPP$,'O(n)','O(n)');

-- S6) largest-rectangle-in-histogram-500 (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('largest-rectangle-in-histogram-500','stack','Largest Rectangle in Histogram','Hard',
$$<p>Given an array of integers <code>heights</code> representing the histogram''s bar heights where the width of each bar is 1, return the area of the largest rectangle in the histogram.</p>$$,
'',ARRAY['Use a monotonic increasing stack of indices.','When a bar is shorter than the stack top, pop and compute the area using that height.','The width extends from the new stack top + 1 to the current index - 1.'],
'500','https://leetcode.com/problems/largest-rectangle-in-histogram/',
'largestRectangleArea','[{"name":"heights","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[2,1,5,6,2,3]"],"expected":"10"},{"inputs":["[2,4]"],"expected":"4"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[2,2,2,2]"],"expected":"8"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('largest-rectangle-in-histogram-500','python',$PY$class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        $PY$),
('largest-rectangle-in-histogram-500','javascript',$JS$var largestRectangleArea = function(heights) {

};$JS$),
('largest-rectangle-in-histogram-500','java',$JAVA$class Solution {
    public int largestRectangleArea(int[] heights) {

    }
}$JAVA$),
('largest-rectangle-in-histogram-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('largest-rectangle-in-histogram-500',1,'Monotonic Stack',
'Maintain a stack of indices with increasing heights. When a shorter bar appears, compute areas for all taller bars on the stack.',
$ALGO$["Push index -1 as sentinel. Iterate through heights.","While stack top height >= current height, pop and compute area: height * (i - stack_top - 1).","Push current index. After loop, process remaining stack entries with i = n.","Track max area throughout."]$ALGO$::jsonb,
$PY$class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = [-1]
        max_area = 0
        for i, h in enumerate(heights):
            while stack[-1] != -1 and heights[stack[-1]] >= h:
                height = heights[stack.pop()]
                width = i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)
        while stack[-1] != -1:
            height = heights[stack.pop()]
            width = len(heights) - stack[-1] - 1
            max_area = max(max_area, height * width)
        return max_area
$PY$,
$JS$var largestRectangleArea = function(heights) {
    const stack = [-1];
    let maxArea = 0;
    for (let i = 0; i < heights.length; i++) {
        while (stack[stack.length - 1] !== -1 && heights[stack[stack.length - 1]] >= heights[i]) {
            const h = heights[stack.pop()];
            const w = i - stack[stack.length - 1] - 1;
            maxArea = Math.max(maxArea, h * w);
        }
        stack.push(i);
    }
    while (stack[stack.length - 1] !== -1) {
        const h = heights[stack.pop()];
        const w = heights.length - stack[stack.length - 1] - 1;
        maxArea = Math.max(maxArea, h * w);
    }
    return maxArea;
};
$JS$,
$JAVA$class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);
        int maxArea = 0;
        for (int i = 0; i < heights.length; i++) {
            while (stack.peek() != -1 && heights[stack.peek()] >= heights[i]) {
                int h = heights[stack.pop()];
                int w = i - stack.peek() - 1;
                maxArea = Math.max(maxArea, h * w);
            }
            stack.push(i);
        }
        while (stack.peek() != -1) {
            int h = heights[stack.pop()];
            int w = heights.length - stack.peek() - 1;
            maxArea = Math.max(maxArea, h * w);
        }
        return maxArea;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        st.push(-1);
        int maxArea = 0, n = heights.size();
        for (int i = 0; i < n; i++) {
            while (st.top() != -1 && heights[st.top()] >= heights[i]) {
                int h = heights[st.top()]; st.pop();
                int w = i - st.top() - 1;
                maxArea = max(maxArea, h * w);
            }
            st.push(i);
        }
        while (st.top() != -1) {
            int h = heights[st.top()]; st.pop();
            int w = n - st.top() - 1;
            maxArea = max(maxArea, h * w);
        }
        return maxArea;
    }
};
$CPP$,'O(n)','O(n)');

-- ================================================================
-- STRINGS (2E, 3M, 1H)
-- ================================================================

-- ST1) valid-palindrome-500 (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('valid-palindrome-500','strings','Valid Palindrome','Easy',
$$<p>A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string <code>s</code>, return <code>true</code> if it is a palindrome, or <code>false</code> otherwise.</p>$$,
'',ARRAY['Use two pointers from both ends.','Skip non-alphanumeric characters.','Compare lowercase versions of the characters.'],
'500','https://leetcode.com/problems/valid-palindrome/',
'isPalindrome','[{"name":"s","type":"str"}]'::jsonb,'bool',
'[{"inputs":["\"A man, a plan, a canal: Panama\""],"expected":"true"},{"inputs":["\"race a car\""],"expected":"false"},{"inputs":["\" \""],"expected":"true"},{"inputs":["\"ab\""],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('valid-palindrome-500','python',$PY$class Solution:
    def isPalindrome(self, s: str) -> bool:
        $PY$),
('valid-palindrome-500','javascript',$JS$var isPalindrome = function(s) {

};$JS$),
('valid-palindrome-500','java',$JAVA$class Solution {
    public boolean isPalindrome(String s) {

    }
}$JAVA$),
('valid-palindrome-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('valid-palindrome-500',1,'Two Pointers',
'Use two pointers from both ends, skipping non-alphanumeric characters and comparing case-insensitively.',
'["Set left = 0, right = len(s) - 1.","Skip non-alnum chars from both sides.","Compare lowercase chars. If mismatch, return false.","Return true when pointers cross."]'::jsonb,
$PY$class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            while l < r and not s[l].isalnum():
                l += 1
            while l < r and not s[r].isalnum():
                r -= 1
            if s[l].lower() != s[r].lower():
                return False
            l += 1
            r -= 1
        return True
$PY$,
$JS$var isPalindrome = function(s) {
    let l = 0, r = s.length - 1;
    while (l < r) {
        while (l < r && !/[a-zA-Z0-9]/.test(s[l])) l++;
        while (l < r && !/[a-zA-Z0-9]/.test(s[r])) r--;
        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
        l++; r--;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = s.size() - 1;
        while (l < r) {
            while (l < r && !isalnum(s[l])) l++;
            while (l < r && !isalnum(s[r])) r--;
            if (tolower(s[l]) != tolower(s[r])) return false;
            l++; r--;
        }
        return true;
    }
};
$CPP$,'O(n)','O(1)');

-- ST2) isomorphic-strings (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('isomorphic-strings','strings','Isomorphic Strings','Easy',
$$<p>Given two strings <code>s</code> and <code>t</code>, determine if they are isomorphic. Two strings are isomorphic if the characters in <code>s</code> can be replaced to get <code>t</code>, where each character maps to exactly one character (and no two characters map to the same character).</p>$$,
'',ARRAY['Use two hash maps: one for s->t mapping and one for t->s mapping.','If a character already maps to a different character, return false.','Both directions must be consistent.'],
'500','https://leetcode.com/problems/isomorphic-strings/',
'isIsomorphic','[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb,'bool',
'[{"inputs":["\"egg\"","\"add\""],"expected":"true"},{"inputs":["\"foo\"","\"bar\""],"expected":"false"},{"inputs":["\"paper\"","\"title\""],"expected":"true"},{"inputs":["\"badc\"","\"baba\""],"expected":"false"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('isomorphic-strings','python',$PY$class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        $PY$),
('isomorphic-strings','javascript',$JS$var isIsomorphic = function(s, t) {

};$JS$),
('isomorphic-strings','java',$JAVA$class Solution {
    public boolean isIsomorphic(String s, String t) {

    }
}$JAVA$),
('isomorphic-strings','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isIsomorphic(string s, string t) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('isomorphic-strings',1,'Two Hash Maps',
'Maintain bidirectional mappings. If any mapping conflict arises, the strings are not isomorphic.',
'["Create maps s_to_t and t_to_s.","For each pair (s[i], t[i]): check both maps for conflicts.","If s[i] already maps to something other than t[i], or vice versa, return false.","Otherwise add/confirm the mapping. Return true at the end."]'::jsonb,
$PY$class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        s2t, t2s = {}, {}
        for a, b in zip(s, t):
            if a in s2t and s2t[a] != b:
                return False
            if b in t2s and t2s[b] != a:
                return False
            s2t[a] = b
            t2s[b] = a
        return True
$PY$,
$JS$var isIsomorphic = function(s, t) {
    const s2t = {}, t2s = {};
    for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i];
        if (s2t[a] !== undefined && s2t[a] !== b) return false;
        if (t2s[b] !== undefined && t2s[b] !== a) return false;
        s2t[a] = b;
        t2s[b] = a;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isIsomorphic(String s, String t) {
        Map<Character, Character> s2t = new HashMap<>(), t2s = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (s2t.containsKey(a) && s2t.get(a) != b) return false;
            if (t2s.containsKey(b) && t2s.get(b) != a) return false;
            s2t.put(a, b);
            t2s.put(b, a);
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isIsomorphic(string s, string t) {
        unordered_map<char, char> s2t, t2s;
        for (int i = 0; i < (int)s.size(); i++) {
            char a = s[i], b = t[i];
            if (s2t.count(a) && s2t[a] != b) return false;
            if (t2s.count(b) && t2s[b] != a) return false;
            s2t[a] = b;
            t2s[b] = a;
        }
        return true;
    }
};
$CPP$,'O(n)','O(1) — at most 256 chars');

-- ST3) minimum-remove-to-make-valid (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-remove-to-make-valid','strings','Minimum Remove to Make Valid Parentheses','Medium',
$$<p>Given a string <code>s</code> of <code>(</code>, <code>)</code>, and lowercase English characters, remove the minimum number of parentheses so that the resulting string is valid (every open has a matching close and vice versa). Return any valid result.</p>$$,
'',ARRAY['First pass left-to-right: track unmatched open parens with a stack of indices.','Also mark unmatched close parens.','Build the result by skipping all marked indices.'],
'500','https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/',
'minRemoveToMakeValid','[{"name":"s","type":"str"}]'::jsonb,'str',
'[{"inputs":["\"lee(t(c)o)de)\""],"expected":"\"lee(t(c)o)de\""},{"inputs":["\"a)b(c)d\""],"expected":"\"ab(c)d\""},{"inputs":["\")(\""],"expected":"\"\""},{"inputs":["\"abc\""],"expected":"\"abc\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-remove-to-make-valid','python',$PY$class Solution:
    def minRemoveToMakeValid(self, s: str) -> str:
        $PY$),
('minimum-remove-to-make-valid','javascript',$JS$var minRemoveToMakeValid = function(s) {

};$JS$),
('minimum-remove-to-make-valid','java',$JAVA$class Solution {
    public String minRemoveToMakeValid(String s) {

    }
}$JAVA$),
('minimum-remove-to-make-valid','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string minRemoveToMakeValid(string s) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-remove-to-make-valid',1,'Stack of Indices',
'Track indices of unmatched open parens on a stack. Mark unmatched close parens too. Remove all marked indices.',
$ALGO$["Use a stack for indices of unmatched open parens and a set for indices to remove.","For each char: if open paren, push index. If close paren and stack non-empty, pop (matched). If close paren and stack empty, add index to remove set.","After iteration, all remaining stack indices are unmatched opens — add to remove set.","Build result skipping remove-set indices."]$ALGO$::jsonb,
$PY$class Solution:
    def minRemoveToMakeValid(self, s: str) -> str:
        stack = []
        remove = set()
        for i, c in enumerate(s):
            if c == '(':
                stack.append(i)
            elif c == ')':
                if stack:
                    stack.pop()
                else:
                    remove.add(i)
        remove.update(stack)
        return ''.join(c for i, c in enumerate(s) if i not in remove)
$PY$,
$JS$var minRemoveToMakeValid = function(s) {
    const stack = [], remove = new Set();
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') stack.push(i);
        else if (s[i] === ')') {
            if (stack.length) stack.pop();
            else remove.add(i);
        }
    }
    for (const idx of stack) remove.add(idx);
    return [...s].filter((_, i) => !remove.has(i)).join('');
};
$JS$,
$JAVA$class Solution {
    public String minRemoveToMakeValid(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        Set<Integer> remove = new HashSet<>();
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') stack.push(i);
            else if (s.charAt(i) == ')') {
                if (!stack.isEmpty()) stack.pop();
                else remove.add(i);
            }
        }
        remove.addAll(stack);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            if (!remove.contains(i)) sb.append(s.charAt(i));
        }
        return sb.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string minRemoveToMakeValid(string s) {
        stack<int> st;
        unordered_set<int> rem;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') st.push(i);
            else if (s[i] == ')') {
                if (!st.empty()) st.pop();
                else rem.insert(i);
            }
        }
        while (!st.empty()) { rem.insert(st.top()); st.pop(); }
        string result;
        for (int i = 0; i < (int)s.size(); i++) {
            if (!rem.count(i)) result += s[i];
        }
        return result;
    }
};
$CPP$,'O(n)','O(n)');

-- ST4) string-to-integer-atoi-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('string-to-integer-atoi-500','strings','String to Integer (atoi)','Medium',
$$<p>Implement the <code>myAtoi(string s)</code> function, which converts a string to a 32-bit signed integer. The algorithm: discard leading whitespace, check for optional +/- sign, read digits until non-digit or end of string, clamp to [−2^31, 2^31 − 1].</p>$$,
'',ARRAY['Handle leading whitespace first.','Check for an optional sign character.','Read digits and build the number, clamping if overflow occurs.'],
'500','https://leetcode.com/problems/string-to-integer-atoi/',
'myAtoi','[{"name":"s","type":"str"}]'::jsonb,'int',
'[{"inputs":["\"42\""],"expected":"42"},{"inputs":["\"   -42\""],"expected":"-42"},{"inputs":["\"4193 with words\""],"expected":"4193"},{"inputs":["\"words and 987\""],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('string-to-integer-atoi-500','python',$PY$class Solution:
    def myAtoi(self, s: str) -> int:
        $PY$),
('string-to-integer-atoi-500','javascript',$JS$var myAtoi = function(s) {

};$JS$),
('string-to-integer-atoi-500','java',$JAVA$class Solution {
    public int myAtoi(String s) {

    }
}$JAVA$),
('string-to-integer-atoi-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int myAtoi(string s) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('string-to-integer-atoi-500',1,'Linear Scan',
'Process the string character by character: skip whitespace, handle sign, accumulate digits, and clamp to 32-bit range.',
$ALGO$["Skip leading whitespace.","Read optional sign (+/-).","Read digits: result = result * 10 + digit. Clamp if > 2^31 - 1 or < -2^31.","Return result with sign applied."]$ALGO$::jsonb,
$PY$class Solution:
    def myAtoi(self, s: str) -> int:
        s = s.lstrip()
        if not s:
            return 0
        sign = 1
        i = 0
        if s[0] in '+-':
            sign = -1 if s[0] == '-' else 1
            i = 1
        result = 0
        INT_MAX, INT_MIN = 2**31 - 1, -(2**31)
        while i < len(s) and s[i].isdigit():
            result = result * 10 + int(s[i])
            i += 1
        result *= sign
        return max(INT_MIN, min(INT_MAX, result))
$PY$,
$JS$var myAtoi = function(s) {
    s = s.trimStart();
    if (!s.length) return 0;
    let sign = 1, i = 0;
    if (s[0] === '+' || s[0] === '-') { sign = s[0] === '-' ? -1 : 1; i++; }
    let result = 0;
    const MAX = 2147483647, MIN = -2147483648;
    while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        result = result * 10 + parseInt(s[i]);
        i++;
    }
    result *= sign;
    return Math.max(MIN, Math.min(MAX, result));
};
$JS$,
$JAVA$class Solution {
    public int myAtoi(String s) {
        s = s.trim();
        if (s.isEmpty()) return 0;
        int sign = 1, i = 0;
        if (s.charAt(0) == '+' || s.charAt(0) == '-') { sign = s.charAt(0) == '-' ? -1 : 1; i++; }
        long result = 0;
        while (i < s.length() && Character.isDigit(s.charAt(i))) {
            result = result * 10 + (s.charAt(i) - '0');
            if (result * sign > Integer.MAX_VALUE) return Integer.MAX_VALUE;
            if (result * sign < Integer.MIN_VALUE) return Integer.MIN_VALUE;
            i++;
        }
        return (int)(result * sign);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int myAtoi(string s) {
        int i = 0, n = s.size();
        while (i < n && s[i] == ' ') i++;
        int sign = 1;
        if (i < n && (s[i] == '+' || s[i] == '-')) { sign = s[i] == '-' ? -1 : 1; i++; }
        long long result = 0;
        while (i < n && isdigit(s[i])) {
            result = result * 10 + (s[i] - '0');
            if (result * sign > INT_MAX) return INT_MAX;
            if (result * sign < INT_MIN) return INT_MIN;
            i++;
        }
        return (int)(result * sign);
    }
};
$CPP$,'O(n)','O(1)');

-- ST5) zigzag-conversion-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('zigzag-conversion-500','strings','Zigzag Conversion','Medium',
$$<p>The string <code>"PAYPALISHIRING"</code> is written in a zigzag pattern on a given number of rows. Write the code that will take a string and make this conversion given a number of rows. Read off each row to produce the output.</p>$$,
'',ARRAY['Create numRows lists, one for each row.','Iterate through the string, bouncing between row 0 and row numRows-1.','Concatenate all rows at the end.'],
'500','https://leetcode.com/problems/zigzag-conversion/',
'convert','[{"name":"s","type":"str"},{"name":"numRows","type":"int"}]'::jsonb,'str',
'[{"inputs":["\"PAYPALISHIRING\"","3"],"expected":"\"PAHNAPLSIIGYIR\""},{"inputs":["\"PAYPALISHIRING\"","4"],"expected":"\"PINALSIGYAHRPI\""},{"inputs":["\"A\"","1"],"expected":"\"A\""},{"inputs":["\"AB\"","1"],"expected":"\"AB\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('zigzag-conversion-500','python',$PY$class Solution:
    def convert(self, s: str, numRows: int) -> str:
        $PY$),
('zigzag-conversion-500','javascript',$JS$var convert = function(s, numRows) {

};$JS$),
('zigzag-conversion-500','java',$JAVA$class Solution {
    public String convert(String s, int numRows) {

    }
}$JAVA$),
('zigzag-conversion-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string convert(string s, int numRows) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('zigzag-conversion-500',1,'Row Buckets',
'Distribute characters into row buckets by bouncing the row index up and down. Then concatenate all buckets.',
'["If numRows == 1, return s.","Create numRows empty strings.","Iterate through s with a direction flag that flips at rows 0 and numRows-1.","Concatenate all row strings."]'::jsonb,
$PY$class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        rows = [''] * numRows
        row, step = 0, 1
        for c in s:
            rows[row] += c
            if row == 0:
                step = 1
            elif row == numRows - 1:
                step = -1
            row += step
        return ''.join(rows)
$PY$,
$JS$var convert = function(s, numRows) {
    if (numRows === 1 || numRows >= s.length) return s;
    const rows = new Array(numRows).fill('');
    let row = 0, step = 1;
    for (const c of s) {
        rows[row] += c;
        if (row === 0) step = 1;
        else if (row === numRows - 1) step = -1;
        row += step;
    }
    return rows.join('');
};
$JS$,
$JAVA$class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) return s;
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();
        int row = 0, step = 1;
        for (char c : s.toCharArray()) {
            rows[row].append(c);
            if (row == 0) step = 1;
            else if (row == numRows - 1) step = -1;
            row += step;
        }
        StringBuilder result = new StringBuilder();
        for (StringBuilder r : rows) result.append(r);
        return result.toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= (int)s.size()) return s;
        vector<string> rows(numRows);
        int row = 0, step = 1;
        for (char c : s) {
            rows[row] += c;
            if (row == 0) step = 1;
            else if (row == numRows - 1) step = -1;
            row += step;
        }
        string result;
        for (auto& r : rows) result += r;
        return result;
    }
};
$CPP$,'O(n)','O(n)');

-- ST6) basic-calculator (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('basic-calculator','strings','Basic Calculator','Hard',
$$<p>Given a string <code>s</code> representing a valid expression, implement a basic calculator to evaluate it, and return the result. The expression may contain <code>+</code>, <code>-</code>, parentheses <code>()</code>, digits, and spaces.</p>$$,
'',ARRAY['Use a stack to handle parentheses.','Track the current number and sign.','When you hit an open paren, push the running result and sign onto the stack. When you hit a close paren, pop and combine.'],
'500','https://leetcode.com/problems/basic-calculator/',
'calculate','[{"name":"s","type":"str"}]'::jsonb,'int',
'[{"inputs":["\"1 + 1\""],"expected":"2"},{"inputs":["\" 2-1 + 2 \""],"expected":"3"},{"inputs":["\"(1+(4+5+2)-3)+(6+8)\""],"expected":"23"},{"inputs":["\"-(3+2)\""],"expected":"-5"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('basic-calculator','python',$PY$class Solution:
    def calculate(self, s: str) -> int:
        $PY$),
('basic-calculator','javascript',$JS$var calculate = function(s) {

};$JS$),
('basic-calculator','java',$JAVA$class Solution {
    public int calculate(String s) {

    }
}$JAVA$),
('basic-calculator','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calculate(string s) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('basic-calculator',1,'Stack with Sign',
'Process characters left to right. Use a stack to save the running result and sign when entering parentheses, and restore when exiting.',
$ALGO$["Initialize result = 0, num = 0, sign = 1, stack = [].","For each character: if digit, build num. If + or -, apply num to result, update sign. If open paren, push result and sign, reset. If close paren, apply num, pop sign and prev result, combine.","At end, apply any remaining num."]$ALGO$::jsonb,
$PY$class Solution:
    def calculate(self, s: str) -> int:
        result = 0
        num = 0
        sign = 1
        stack = []
        for c in s:
            if c.isdigit():
                num = num * 10 + int(c)
            elif c == '+':
                result += sign * num
                num = 0
                sign = 1
            elif c == '-':
                result += sign * num
                num = 0
                sign = -1
            elif c == '(':
                stack.append(result)
                stack.append(sign)
                result = 0
                sign = 1
            elif c == ')':
                result += sign * num
                num = 0
                result *= stack.pop()
                result += stack.pop()
        result += sign * num
        return result
$PY$,
$JS$var calculate = function(s) {
    let result = 0, num = 0, sign = 1;
    const stack = [];
    for (const c of s) {
        if (c >= '0' && c <= '9') { num = num * 10 + parseInt(c); }
        else if (c === '+') { result += sign * num; num = 0; sign = 1; }
        else if (c === '-') { result += sign * num; num = 0; sign = -1; }
        else if (c === '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
        else if (c === ')') { result += sign * num; num = 0; result *= stack.pop(); result += stack.pop(); }
    }
    return result + sign * num;
};
$JS$,
$JAVA$class Solution {
    public int calculate(String s) {
        int result = 0, num = 0, sign = 1;
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) { num = num * 10 + (c - '0'); }
            else if (c == '+') { result += sign * num; num = 0; sign = 1; }
            else if (c == '-') { result += sign * num; num = 0; sign = -1; }
            else if (c == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
            else if (c == ')') { result += sign * num; num = 0; result *= stack.pop(); result += stack.pop(); }
        }
        return result + sign * num;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calculate(string s) {
        long result = 0, num = 0, sign = 1;
        stack<long> st;
        for (char c : s) {
            if (isdigit(c)) { num = num * 10 + (c - '0'); }
            else if (c == '+') { result += sign * num; num = 0; sign = 1; }
            else if (c == '-') { result += sign * num; num = 0; sign = -1; }
            else if (c == '(') { st.push(result); st.push(sign); result = 0; sign = 1; }
            else if (c == ')') { result += sign * num; num = 0; result *= st.top(); st.pop(); result += st.top(); st.pop(); }
        }
        return (int)(result + sign * num);
    }
};
$CPP$,'O(n)','O(n)');

-- ================================================================
-- TWO POINTERS (1E, 3M, 1H)
-- ================================================================

-- TP1) squares-of-a-sorted-array (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('squares-of-a-sorted-array','two-pointers','Squares of a Sorted Array','Easy',
$$<p>Given an integer array <code>nums</code> sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.</p>$$,
'',ARRAY['The largest squares come from the extremes (most negative or most positive).','Use two pointers from both ends, placing the larger square at the end of the result.','Work backwards to fill the result array.'],
'500','https://leetcode.com/problems/squares-of-a-sorted-array/',
'sortedSquares','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[-4,-1,0,3,10]"],"expected":"[0,1,9,16,100]"},{"inputs":["[-7,-3,2,3,11]"],"expected":"[4,9,9,49,121]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[-5,-3,-2,-1]"],"expected":"[1,4,9,25]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('squares-of-a-sorted-array','python',$PY$class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        $PY$),
('squares-of-a-sorted-array','javascript',$JS$var sortedSquares = function(nums) {

};$JS$),
('squares-of-a-sorted-array','java',$JAVA$class Solution {
    public int[] sortedSquares(int[] nums) {

    }
}$JAVA$),
('squares-of-a-sorted-array','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('squares-of-a-sorted-array',1,'Two Pointers from Ends',
'Since the array is sorted, the largest absolute values are at the ends. Compare squares from both ends and place the larger one at the back of the result.',
'["Set left = 0, right = n-1, pos = n-1.","While left <= right: compare squares of nums[left] and nums[right].","Place the larger square at result[pos], move that pointer inward.","Decrement pos."]'::jsonb,
$PY$class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [0] * n
        l, r, pos = 0, n - 1, n - 1
        while l <= r:
            if abs(nums[l]) > abs(nums[r]):
                result[pos] = nums[l] * nums[l]
                l += 1
            else:
                result[pos] = nums[r] * nums[r]
                r -= 1
            pos -= 1
        return result
$PY$,
$JS$var sortedSquares = function(nums) {
    const n = nums.length, result = new Array(n);
    let l = 0, r = n - 1, pos = n - 1;
    while (l <= r) {
        if (Math.abs(nums[l]) > Math.abs(nums[r])) {
            result[pos] = nums[l] * nums[l]; l++;
        } else {
            result[pos] = nums[r] * nums[r]; r--;
        }
        pos--;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        int l = 0, r = n - 1, pos = n - 1;
        while (l <= r) {
            if (Math.abs(nums[l]) > Math.abs(nums[r])) {
                result[pos] = nums[l] * nums[l]; l++;
            } else {
                result[pos] = nums[r] * nums[r]; r--;
            }
            pos--;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> result(n);
        int l = 0, r = n - 1, pos = n - 1;
        while (l <= r) {
            if (abs(nums[l]) > abs(nums[r])) {
                result[pos] = nums[l] * nums[l]; l++;
            } else {
                result[pos] = nums[r] * nums[r]; r--;
            }
            pos--;
        }
        return result;
    }
};
$CPP$,'O(n)','O(n)');

-- TP2) remove-duplicates-sorted-array-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('remove-duplicates-sorted-array-ii','two-pointers','Remove Duplicates from Sorted Array II','Medium',
$$<p>Given an integer array <code>nums</code> sorted in non-decreasing order, remove some duplicates in-place such that each unique element appears at most twice. Return the number of elements remaining, and the first k elements of nums should hold the result.</p><p>For this problem, return the modified array truncated to k elements.</p>$$,
'',ARRAY['Use a write pointer that tracks where to place the next valid element.','An element is valid if it differs from nums[write - 2].','This generalizes to "at most K duplicates" by comparing with nums[write - K].'],
'500','https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/',
'removeDuplicatesII','[{"name":"nums","type":"List[int]"}]'::jsonb,'List[int]',
'[{"inputs":["[1,1,1,2,2,3]"],"expected":"[1,1,2,2,3]"},{"inputs":["[0,0,1,1,1,1,2,3,3]"],"expected":"[0,0,1,1,2,3,3]"},{"inputs":["[1,2,3]"],"expected":"[1,2,3]"},{"inputs":["[1,1]"],"expected":"[1,1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('remove-duplicates-sorted-array-ii','python',$PY$class Solution:
    def removeDuplicatesII(self, nums: List[int]) -> List[int]:
        $PY$),
('remove-duplicates-sorted-array-ii','javascript',$JS$var removeDuplicatesII = function(nums) {

};$JS$),
('remove-duplicates-sorted-array-ii','java',$JAVA$class Solution {
    public int[] removeDuplicatesII(int[] nums) {

    }
}$JAVA$),
('remove-duplicates-sorted-array-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> removeDuplicatesII(vector<int>& nums) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('remove-duplicates-sorted-array-ii',1,'Write Pointer',
'Maintain a write pointer. Only write an element if it differs from the element two positions back in the result.',
$ALGO$["If n <= 2, return nums as-is.","Set write = 2. For each read from index 2 onward: if nums[read] != nums[write - 2], copy and advance write.","Return nums[0:write]."]$ALGO$::jsonb,
$PY$class Solution:
    def removeDuplicatesII(self, nums: List[int]) -> List[int]:
        if len(nums) <= 2:
            return nums
        w = 2
        for r in range(2, len(nums)):
            if nums[r] != nums[w - 2]:
                nums[w] = nums[r]
                w += 1
        return nums[:w]
$PY$,
$JS$var removeDuplicatesII = function(nums) {
    if (nums.length <= 2) return nums;
    let w = 2;
    for (let r = 2; r < nums.length; r++) {
        if (nums[r] !== nums[w - 2]) nums[w++] = nums[r];
    }
    return nums.slice(0, w);
};
$JS$,
$JAVA$class Solution {
    public int[] removeDuplicatesII(int[] nums) {
        if (nums.length <= 2) return nums;
        int w = 2;
        for (int r = 2; r < nums.length; r++) {
            if (nums[r] != nums[w - 2]) nums[w++] = nums[r];
        }
        return Arrays.copyOf(nums, w);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> removeDuplicatesII(vector<int>& nums) {
        if (nums.size() <= 2) return nums;
        int w = 2;
        for (int r = 2; r < (int)nums.size(); r++) {
            if (nums[r] != nums[w - 2]) nums[w++] = nums[r];
        }
        return vector<int>(nums.begin(), nums.begin() + w);
    }
};
$CPP$,'O(n)','O(1)');

-- TP3) three-sum-closest-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('three-sum-closest-500','two-pointers','3Sum Closest','Medium',
$$<p>Given an integer array <code>nums</code> of length <code>n</code> and an integer <code>target</code>, find three integers in <code>nums</code> such that the sum is closest to <code>target</code>. Return the sum of the three integers.</p>$$,
'',ARRAY['Sort the array first.','Fix one element and use two pointers for the remaining two.','Track the closest sum seen so far.'],
'500','https://leetcode.com/problems/3sum-closest/',
'threeSumClosest','[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,'int',
'[{"inputs":["[-1,2,1,-4]","1"],"expected":"2"},{"inputs":["[0,0,0]","1"],"expected":"0"},{"inputs":["[1,1,1,0]","-100"],"expected":"2"},{"inputs":["[1,2,4,8,16,32,64,128]","82"],"expected":"82"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('three-sum-closest-500','python',$PY$class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        $PY$),
('three-sum-closest-500','javascript',$JS$var threeSumClosest = function(nums, target) {

};$JS$),
('three-sum-closest-500','java',$JAVA$class Solution {
    public int threeSumClosest(int[] nums, int target) {

    }
}$JAVA$),
('three-sum-closest-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('three-sum-closest-500',1,'Sort + Two Pointers',
'Sort, then for each element use two pointers on the rest. Track whichever triplet sum is closest to the target.',
$ALGO$["Sort nums.","For each i from 0 to n-3: set lo = i+1, hi = n-1.","Compute s = nums[i] + nums[lo] + nums[hi]. If s == target, return s. If s < target, lo++. Else hi--.","Update closest if |s - target| < |closest - target|."]$ALGO$::jsonb,
$PY$class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        nums.sort()
        closest = nums[0] + nums[1] + nums[2]
        for i in range(len(nums) - 2):
            lo, hi = i + 1, len(nums) - 1
            while lo < hi:
                s = nums[i] + nums[lo] + nums[hi]
                if abs(s - target) < abs(closest - target):
                    closest = s
                if s < target:
                    lo += 1
                elif s > target:
                    hi -= 1
                else:
                    return s
        return closest
$PY$,
$JS$var threeSumClosest = function(nums, target) {
    nums.sort((a, b) => a - b);
    let closest = nums[0] + nums[1] + nums[2];
    for (let i = 0; i < nums.length - 2; i++) {
        let lo = i + 1, hi = nums.length - 1;
        while (lo < hi) {
            const s = nums[i] + nums[lo] + nums[hi];
            if (Math.abs(s - target) < Math.abs(closest - target)) closest = s;
            if (s < target) lo++;
            else if (s > target) hi--;
            else return s;
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
            int lo = i + 1, hi = nums.length - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (Math.abs(s - target) < Math.abs(closest - target)) closest = s;
                if (s < target) lo++;
                else if (s > target) hi--;
                else return s;
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
            int lo = i + 1, hi = (int)nums.size() - 1;
            while (lo < hi) {
                int s = nums[i] + nums[lo] + nums[hi];
                if (abs(s - target) < abs(closest - target)) closest = s;
                if (s < target) lo++;
                else if (s > target) hi--;
                else return s;
            }
        }
        return closest;
    }
};
$CPP$,'O(n^2)','O(1) extra');

-- TP4) four-sum-500 (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('four-sum-500','two-pointers','4Sum','Medium',
$$<p>Given an array <code>nums</code> of <code>n</code> integers and an integer <code>target</code>, return an array of all unique quadruplets <code>[nums[a], nums[b], nums[c], nums[d]]</code> such that the four values sum to <code>target</code>.</p>$$,
'',ARRAY['Sort the array first.','Fix two elements with nested loops, then use two pointers for the remaining two.','Skip duplicates at each level to avoid duplicate quadruplets.'],
'500','https://leetcode.com/problems/4sum/',
'fourSum','[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[1,0,-1,0,-2,2]","0"],"expected":"[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"},{"inputs":["[2,2,2,2,2]","8"],"expected":"[[2,2,2,2]]"},{"inputs":["[0,0,0,0]","0"],"expected":"[[0,0,0,0]]"},{"inputs":["[1,2,3,4]","21"],"expected":"[]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('four-sum-500','python',$PY$class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        $PY$),
('four-sum-500','javascript',$JS$var fourSum = function(nums, target) {

};$JS$),
('four-sum-500','java',$JAVA$class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {

    }
}$JAVA$),
('four-sum-500','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('four-sum-500',1,'Sort + Two Pointers',
'Extend 3Sum by adding one more outer loop. Fix two elements, then use two pointers for the inner pair. Skip duplicates at all levels.',
$ALGO$["Sort nums.","For i from 0 to n-4: skip duplicates.","For j from i+1 to n-3: skip duplicates.","Two pointers lo = j+1, hi = n-1. Find pairs summing to target - nums[i] - nums[j]. Skip duplicates."]$ALGO$::jsonb,
$PY$class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        result = []
        for i in range(n - 3):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            for j in range(i + 1, n - 2):
                if j > i + 1 and nums[j] == nums[j - 1]:
                    continue
                lo, hi = j + 1, n - 1
                while lo < hi:
                    s = nums[i] + nums[j] + nums[lo] + nums[hi]
                    if s < target:
                        lo += 1
                    elif s > target:
                        hi -= 1
                    else:
                        result.append([nums[i], nums[j], nums[lo], nums[hi]])
                        while lo < hi and nums[lo] == nums[lo + 1]:
                            lo += 1
                        while lo < hi and nums[hi] == nums[hi - 1]:
                            hi -= 1
                        lo += 1
                        hi -= 1
        return result
$PY$,
$JS$var fourSum = function(nums, target) {
    nums.sort((a, b) => a - b);
    const n = nums.length, result = [];
    for (let i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] === nums[i-1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] === nums[j-1]) continue;
            let lo = j + 1, hi = n - 1;
            while (lo < hi) {
                const s = nums[i] + nums[j] + nums[lo] + nums[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    result.push([nums[i], nums[j], nums[lo], nums[hi]]);
                    while (lo < hi && nums[lo] === nums[lo+1]) lo++;
                    while (lo < hi && nums[hi] === nums[hi-1]) hi--;
                    lo++; hi--;
                }
            }
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j-1]) continue;
                int lo = j + 1, hi = n - 1;
                while (lo < hi) {
                    long s = (long)nums[i] + nums[j] + nums[lo] + nums[hi];
                    if (s < target) lo++;
                    else if (s > target) hi--;
                    else {
                        result.add(Arrays.asList(nums[i], nums[j], nums[lo], nums[hi]));
                        while (lo < hi && nums[lo] == nums[lo+1]) lo++;
                        while (lo < hi && nums[hi] == nums[hi-1]) hi--;
                        lo++; hi--;
                    }
                }
            }
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<vector<int>> result;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j-1]) continue;
                int lo = j + 1, hi = n - 1;
                while (lo < hi) {
                    long long s = (long long)nums[i] + nums[j] + nums[lo] + nums[hi];
                    if (s < target) lo++;
                    else if (s > target) hi--;
                    else {
                        result.push_back({nums[i], nums[j], nums[lo], nums[hi]});
                        while (lo < hi && nums[lo] == nums[lo+1]) lo++;
                        while (lo < hi && nums[hi] == nums[hi-1]) hi--;
                        lo++; hi--;
                    }
                }
            }
        }
        return result;
    }
};
$CPP$,'O(n^3)','O(1) extra');

-- TP5) trapping-rain-water-tp (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('trapping-rain-water-tp','two-pointers','Trapping Rain Water','Hard',
$$<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.</p>$$,
'',ARRAY['Water at position i = min(leftMax, rightMax) - height[i].','Use two pointers from both ends with running left and right maxima.','Process whichever side has the smaller max first.'],
'500','https://leetcode.com/problems/trapping-rain-water/',
'trap','[{"name":"height","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["[0,1,0,2,1,0,1,3,2,1,2,1]"],"expected":"6"},{"inputs":["[4,2,0,3,2,5]"],"expected":"9"},{"inputs":["[1,2,3,4,5]"],"expected":"0"},{"inputs":["[5,4,3,2,1]"],"expected":"0"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('trapping-rain-water-tp','python',$PY$class Solution:
    def trap(self, height: List[int]) -> int:
        $PY$),
('trapping-rain-water-tp','javascript',$JS$var trap = function(height) {

};$JS$),
('trapping-rain-water-tp','java',$JAVA$class Solution {
    public int trap(int[] height) {

    }
}$JAVA$),
('trapping-rain-water-tp','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('trapping-rain-water-tp',1,'Two Pointers',
'Use left and right pointers with running maxima. The side with the smaller max determines the water level at that position.',
$ALGO$["Set l = 0, r = n-1, leftMax = 0, rightMax = 0, water = 0.","While l < r: if height[l] < height[r], update leftMax, add leftMax - height[l] to water, l++. Else update rightMax, add rightMax - height[r] to water, r--.","Return water."]$ALGO$::jsonb,
$PY$class Solution:
    def trap(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        left_max = right_max = water = 0
        while l < r:
            if height[l] < height[r]:
                left_max = max(left_max, height[l])
                water += left_max - height[l]
                l += 1
            else:
                right_max = max(right_max, height[r])
                water += right_max - height[r]
                r -= 1
        return water
$PY$,
$JS$var trap = function(height) {
    let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            leftMax = Math.max(leftMax, height[l]);
            water += leftMax - height[l];
            l++;
        } else {
            rightMax = Math.max(rightMax, height[r]);
            water += rightMax - height[r];
            r--;
        }
    }
    return water;
};
$JS$,
$JAVA$class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                leftMax = Math.max(leftMax, height[l]);
                water += leftMax - height[l];
                l++;
            } else {
                rightMax = Math.max(rightMax, height[r]);
                water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = height.size() - 1, leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            if (height[l] < height[r]) {
                leftMax = max(leftMax, height[l]);
                water += leftMax - height[l];
                l++;
            } else {
                rightMax = max(rightMax, height[r]);
                water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
};
$CPP$,'O(n)','O(1)');

COMMIT;
