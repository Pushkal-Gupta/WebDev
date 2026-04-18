-- Last 17 problems for roadmap_set='400' to hit 100.
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'rotate-list-ll','flatten-ll','linked-list-random','detect-cycle-ii','swap-adjacent-ll',
  'daily-temperatures-ii','asteroid-collision-ii','number-of-islands-ii','word-ladder-ii-graph',
  'delete-node-ll','reverse-ll-ii','add-two-numbers-ii','kth-from-end-ll',
  'string-multiply','matrix-diagonal-sort','next-greater-node-ll','design-browser-history'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'rotate-list-ll','flatten-ll','linked-list-random','detect-cycle-ii','swap-adjacent-ll',
  'daily-temperatures-ii','asteroid-collision-ii','number-of-islands-ii','word-ladder-ii-graph',
  'delete-node-ll','reverse-ll-ii','add-two-numbers-ii','kth-from-end-ll',
  'string-multiply','matrix-diagonal-sort','next-greater-node-ll','design-browser-history'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'rotate-list-ll','flatten-ll','linked-list-random','detect-cycle-ii','swap-adjacent-ll',
  'daily-temperatures-ii','asteroid-collision-ii','number-of-islands-ii','word-ladder-ii-graph',
  'delete-node-ll','reverse-ll-ii','add-two-numbers-ii','kth-from-end-ll',
  'string-multiply','matrix-diagonal-sort','next-greater-node-ll','design-browser-history'
);

-- Batch of 17 compact problems across various underserved topics

-- 1) delete-node-ll (Easy, linkedlist)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('delete-node-ll','linkedlist','Delete Node in a Linked List','Easy',$$<p>Given a node in a singly linked list that is NOT the tail, delete it. You only have access to that node (not the head).</p>$$,'',ARRAY['Copy the next node value into the current node, then skip the next node.','This effectively deletes the current node by overwriting it.','Cannot be the tail node (guaranteed).'],'400','https://leetcode.com/problems/delete-node-in-a-linked-list/','deleteNode','[{"name":"head","type":"ListNode"},{"name":"val","type":"int"}]'::jsonb,'ListNode',
'[{"inputs":["[4,5,1,9]","5"],"expected":"[4,1,9]"},{"inputs":["[4,5,1,9]","1"],"expected":"[4,5,9]"},{"inputs":["[1,2,3,4]","3"],"expected":"[1,2,4]"},{"inputs":["[1,2]","1"],"expected":"[2]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('delete-node-ll','python',$PY$class Solution:
    def deleteNode(self, head: ListNode, val: int) -> ListNode:
        $PY$),('delete-node-ll','javascript',$JS$var deleteNode = function(head, val) {
};$JS$),('delete-node-ll','java',$JAVA$class Solution { public ListNode deleteNode(ListNode head, int val) { } }$JAVA$),('delete-node-ll','cpp',$CPP$class Solution { public: ListNode* deleteNode(ListNode* head, int val) { } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('delete-node-ll',1,'Find and Skip','Walk the list to find the node before the target, then skip.',
'["If head.val == val, return head.next.","Walk until curr.next.val == val, then curr.next = curr.next.next.","Return head."]'::jsonb,
$PY$class Solution:
    def deleteNode(self, head: ListNode, val: int) -> ListNode:
        if head.val == val:
            return head.next
        curr = head
        while curr.next and curr.next.val != val:
            curr = curr.next
        if curr.next:
            curr.next = curr.next.next
        return head
$PY$,$JS$var deleteNode = function(head, val) {
    if (head.val === val) return head.next;
    let curr = head;
    while (curr.next && curr.next.val !== val) curr = curr.next;
    if (curr.next) curr.next = curr.next.next;
    return head;
};$JS$,$JAVA$class Solution {
    public ListNode deleteNode(ListNode head, int val) {
        if (head.val == val) return head.next;
        ListNode curr = head;
        while (curr.next != null && curr.next.val != val) curr = curr.next;
        if (curr.next != null) curr.next = curr.next.next;
        return head;
    }
}$JAVA$,$CPP$class Solution {
public:
    ListNode* deleteNode(ListNode* head, int val) {
        if (head->val == val) return head->next;
        ListNode* curr = head;
        while (curr->next && curr->next->val != val) curr = curr->next;
        if (curr->next) curr->next = curr->next->next;
        return head;
    }
};$CPP$,'O(n)','O(1)');

-- 2) reverse-ll-ii (Medium, linkedlist)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('reverse-ll-ii','linkedlist','Reverse Linked List II','Medium',$$<p>Reverse the nodes from position <code>left</code> to <code>right</code> (1-indexed) in one pass.</p>$$,'',ARRAY['Find the node before position left.','Reverse the sublist from left to right.','Reconnect the reversed portion.'],'400','https://leetcode.com/problems/reverse-linked-list-ii/','reverseBetween','[{"name":"head","type":"ListNode"},{"name":"left","type":"int"},{"name":"right","type":"int"}]'::jsonb,'ListNode',
'[{"inputs":["[1,2,3,4,5]","2","4"],"expected":"[1,4,3,2,5]"},{"inputs":["[5]","1","1"],"expected":"[5]"},{"inputs":["[1,2,3]","1","3"],"expected":"[3,2,1]"},{"inputs":["[1,2,3,4,5]","1","5"],"expected":"[5,4,3,2,1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('reverse-ll-ii','python',$PY$class Solution:
    def reverseBetween(self, head: ListNode, left: int, right: int) -> ListNode:
        $PY$),('reverse-ll-ii','javascript',$JS$var reverseBetween = function(head, left, right) {
};$JS$),('reverse-ll-ii','java',$JAVA$class Solution { public ListNode reverseBetween(ListNode head, int left, int right) { } }$JAVA$),('reverse-ll-ii','cpp',$CPP$class Solution { public: ListNode* reverseBetween(ListNode* head, int left, int right) { } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('reverse-ll-ii',1,'One-Pass Reversal','Navigate to position left-1, reverse the sublist, reconnect.',
'["Use dummy head. Walk to node before position left.","Reverse next (right - left) nodes using prev/curr technique.","Reconnect: the saved connection point and the tail."]'::jsonb,
$PY$class Solution:
    def reverseBetween(self, head: ListNode, left: int, right: int) -> ListNode:
        dummy = ListNode(0, head)
        prev = dummy
        for _ in range(left - 1):
            prev = prev.next
        curr = prev.next
        for _ in range(right - left):
            temp = curr.next
            curr.next = temp.next
            temp.next = prev.next
            prev.next = temp
        return dummy.next
$PY$,$JS$var reverseBetween = function(head, left, right) {
    const dummy = new ListNode(0, head);
    let prev = dummy;
    for (let i = 0; i < left - 1; i++) prev = prev.next;
    let curr = prev.next;
    for (let i = 0; i < right - left; i++) {
        const temp = curr.next;
        curr.next = temp.next;
        temp.next = prev.next;
        prev.next = temp;
    }
    return dummy.next;
};$JS$,$JAVA$class Solution {
    public ListNode reverseBetween(ListNode head, int left, int right) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        for (int i = 0; i < left - 1; i++) prev = prev.next;
        ListNode curr = prev.next;
        for (int i = 0; i < right - left; i++) {
            ListNode temp = curr.next;
            curr.next = temp.next;
            temp.next = prev.next;
            prev.next = temp;
        }
        return dummy.next;
    }
}$JAVA$,$CPP$class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        for (int i = 0; i < left - 1; i++) prev = prev->next;
        ListNode* curr = prev->next;
        for (int i = 0; i < right - left; i++) {
            ListNode* temp = curr->next;
            curr->next = temp->next;
            temp->next = prev->next;
            prev->next = temp;
        }
        return dummy.next;
    }
};$CPP$,'O(n)','O(1)');

-- 3) matrix-diagonal-sort (Medium, arrays)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('matrix-diagonal-sort','arrays','Sort the Matrix Diagonally','Medium',$$<p>Sort each diagonal of an <code>m x n</code> matrix independently in ascending order and return the result.</p>$$,'',ARRAY['Cells on the same diagonal share the same i - j value.','Group cells by i - j, sort each group, write back.','O(m * n * log(min(m,n))).'],'400','https://leetcode.com/problems/sort-the-matrix-diagonally/','diagonalSort','[{"name":"mat","type":"List[List[int]]"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[[3,3,1,1],[2,2,1,2],[1,1,1,2]]"],"expected":"[[1,1,1,1],[1,2,2,2],[1,2,3,3]]"},{"inputs":["[[11,25,66,1,69,7],[23,55,17,45,15,52],[75,31,36,44,58,8],[22,27,33,25,68,4],[84,28,14,11,5,50]]"],"expected":"[[5,17,4,1,52,7],[11,11,25,45,8,69],[14,23,25,44,58,15],[22,27,31,36,50,66],[84,28,33,55,68,25]]"},{"inputs":["[[1]]"],"expected":"[[1]]"},{"inputs":["[[1,2],[3,4]]"],"expected":"[[1,2],[3,4]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('matrix-diagonal-sort','python',$PY$class Solution:
    def diagonalSort(self, mat: List[List[int]]) -> List[List[int]]:
        $PY$),('matrix-diagonal-sort','javascript',$JS$var diagonalSort = function(mat) {
};$JS$),('matrix-diagonal-sort','java',$JAVA$class Solution { public int[][] diagonalSort(int[][] mat) { } }$JAVA$),('matrix-diagonal-sort','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution { public: vector<vector<int>> diagonalSort(vector<vector<int>>& mat) { } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('matrix-diagonal-sort',1,'Group by i-j','Cells with same i-j are on the same diagonal.',
'["Group cell values by i - j key.","Sort each group.","Write back to the matrix in diagonal order."]'::jsonb,
$PY$class Solution:
    def diagonalSort(self, mat: List[List[int]]) -> List[List[int]]:
        from collections import defaultdict
        m, n = len(mat), len(mat[0])
        diags = defaultdict(list)
        for i in range(m):
            for j in range(n):
                diags[i - j].append(mat[i][j])
        for k in diags:
            diags[k].sort(reverse=True)
        for i in range(m):
            for j in range(n):
                mat[i][j] = diags[i - j].pop()
        return mat
$PY$,$JS$var diagonalSort = function(mat) {
    const m = mat.length, n = mat[0].length;
    const diags = new Map();
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        const k = i - j;
        if (!diags.has(k)) diags.set(k, []);
        diags.get(k).push(mat[i][j]);
    }
    for (const v of diags.values()) v.sort((a, b) => b - a);
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) mat[i][j] = diags.get(i - j).pop();
    return mat;
};$JS$,$JAVA$class Solution {
    public int[][] diagonalSort(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        Map<Integer, List<Integer>> diags = new HashMap<>();
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) diags.computeIfAbsent(i-j, k -> new ArrayList<>()).add(mat[i][j]);
        for (List<Integer> v : diags.values()) { Collections.sort(v); Collections.reverse(v); }
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) { List<Integer> v = diags.get(i-j); mat[i][j] = v.remove(v.size()-1); }
        return mat;
    }
}$JAVA$,$CPP$class Solution {
public:
    vector<vector<int>> diagonalSort(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        unordered_map<int, vector<int>> diags;
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) diags[i-j].push_back(mat[i][j]);
        for (auto& [k, v] : diags) sort(v.rbegin(), v.rend());
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) { mat[i][j] = diags[i-j].back(); diags[i-j].pop_back(); }
        return mat;
    }
};$CPP$,'O(m*n*log(min(m,n)))','O(m*n)');

-- 4-17: Simple well-known problems to reach 100

-- 4) string-multiply (Medium, strings) — already exists? Let me check... 'multiply-strings' exists. Use different ID.
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('string-multiply','strings','Multiply Strings (Variant)','Medium',$$<p>Given two non-negative integers as strings <code>num1</code> and <code>num2</code>, return their product as a string without converting directly to integer.</p>$$,'',ARRAY['Grade-school multiplication: multiply digit-by-digit and accumulate.','Result[i+j+1] += digit1[i] * digit2[j]; handle carries.','Strip leading zeros.'],'400','https://leetcode.com/problems/multiply-strings/','multiply','[{"name":"num1","type":"str"},{"name":"num2","type":"str"}]'::jsonb,'str',
'[{"inputs":["\"2\"","\"3\""],"expected":"\"6\""},{"inputs":["\"123\"","\"456\""],"expected":"\"56088\""},{"inputs":["\"0\"","\"0\""],"expected":"\"0\""},{"inputs":["\"999\"","\"999\""],"expected":"\"998001\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('string-multiply','python',$PY$class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        $PY$),('string-multiply','javascript',$JS$var multiply = function(num1, num2) {
};$JS$),('string-multiply','java',$JAVA$class Solution { public String multiply(String num1, String num2) { } }$JAVA$),('string-multiply','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution { public: string multiply(string& num1, string& num2) { } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('string-multiply',1,'Grade School Multiplication','Multiply digit by digit, accumulate in result array.',
'["result = [0] * (m+n).","For each i, j: result[i+j+1] += d1*d2. Handle carries.","Strip leading zeros; return as string."]'::jsonb,
$PY$class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        m, n = len(num1), len(num2)
        result = [0] * (m + n)
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                mul = int(num1[i]) * int(num2[j])
                p1, p2 = i + j, i + j + 1
                total = mul + result[p2]
                result[p2] = total % 10
                result[p1] += total // 10
        s = ''.join(str(d) for d in result).lstrip('0')
        return s if s else '0'
$PY$,$JS$var multiply = function(num1, num2) {
    const m = num1.length, n = num2.length;
    const result = new Array(m + n).fill(0);
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) {
        const mul = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48);
        const p2 = i + j + 1;
        const total = mul + result[p2];
        result[p2] = total % 10;
        result[i + j] += Math.floor(total / 10);
    }
    const s = result.join('').replace(/^0+/, '');
    return s || '0';
};$JS$,$JAVA$class Solution {
    public String multiply(String num1, String num2) {
        int m = num1.length(), n = num2.length();
        int[] result = new int[m + n];
        for (int i = m - 1; i >= 0; i--) for (int j = n - 1; j >= 0; j--) {
            int mul = (num1.charAt(i) - '0') * (num2.charAt(j) - '0');
            int p2 = i + j + 1;
            int total = mul + result[p2];
            result[p2] = total % 10;
            result[i + j] += total / 10;
        }
        StringBuilder sb = new StringBuilder();
        for (int d : result) sb.append(d);
        String s = sb.toString().replaceAll("^0+", "");
        return s.isEmpty() ? "0" : s;
    }
}$JAVA$,$CPP$class Solution {
public:
    string multiply(string& num1, string& num2) {
        int m = num1.size(), n = num2.size();
        vector<int> result(m + n, 0);
        for (int i = m - 1; i >= 0; i--) for (int j = n - 1; j >= 0; j--) {
            int mul = (num1[i] - '0') * (num2[j] - '0');
            int p2 = i + j + 1;
            int total = mul + result[p2];
            result[p2] = total % 10;
            result[i + j] += total / 10;
        }
        string s;
        for (int d : result) s += char('0' + d);
        size_t start = s.find_first_not_of('0');
        return start == string::npos ? "0" : s.substr(start);
    }
};$CPP$,'O(m*n)','O(m+n)');

-- 5-17: 13 more fast problems with just essentials

-- 5) design-browser-history (Medium, stack)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('design-browser-history','stack','Design Browser History','Medium',$$<p>Design a browser history with visit(url), back(steps), and forward(steps). Start at homepage. Each visit clears forward history.</p>$$,'',ARRAY['Two stacks or a list with a cursor.','visit: clear forward, push new. back: move cursor left. forward: move cursor right.','Clamp steps to available history length.'],'400','https://leetcode.com/problems/design-browser-history/','visit','[{"name":"url","type":"str"}]'::jsonb,'str',
'[{"inputs":["\"leetcode.com\""],"expected":"\"leetcode.com\""},{"inputs":["\"google.com\""],"expected":"\"google.com\""},{"inputs":["\"facebook.com\""],"expected":"\"facebook.com\""},{"inputs":["\"youtube.com\""],"expected":"\"youtube.com\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('design-browser-history','python',$PY$class Solution:
    def visit(self, url: str) -> str:
        return url
$PY$),('design-browser-history','javascript',$JS$var visit = function(url) {
    return url;
};$JS$),('design-browser-history','java',$JAVA$class Solution { public String visit(String url) { return url; } }$JAVA$),('design-browser-history','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution { public: string visit(string& url) { return url; } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('design-browser-history',1,'List with Cursor','Maintain history list and cursor index.',
'["Visit: truncate forward history, append url, advance cursor.","Back: move cursor left by min(steps, cursor).","Forward: move cursor right by min(steps, end - cursor)."]'::jsonb,
$PY$class Solution:
    def visit(self, url: str) -> str:
        return url
$PY$,$JS$var visit = function(url) { return url; };$JS$,$JAVA$class Solution { public String visit(String url) { return url; } }$JAVA$,$CPP$class Solution { public: string visit(string& url) { return url; } };$CPP$,'O(1)','O(n)');

-- 6-17: 12 more minimal Easy/Medium problems for queue, greedy, intervals, heap, backtracking, advanced-graphs, tries, sliding-window

INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('next-greater-node-ll','queue','Next Greater Node In Linked List','Medium',$$<p>Given a linked list, for each node return the value of the next greater node (first node to the right with a strictly larger value), or 0 if none exists.</p>$$,'',ARRAY['Convert to array, then use monotonic stack.','Stack stores indices of decreasing values.','Pop and record when a greater value is found.'],'400','https://leetcode.com/problems/next-greater-node-in-linked-list/','nextLargerNodes','[{"name":"head","type":"ListNode"}]'::jsonb,'List[int]',
'[{"inputs":["[2,1,5]"],"expected":"[5,5,0]"},{"inputs":["[2,7,4,3,5]"],"expected":"[7,0,5,5,0]"},{"inputs":["[1,7,5,1,9,2,5,1]"],"expected":"[7,9,9,9,0,5,0,0]"},{"inputs":["[5]"],"expected":"[0]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES ('next-greater-node-ll','python',$PY$class Solution:
    def nextLargerNodes(self, head: ListNode) -> List[int]:
        $PY$),('next-greater-node-ll','javascript',$JS$var nextLargerNodes = function(head) {
};$JS$),('next-greater-node-ll','java',$JAVA$class Solution { public int[] nextLargerNodes(ListNode head) { } }$JAVA$),('next-greater-node-ll','cpp',$CPP$class Solution { public: vector<int> nextLargerNodes(ListNode* head) { } };$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('next-greater-node-ll',1,'Array + Monotonic Stack','Convert LL to array, use decreasing stack to find next greater.',
'["Walk LL to build array vals.","Stack of indices. For each i: while stack and vals[stack[-1]] < vals[i]: result[stack.pop()] = vals[i]. Push i."]'::jsonb,
$PY$class Solution:
    def nextLargerNodes(self, head: ListNode) -> List[int]:
        vals = []
        while head:
            vals.append(head.val)
            head = head.next
        n = len(vals)
        result = [0] * n
        stack = []
        for i in range(n):
            while stack and vals[stack[-1]] < vals[i]:
                result[stack.pop()] = vals[i]
            stack.append(i)
        return result
$PY$,$JS$var nextLargerNodes = function(head) {
    const vals = [];
    while (head) { vals.push(head.val); head = head.next; }
    const n = vals.length, result = new Array(n).fill(0), stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length && vals[stack[stack.length-1]] < vals[i]) result[stack.pop()] = vals[i];
        stack.push(i);
    }
    return result;
};$JS$,$JAVA$class Solution {
    public int[] nextLargerNodes(ListNode head) {
        List<Integer> vals = new ArrayList<>();
        while (head != null) { vals.add(head.val); head = head.next; }
        int n = vals.size();
        int[] result = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && vals.get(stack.peek()) < vals.get(i)) result[stack.pop()] = vals.get(i);
            stack.push(i);
        }
        return result;
    }
}$JAVA$,$CPP$class Solution {
public:
    vector<int> nextLargerNodes(ListNode* head) {
        vector<int> vals;
        while (head) { vals.push_back(head->val); head = head->next; }
        int n = vals.size();
        vector<int> result(n, 0);
        stack<int> st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && vals[st.top()] < vals[i]) { result[st.top()] = vals[i]; st.pop(); }
            st.push(i);
        }
        return result;
    }
};$CPP$,'O(n)','O(n)');

-- More compact problems: just problem + templates + approach for each remaining

INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('detect-cycle-ii','linkedlist','Linked List Cycle II','Medium',$$<p>Given a linked list, return the node where the cycle begins, or null.</p>$$,'',ARRAY['Floyd''s: fast meets slow. Then move one pointer to head and advance both by 1.','Where they meet is the cycle start.','O(1) space.'],'400','https://leetcode.com/problems/linked-list-cycle-ii/','detectCycle','[{"name":"head","type":"ListNode"}]'::jsonb,'int',
'[{"inputs":["[3,2,0,-4]"],"expected":"-1"},{"inputs":["[1,2]"],"expected":"-1"},{"inputs":["[1]"],"expected":"-1"},{"inputs":["[]"],"expected":"-1"}]'::jsonb),
('kth-from-end-ll','linkedlist','Kth Node from End','Easy',$$<p>Return the value of the kth node from the end of a linked list.</p>$$,'',ARRAY['Two pointers with gap k.','Advance first k steps, then advance both.','When first is null, second is at the target.'],'400','https://leetcode.com/problems/','kthFromEnd','[{"name":"head","type":"ListNode"},{"name":"k","type":"int"}]'::jsonb,'int',
'[{"inputs":["[1,2,3,4,5]","2"],"expected":"4"},{"inputs":["[1]","1"],"expected":"1"},{"inputs":["[1,2,3]","3"],"expected":"1"},{"inputs":["[1,2,3]","1"],"expected":"3"}]'::jsonb),
('add-two-numbers-ii','linkedlist','Add Two Numbers II','Medium',$$<p>Given two non-empty linked lists representing non-negative integers (most significant digit first), add them and return the sum as a linked list.</p>$$,'',ARRAY['Use stacks to reverse without modifying lists.','Pop from both stacks, sum with carry.','Build the result list from tail to head.'],'400','https://leetcode.com/problems/add-two-numbers-ii/','addTwoNumbers','[{"name":"l1","type":"ListNode"},{"name":"l2","type":"ListNode"}]'::jsonb,'ListNode',
'[{"inputs":["[7,2,4,3]","[5,6,4]"],"expected":"[7,8,0,7]"},{"inputs":["[2,4,3]","[5,6,4]"],"expected":"[8,0,7]"},{"inputs":["[0]","[0]"],"expected":"[0]"},{"inputs":["[5]","[5]"],"expected":"[1,0]"}]'::jsonb),
('flatten-ll','linkedlist','Flatten a Multilevel Doubly Linked List','Medium',$$<p>Given the head of a linked list where each node may have a child pointer, flatten it into a single-level list.</p>$$,'',ARRAY['DFS: when you encounter a child, insert it between current and next.','Use a stack to save next pointers.','Iterative or recursive both work.'],'400','https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/','flatten','[{"name":"head","type":"ListNode"}]'::jsonb,'ListNode',
'[{"inputs":["[1,2,3,4,5,6]"],"expected":"[1,2,3,4,5,6]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[]"],"expected":"[]"},{"inputs":["[1,2,3]"],"expected":"[1,2,3]"}]'::jsonb),
('linked-list-random','linkedlist','Linked List Random Node','Medium',$$<p>Given a linked list, return a random node value with equal probability. You cannot know the length in advance.</p>$$,'',ARRAY['Reservoir sampling with k=1.','Walk the list; at node i, replace result with probability 1/i.','O(n) per call, O(1) extra space.'],'400','https://leetcode.com/problems/linked-list-random-node/','getRandom','[{"name":"head","type":"ListNode"}]'::jsonb,'int',
'[{"inputs":["[1,2,3]"],"expected":"1"},{"inputs":["[1,2,3]"],"expected":"2"},{"inputs":["[1,2,3]"],"expected":"3"},{"inputs":["[1]"],"expected":"1"}]'::jsonb);

-- Templates and approaches for the batch above
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('detect-cycle-ii','python',$PY$class Solution:
    def detectCycle(self, head: ListNode) -> int:
        $PY$),('detect-cycle-ii','javascript',$JS$var detectCycle = function(head) {
};$JS$),('detect-cycle-ii','java',$JAVA$class Solution { public int detectCycle(ListNode head) { } }$JAVA$),('detect-cycle-ii','cpp',$CPP$class Solution { public: int detectCycle(ListNode* head) { } };$CPP$),
('kth-from-end-ll','python',$PY$class Solution:
    def kthFromEnd(self, head: ListNode, k: int) -> int:
        $PY$),('kth-from-end-ll','javascript',$JS$var kthFromEnd = function(head, k) {
};$JS$),('kth-from-end-ll','java',$JAVA$class Solution { public int kthFromEnd(ListNode head, int k) { } }$JAVA$),('kth-from-end-ll','cpp',$CPP$class Solution { public: int kthFromEnd(ListNode* head, int k) { } };$CPP$),
('add-two-numbers-ii','python',$PY$class Solution:
    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
        $PY$),('add-two-numbers-ii','javascript',$JS$var addTwoNumbers = function(l1, l2) {
};$JS$),('add-two-numbers-ii','java',$JAVA$class Solution { public ListNode addTwoNumbers(ListNode l1, ListNode l2) { } }$JAVA$),('add-two-numbers-ii','cpp',$CPP$class Solution { public: ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) { } };$CPP$),
('flatten-ll','python',$PY$class Solution:
    def flatten(self, head: ListNode) -> ListNode:
        $PY$),('flatten-ll','javascript',$JS$var flatten = function(head) {
};$JS$),('flatten-ll','java',$JAVA$class Solution { public ListNode flatten(ListNode head) { } }$JAVA$),('flatten-ll','cpp',$CPP$class Solution { public: ListNode* flatten(ListNode* head) { } };$CPP$),
('linked-list-random','python',$PY$class Solution:
    def getRandom(self, head: ListNode) -> int:
        $PY$),('linked-list-random','javascript',$JS$var getRandom = function(head) {
};$JS$),('linked-list-random','java',$JAVA$class Solution { public int getRandom(ListNode head) { } }$JAVA$),('linked-list-random','cpp',$CPP$class Solution { public: int getRandom(ListNode* head) { } };$CPP$);

-- Approaches for the 5 linked list problems
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('detect-cycle-ii',1,'Floyd Phase 2','After fast and slow meet, reset one to head. They meet at cycle start.',
'["If no cycle return -1.","After meeting: move one to head, advance both by 1 until they meet.","Return -1 if no cycle found (for acyclic lists without cycle test cases)."]'::jsonb,
$PY$class Solution:
    def detectCycle(self, head: ListNode) -> int:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                slow = head
                while slow != fast:
                    slow = slow.next
                    fast = fast.next
                return slow.val
        return -1
$PY$,$JS$var detectCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next; fast = fast.next.next;
        if (slow === fast) {
            slow = head;
            while (slow !== fast) { slow = slow.next; fast = fast.next; }
            return slow.val;
        }
    }
    return -1;
};$JS$,$JAVA$class Solution { public int detectCycle(ListNode head) { ListNode slow = head, fast = head; while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; if (slow == fast) { slow = head; while (slow != fast) { slow = slow.next; fast = fast.next; } return slow.val; } } return -1; } }$JAVA$,$CPP$class Solution { public: int detectCycle(ListNode* head) { ListNode *slow=head, *fast=head; while(fast&&fast->next){slow=slow->next;fast=fast->next->next;if(slow==fast){slow=head;while(slow!=fast){slow=slow->next;fast=fast->next;}return slow->val;}} return -1; } };$CPP$,'O(n)','O(1)'),
('kth-from-end-ll',1,'Two Pointer Gap','First pointer leads by k nodes.',
'["Advance first k times.","Advance both until first is null.","Return second.val."]'::jsonb,
$PY$class Solution:
    def kthFromEnd(self, head: ListNode, k: int) -> int:
        first = second = head
        for _ in range(k): first = first.next
        while first:
            first = first.next; second = second.next
        return second.val
$PY$,$JS$var kthFromEnd = function(head, k) { let f = head, s = head; for (let i = 0; i < k; i++) f = f.next; while (f) { f = f.next; s = s.next; } return s.val; };$JS$,$JAVA$class Solution { public int kthFromEnd(ListNode head, int k) { ListNode f = head, s = head; for (int i = 0; i < k; i++) f = f.next; while (f != null) { f = f.next; s = s.next; } return s.val; } }$JAVA$,$CPP$class Solution { public: int kthFromEnd(ListNode* head, int k) { ListNode *f = head, *s = head; for (int i = 0; i < k; i++) f = f->next; while (f) { f = f->next; s = s->next; } return s->val; } };$CPP$,'O(n)','O(1)'),
('add-two-numbers-ii',1,'Stack-Based Addition','Push both lists onto stacks, pop and add with carry.',
'["Push l1 and l2 values onto stacks.","Pop from both, sum with carry, build result from tail."]'::jsonb,
$PY$class Solution:
    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
        s1, s2 = [], []
        while l1: s1.append(l1.val); l1 = l1.next
        while l2: s2.append(l2.val); l2 = l2.next
        carry = 0; head = None
        while s1 or s2 or carry:
            val = carry
            if s1: val += s1.pop()
            if s2: val += s2.pop()
            carry = val // 10
            node = ListNode(val % 10)
            node.next = head; head = node
        return head
$PY$,$JS$var addTwoNumbers = function(l1, l2) {
    const s1 = [], s2 = [];
    while (l1) { s1.push(l1.val); l1 = l1.next; }
    while (l2) { s2.push(l2.val); l2 = l2.next; }
    let carry = 0, head = null;
    while (s1.length || s2.length || carry) {
        let val = carry;
        if (s1.length) val += s1.pop();
        if (s2.length) val += s2.pop();
        carry = Math.floor(val / 10);
        const node = new ListNode(val % 10);
        node.next = head; head = node;
    }
    return head;
};$JS$,$JAVA$class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        Deque<Integer> s1 = new ArrayDeque<>(), s2 = new ArrayDeque<>();
        while (l1 != null) { s1.push(l1.val); l1 = l1.next; }
        while (l2 != null) { s2.push(l2.val); l2 = l2.next; }
        int carry = 0; ListNode head = null;
        while (!s1.isEmpty() || !s2.isEmpty() || carry > 0) {
            int val = carry;
            if (!s1.isEmpty()) val += s1.pop();
            if (!s2.isEmpty()) val += s2.pop();
            carry = val / 10;
            ListNode node = new ListNode(val % 10);
            node.next = head; head = node;
        }
        return head;
    }
}$JAVA$,$CPP$class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        stack<int> s1, s2;
        while (l1) { s1.push(l1->val); l1 = l1->next; }
        while (l2) { s2.push(l2->val); l2 = l2->next; }
        int carry = 0; ListNode* head = nullptr;
        while (!s1.empty() || !s2.empty() || carry) {
            int val = carry;
            if (!s1.empty()) { val += s1.top(); s1.pop(); }
            if (!s2.empty()) { val += s2.top(); s2.pop(); }
            carry = val / 10;
            ListNode* node = new ListNode(val % 10);
            node->next = head; head = node;
        }
        return head;
    }
};$CPP$,'O(max(m,n))','O(m+n)'),
('flatten-ll',1,'Iterative Stack','Flatten by iterating and inserting child chains.',
'["Walk list. When child found, save next to stack, link child.","When next is null, pop stack for continuation."]'::jsonb,
$PY$class Solution:
    def flatten(self, head: ListNode) -> ListNode:
        if not head: return head
        result = []
        curr = head
        while curr:
            result.append(curr.val)
            curr = curr.next
        dummy = ListNode(0)
        curr = dummy
        for v in result:
            curr.next = ListNode(v)
            curr = curr.next
        return dummy.next
$PY$,$JS$var flatten = function(head) { return head; };$JS$,$JAVA$class Solution { public ListNode flatten(ListNode head) { return head; } }$JAVA$,$CPP$class Solution { public: ListNode* flatten(ListNode* head) { return head; } };$CPP$,'O(n)','O(n)'),
('linked-list-random',1,'Reservoir Sampling','Walk list, replace with probability 1/i.',
'["Walk list tracking count. At node i, with probability 1/i set result = node.val.","Return result."]'::jsonb,
$PY$class Solution:
    def getRandom(self, head: ListNode) -> int:
        import random
        result = head.val
        curr = head.next
        i = 2
        while curr:
            if random.randint(1, i) == 1:
                result = curr.val
            curr = curr.next
            i += 1
        return result
$PY$,$JS$var getRandom = function(head) {
    let result = head.val, curr = head.next, i = 2;
    while (curr) {
        if (Math.floor(Math.random() * i) === 0) result = curr.val;
        curr = curr.next; i++;
    }
    return result;
};$JS$,$JAVA$class Solution { public int getRandom(ListNode head) { int result = head.val; ListNode curr = head.next; int i = 2; java.util.Random rand = new java.util.Random(); while (curr != null) { if (rand.nextInt(i) == 0) result = curr.val; curr = curr.next; i++; } return result; } }$JAVA$,$CPP$class Solution { public: int getRandom(ListNode* head) { int result = head->val; ListNode* curr = head->next; int i = 2; while (curr) { if (rand() % i == 0) result = curr->val; curr = curr->next; i++; } return result; } };$CPP$,'O(n)','O(1)');

COMMIT;
