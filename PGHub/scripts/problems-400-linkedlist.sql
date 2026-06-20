-- Grow catalog 300 → 400: linkedlist topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'palindrome-linked-list','middle-linked-list','intersection-two-linked-lists',
  'odd-even-linked-list','sort-list','rotate-list','partition-list','copy-list-random-pointer'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'palindrome-linked-list','middle-linked-list','intersection-two-linked-lists',
  'odd-even-linked-list','sort-list','rotate-list','partition-list','copy-list-random-pointer'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'palindrome-linked-list','middle-linked-list','intersection-two-linked-lists',
  'odd-even-linked-list','sort-list','rotate-list','partition-list','copy-list-random-pointer'
);

-- 1) palindrome-linked-list (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('palindrome-linked-list','linkedlist','Palindrome Linked List','Easy',
$$<p>Given the <code>head</code> of a singly linked list, return <code>true</code> if it is a palindrome, or <code>false</code> otherwise.</p>$$,
'',ARRAY['Find the middle using slow/fast pointers.','Reverse the second half in place.','Compare the first half with the reversed second half.'],
'400','https://leetcode.com/problems/palindrome-linked-list/',
'isPalindrome','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'bool',
'[{"inputs":["[1,2,2,1]"],"expected":"true"},{"inputs":["[1,2]"],"expected":"false"},{"inputs":["[1]"],"expected":"true"},{"inputs":["[1,2,3,2,1]"],"expected":"true"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('palindrome-linked-list','python',$PY$class Solution:
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        $PY$),
('palindrome-linked-list','javascript',$JS$var isPalindrome = function(head) {

};$JS$),
('palindrome-linked-list','java',$JAVA$class Solution {
    public boolean isPalindrome(ListNode head) {

    }
}$JAVA$),
('palindrome-linked-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPalindrome(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('palindrome-linked-list',1,'Reverse Second Half',
'Find the middle, reverse the second half, then compare both halves node by node.',
'["Use slow/fast pointers to find the middle.","Reverse the list from slow onward.","Compare nodes from head and from the reversed half.","Return false if any mismatch, true otherwise."]'::jsonb,
$PY$class Solution:
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        while slow:
            nxt = slow.next
            slow.next = prev
            prev = slow
            slow = nxt
        while prev:
            if head.val != prev.val:
                return False
            head = head.next
            prev = prev.next
        return True
$PY$,
$JS$var isPalindrome = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
    let prev = null;
    while (slow) { const nxt = slow.next; slow.next = prev; prev = slow; slow = nxt; }
    while (prev) {
        if (head.val !== prev.val) return false;
        head = head.next; prev = prev.next;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isPalindrome(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode prev = null;
        while (slow != null) { ListNode nxt = slow.next; slow.next = prev; prev = slow; slow = nxt; }
        while (prev != null) {
            if (head.val != prev.val) return false;
            head = head.next; prev = prev.next;
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode* prev = nullptr;
        while (slow) { ListNode* nxt = slow->next; slow->next = prev; prev = slow; slow = nxt; }
        while (prev) {
            if (head->val != prev->val) return false;
            head = head->next; prev = prev->next;
        }
        return true;
    }
};
$CPP$,'O(n)','O(1)');

-- 2) middle-linked-list (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('middle-linked-list','linkedlist','Middle of the Linked List','Easy',
$$<p>Given the <code>head</code> of a singly linked list, return the middle node. If there are two middle nodes, return the second middle node.</p>$$,
'',ARRAY['Use slow and fast pointers.','When fast reaches the end, slow is at the middle.','For even-length lists, slow ends up at the second middle.'],
'400','https://leetcode.com/problems/middle-of-the-linked-list/',
'middleNode','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,2,3,4,5]"],"expected":"[3,4,5]"},{"inputs":["[1,2,3,4,5,6]"],"expected":"[4,5,6]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[1,2]"],"expected":"[2]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('middle-linked-list','python',$PY$class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('middle-linked-list','javascript',$JS$var middleNode = function(head) {

};$JS$),
('middle-linked-list','java',$JAVA$class Solution {
    public ListNode middleNode(ListNode head) {

    }
}$JAVA$),
('middle-linked-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* middleNode(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('middle-linked-list',1,'Slow and Fast Pointers',
'Move slow one step and fast two steps. When fast reaches the end, slow is at the middle.',
'["Initialize slow = fast = head.","While fast and fast.next: slow = slow.next, fast = fast.next.next.","Return slow."]'::jsonb,
$PY$class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow
$PY$,
$JS$var middleNode = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
};
$JS$,
$JAVA$class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};
$CPP$,'O(n)','O(1)');

-- 3) intersection-two-linked-lists (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('intersection-two-linked-lists','linkedlist','Intersection of Two Linked Lists','Easy',
$$<p>Given the heads of two singly linked-lists <code>headA</code> and <code>headB</code>, return the node at which the two lists intersect. If they do not intersect, return <code>null</code>. The lists are guaranteed to have no cycles.</p><p><em>Note:</em> For this problem, the input lists are provided as regular arrays and the function should return the value at the intersection node, or -1 if no intersection exists.</p>$$,
'',ARRAY['Traverse both lists to get their lengths.','Align the starting points so both pointers have the same distance to the end.','Alternatively, when pointer A reaches the end, redirect to headB and vice versa.'],
'400','https://leetcode.com/problems/intersection-of-two-linked-lists/',
'getIntersectionVal','[{"name":"headA","type":"List[int]"},{"name":"headB","type":"List[int]"},{"name":"skipA","type":"int"},{"name":"skipB","type":"int"}]'::jsonb,'int',
'[{"inputs":["[4,1,8,4,5]","[5,6,1,8,4,5]","2","3"],"expected":"8"},{"inputs":["[1,9,1,2,4]","[3,2,4]","3","1"],"expected":"2"},{"inputs":["[2,6,4]","[1,5]","3","2"],"expected":"-1"},{"inputs":["[1,2,3]","[9,1,2,3]","0","1"],"expected":"1"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('intersection-two-linked-lists','python',$PY$class Solution:
    def getIntersectionVal(self, headA: List[int], headB: List[int], skipA: int, skipB: int) -> int:
        $PY$),
('intersection-two-linked-lists','javascript',$JS$var getIntersectionVal = function(headA, headB, skipA, skipB) {

};$JS$),
('intersection-two-linked-lists','java',$JAVA$class Solution {
    public int getIntersectionVal(int[] headA, int[] headB, int skipA, int skipB) {

    }
}$JAVA$),
('intersection-two-linked-lists','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int getIntersectionVal(vector<int>& headA, vector<int>& headB, int skipA, int skipB) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('intersection-two-linked-lists',1,'Two-Pass Alignment',
'Arrays share a suffix starting at skipA/skipB. We check if elements from those positions onward are identical.',
'["The intersection starts at index skipA in headA and skipB in headB.","If headA[skipA:] == headB[skipB:], return headA[skipA].","Otherwise return -1."]'::jsonb,
$PY$class Solution:
    def getIntersectionVal(self, headA: List[int], headB: List[int], skipA: int, skipB: int) -> int:
        if skipA >= len(headA) or skipB >= len(headB):
            return -1
        if headA[skipA:] == headB[skipB:]:
            return headA[skipA]
        return -1
$PY$,
$JS$var getIntersectionVal = function(headA, headB, skipA, skipB) {
    if (skipA >= headA.length || skipB >= headB.length) return -1;
    const tailA = headA.slice(skipA);
    const tailB = headB.slice(skipB);
    if (tailA.length !== tailB.length) return -1;
    for (let i = 0; i < tailA.length; i++) {
        if (tailA[i] !== tailB[i]) return -1;
    }
    return headA[skipA];
};
$JS$,
$JAVA$class Solution {
    public int getIntersectionVal(int[] headA, int[] headB, int skipA, int skipB) {
        if (skipA >= headA.length || skipB >= headB.length) return -1;
        int lenA = headA.length - skipA;
        int lenB = headB.length - skipB;
        if (lenA != lenB) return -1;
        for (int i = 0; i < lenA; i++) {
            if (headA[skipA + i] != headB[skipB + i]) return -1;
        }
        return headA[skipA];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int getIntersectionVal(vector<int>& headA, vector<int>& headB, int skipA, int skipB) {
        if (skipA >= (int)headA.size() || skipB >= (int)headB.size()) return -1;
        int lenA = headA.size() - skipA;
        int lenB = headB.size() - skipB;
        if (lenA != lenB) return -1;
        for (int i = 0; i < lenA; i++) {
            if (headA[skipA + i] != headB[skipB + i]) return -1;
        }
        return headA[skipA];
    }
};
$CPP$,'O(n)','O(1)');

-- 4) odd-even-linked-list (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('odd-even-linked-list','linkedlist','Odd Even Linked List','Medium',
$$<p>Given the <code>head</code> of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list. The first node is considered odd, the second node even, and so on. The relative order inside both groups should remain as it was in the input.</p>$$,
'',ARRAY['Use two pointers: one for odd-indexed nodes and one for even-indexed nodes.','Connect the end of the odd list to the head of the even list.','Do it in O(1) extra space.'],
'400','https://leetcode.com/problems/odd-even-linked-list/',
'oddEvenList','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,2,3,4,5]"],"expected":"[1,3,5,2,4]"},{"inputs":["[2,1,3,5,6,4,7]"],"expected":"[2,3,6,7,1,5,4]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[1,2]"],"expected":"[1,2]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('odd-even-linked-list','python',$PY$class Solution:
    def oddEvenList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('odd-even-linked-list','javascript',$JS$var oddEvenList = function(head) {

};$JS$),
('odd-even-linked-list','java',$JAVA$class Solution {
    public ListNode oddEvenList(ListNode head) {

    }
}$JAVA$),
('odd-even-linked-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* oddEvenList(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('odd-even-linked-list',1,'Two-Pointer Relink',
'Maintain two separate chains (odd and even) and splice them together at the end.',
'["If head is null, return null.","odd = head, even = head.next, evenHead = even.","While even and even.next: odd.next = even.next, odd = odd.next, even.next = odd.next, even = even.next.","odd.next = evenHead. Return head."]'::jsonb,
$PY$class Solution:
    def oddEvenList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head:
            return head
        odd = head
        even = head.next
        even_head = even
        while even and even.next:
            odd.next = even.next
            odd = odd.next
            even.next = odd.next
            even = even.next
        odd.next = even_head
        return head
$PY$,
$JS$var oddEvenList = function(head) {
    if (!head) return head;
    let odd = head, even = head.next, evenHead = even;
    while (even && even.next) {
        odd.next = even.next;
        odd = odd.next;
        even.next = odd.next;
        even = even.next;
    }
    odd.next = evenHead;
    return head;
};
$JS$,
$JAVA$class Solution {
    public ListNode oddEvenList(ListNode head) {
        if (head == null) return null;
        ListNode odd = head, even = head.next, evenHead = even;
        while (even != null && even.next != null) {
            odd.next = even.next;
            odd = odd.next;
            even.next = odd.next;
            even = even.next;
        }
        odd.next = evenHead;
        return head;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* oddEvenList(ListNode* head) {
        if (!head) return nullptr;
        ListNode* odd = head;
        ListNode* even = head->next;
        ListNode* evenHead = even;
        while (even && even->next) {
            odd->next = even->next;
            odd = odd->next;
            even->next = odd->next;
            even = even->next;
        }
        odd->next = evenHead;
        return head;
    }
};
$CPP$,'O(n)','O(1)');

-- 5) sort-list (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('sort-list','linkedlist','Sort List','Medium',
$$<p>Given the <code>head</code> of a linked list, return the list after sorting it in ascending order. Can you do it in O(n log n) time and O(1) memory?</p>$$,
'',ARRAY['Use merge sort on the linked list.','Find the middle with slow/fast pointers, split, sort each half, then merge.','Merging two sorted linked lists is straightforward.'],
'400','https://leetcode.com/problems/sort-list/',
'sortList','[{"name":"head","type":"Optional[ListNode]"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[4,2,1,3]"],"expected":"[1,2,3,4]"},{"inputs":["[-1,5,3,4,0]"],"expected":"[-1,0,3,4,5]"},{"inputs":["[]"],"expected":"[]"},{"inputs":["[1]"],"expected":"[1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('sort-list','python',$PY$class Solution:
    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        $PY$),
('sort-list','javascript',$JS$var sortList = function(head) {

};$JS$),
('sort-list','java',$JAVA$class Solution {
    public ListNode sortList(ListNode head) {

    }
}$JAVA$),
('sort-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* sortList(ListNode* head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('sort-list',1,'Merge Sort',
'Recursively split the list in half, sort each half, and merge the sorted halves.',
'["Base case: if head is null or single node, return head.","Find middle with slow/fast. Split list into two halves.","Recursively sort left and right halves.","Merge the two sorted halves and return."]'::jsonb,
$PY$class Solution:
    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        mid = slow.next
        slow.next = None
        left = self.sortList(head)
        right = self.sortList(mid)
        dummy = ListNode(0)
        cur = dummy
        while left and right:
            if left.val <= right.val:
                cur.next = left
                left = left.next
            else:
                cur.next = right
                right = right.next
            cur = cur.next
        cur.next = left if left else right
        return dummy.next
$PY$,
$JS$var sortList = function(head) {
    if (!head || !head.next) return head;
    let slow = head, fast = head.next;
    while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
    const mid = slow.next;
    slow.next = null;
    let left = sortList(head);
    let right = sortList(mid);
    const dummy = new ListNode(0);
    let cur = dummy;
    while (left && right) {
        if (left.val <= right.val) { cur.next = left; left = left.next; }
        else { cur.next = right; right = right.next; }
        cur = cur.next;
    }
    cur.next = left || right;
    return dummy.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode sortList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode slow = head, fast = head.next;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode mid = slow.next;
        slow.next = null;
        ListNode left = sortList(head);
        ListNode right = sortList(mid);
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        while (left != null && right != null) {
            if (left.val <= right.val) { cur.next = left; left = left.next; }
            else { cur.next = right; right = right.next; }
            cur = cur.next;
        }
        cur.next = (left != null) ? left : right;
        return dummy.next;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* sortList(ListNode* head) {
        if (!head || !head->next) return head;
        ListNode* slow = head;
        ListNode* fast = head->next;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode* mid = slow->next;
        slow->next = nullptr;
        ListNode* left = sortList(head);
        ListNode* right = sortList(mid);
        ListNode dummy(0);
        ListNode* cur = &dummy;
        while (left && right) {
            if (left->val <= right->val) { cur->next = left; left = left->next; }
            else { cur->next = right; right = right->next; }
            cur = cur->next;
        }
        cur->next = left ? left : right;
        return dummy.next;
    }
};
$CPP$,'O(n log n)','O(log n) stack');

-- 6) rotate-list (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('rotate-list','linkedlist','Rotate List','Medium',
$$<p>Given the <code>head</code> of a linked list, rotate the list to the right by <code>k</code> places.</p>$$,
'',ARRAY['First compute the length of the list.','k = k % length to handle k > length.','The new head is at position length - k from the start.'],
'400','https://leetcode.com/problems/rotate-list/',
'rotateRight','[{"name":"head","type":"Optional[ListNode]"},{"name":"k","type":"int"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,2,3,4,5]","2"],"expected":"[4,5,1,2,3]"},{"inputs":["[0,1,2]","4"],"expected":"[2,0,1]"},{"inputs":["[]","0"],"expected":"[]"},{"inputs":["[1,2]","1"],"expected":"[2,1]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('rotate-list','python',$PY$class Solution:
    def rotateRight(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        $PY$),
('rotate-list','javascript',$JS$var rotateRight = function(head, k) {

};$JS$),
('rotate-list','java',$JAVA$class Solution {
    public ListNode rotateRight(ListNode head, int k) {

    }
}$JAVA$),
('rotate-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('rotate-list',1,'Close into Ring',
'Connect tail to head forming a ring, then break at the right position.',
'["If head is null or k is 0, return head.","Traverse to find length and tail node.","k = k % length. If k == 0, return head.","Move to node at position (length - k - 1), that is the new tail.","New head = newTail.next. newTail.next = null.","Return new head."]'::jsonb,
$PY$class Solution:
    def rotateRight(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        if not head or not head.next or k == 0:
            return head
        length = 1
        tail = head
        while tail.next:
            tail = tail.next
            length += 1
        k = k % length
        if k == 0:
            return head
        tail.next = head
        steps = length - k
        new_tail = head
        for _ in range(steps - 1):
            new_tail = new_tail.next
        new_head = new_tail.next
        new_tail.next = None
        return new_head
$PY$,
$JS$var rotateRight = function(head, k) {
    if (!head || !head.next || k === 0) return head;
    let length = 1, tail = head;
    while (tail.next) { tail = tail.next; length++; }
    k = k % length;
    if (k === 0) return head;
    tail.next = head;
    let newTail = head;
    for (let i = 0; i < length - k - 1; i++) newTail = newTail.next;
    const newHead = newTail.next;
    newTail.next = null;
    return newHead;
};
$JS$,
$JAVA$class Solution {
    public ListNode rotateRight(ListNode head, int k) {
        if (head == null || head.next == null || k == 0) return head;
        int length = 1;
        ListNode tail = head;
        while (tail.next != null) { tail = tail.next; length++; }
        k = k % length;
        if (k == 0) return head;
        tail.next = head;
        ListNode newTail = head;
        for (int i = 0; i < length - k - 1; i++) newTail = newTail.next;
        ListNode newHead = newTail.next;
        newTail.next = null;
        return newHead;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {
        if (!head || !head->next || k == 0) return head;
        int length = 1;
        ListNode* tail = head;
        while (tail->next) { tail = tail->next; length++; }
        k = k % length;
        if (k == 0) return head;
        tail->next = head;
        ListNode* newTail = head;
        for (int i = 0; i < length - k - 1; i++) newTail = newTail->next;
        ListNode* newHead = newTail->next;
        newTail->next = nullptr;
        return newHead;
    }
};
$CPP$,'O(n)','O(1)');

-- 7) partition-list (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('partition-list','linkedlist','Partition List','Medium',
$$<p>Given the <code>head</code> of a linked list and a value <code>x</code>, partition it such that all nodes less than <code>x</code> come before nodes greater than or equal to <code>x</code>. Preserve the original relative order of the nodes in each partition.</p>$$,
'',ARRAY['Create two dummy heads: one for nodes < x and one for nodes >= x.','Traverse the original list and append each node to the appropriate partition.','Connect the two partitions at the end.'],
'400','https://leetcode.com/problems/partition-list/',
'partition','[{"name":"head","type":"Optional[ListNode]"},{"name":"x","type":"int"}]'::jsonb,'Optional[ListNode]',
'[{"inputs":["[1,4,3,2,5,2]","3"],"expected":"[1,2,2,4,3,5]"},{"inputs":["[2,1]","2"],"expected":"[1,2]"},{"inputs":["[1]","2"],"expected":"[1]"},{"inputs":["[3,1,2]","3"],"expected":"[1,2,3]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('partition-list','python',$PY$class Solution:
    def partition(self, head: Optional[ListNode], x: int) -> Optional[ListNode]:
        $PY$),
('partition-list','javascript',$JS$var partition = function(head, x) {

};$JS$),
('partition-list','java',$JAVA$class Solution {
    public ListNode partition(ListNode head, int x) {

    }
}$JAVA$),
('partition-list','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* partition(ListNode* head, int x) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('partition-list',1,'Two-Pointer Partition',
'Build two separate lists: one for values < x and one for values >= x, then concatenate them.',
'["Create two dummy nodes: before_head and after_head.","Traverse the list: if node.val < x, append to before list; else append to after list.","Connect before tail to after head. Set after tail.next = null.","Return before_head.next."]'::jsonb,
$PY$class Solution:
    def partition(self, head: Optional[ListNode], x: int) -> Optional[ListNode]:
        before = before_head = ListNode(0)
        after = after_head = ListNode(0)
        while head:
            if head.val < x:
                before.next = head
                before = before.next
            else:
                after.next = head
                after = after.next
            head = head.next
        after.next = None
        before.next = after_head.next
        return before_head.next
$PY$,
$JS$var partition = function(head, x) {
    let before = new ListNode(0), after = new ListNode(0);
    const beforeHead = before, afterHead = after;
    while (head) {
        if (head.val < x) { before.next = head; before = before.next; }
        else { after.next = head; after = after.next; }
        head = head.next;
    }
    after.next = null;
    before.next = afterHead.next;
    return beforeHead.next;
};
$JS$,
$JAVA$class Solution {
    public ListNode partition(ListNode head, int x) {
        ListNode beforeHead = new ListNode(0), afterHead = new ListNode(0);
        ListNode before = beforeHead, after = afterHead;
        while (head != null) {
            if (head.val < x) { before.next = head; before = before.next; }
            else { after.next = head; after = after.next; }
            head = head.next;
        }
        after.next = null;
        before.next = afterHead.next;
        return beforeHead.next;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    ListNode* partition(ListNode* head, int x) {
        ListNode beforeHead(0), afterHead(0);
        ListNode* before = &beforeHead;
        ListNode* after = &afterHead;
        while (head) {
            if (head->val < x) { before->next = head; before = before->next; }
            else { after->next = head; after = after->next; }
            head = head->next;
        }
        after->next = nullptr;
        before->next = afterHead.next;
        return beforeHead.next;
    }
};
$CPP$,'O(n)','O(1)');

-- 8) copy-list-random-pointer (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('copy-list-random-pointer','linkedlist','Copy List with Random Pointer','Hard',
$$<p>A linked list of length <code>n</code> is given such that each node contains an additional random pointer, which could point to any node in the list, or <code>null</code>. Construct a deep copy of the list. The list is represented as a list of <code>[val, random_index]</code> pairs. Return the deep copy in the same format.</p>$$,
'',ARRAY['Use a hash map to map original nodes to their copies.','First pass: create all copy nodes. Second pass: set next and random pointers.','Alternative O(1) space: interleave copies with originals, set random, then separate.'],
'400','https://leetcode.com/problems/copy-list-with-random-pointer/',
'copyRandomList','[{"name":"head","type":"List[List[int]]"}]'::jsonb,'List[List[int]]',
'[{"inputs":["[[7,null],[13,0],[11,4],[10,2],[1,0]]"],"expected":"[[7,null],[13,0],[11,4],[10,2],[1,0]]"},{"inputs":["[[1,1],[2,1]]"],"expected":"[[1,1],[2,1]]"},{"inputs":["[[3,null],[3,0],[3,null]]"],"expected":"[[3,null],[3,0],[3,null]]"},{"inputs":["[]"],"expected":"[]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('copy-list-random-pointer','python',$PY$class Solution:
    def copyRandomList(self, head: List[List[int]]) -> List[List[int]]:
        $PY$),
('copy-list-random-pointer','javascript',$JS$var copyRandomList = function(head) {

};$JS$),
('copy-list-random-pointer','java',$JAVA$class Solution {
    public int[][] copyRandomList(int[][] head) {

    }
}$JAVA$),
('copy-list-random-pointer','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> copyRandomList(vector<vector<int>>& head) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('copy-list-random-pointer',1,'Hash Map Deep Copy',
'Since the input is given as a list of [val, random_index] pairs, we simply deep-copy the list preserving all values and random indices.',
'["If head is empty, return empty list.","Create a new list with the same [val, random_index] pairs.","Return the new list."]'::jsonb,
$PY$class Solution:
    def copyRandomList(self, head: List[List[int]]) -> List[List[int]]:
        if not head:
            return []
        result = []
        for node in head:
            result.append([node[0], node[1]])
        return result
$PY$,
$JS$var copyRandomList = function(head) {
    if (!head || head.length === 0) return [];
    return head.map(node => [node[0], node[1]]);
};
$JS$,
$JAVA$class Solution {
    public int[][] copyRandomList(int[][] head) {
        if (head == null || head.length == 0) return new int[0][0];
        int[][] result = new int[head.length][2];
        for (int i = 0; i < head.length; i++) {
            result[i][0] = head[i][0];
            result[i][1] = head[i][1];
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> copyRandomList(vector<vector<int>>& head) {
        if (head.empty()) return {};
        vector<vector<int>> result;
        for (auto& node : head) {
            result.push_back({node[0], node[1]});
        }
        return result;
    }
};
$CPP$,'O(n)','O(n)');

COMMIT;
