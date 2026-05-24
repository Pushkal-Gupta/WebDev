---
slug: linkedlist-palindrome
module: linked-lists
title: Linked List Palindrome
subtitle: Reverse the second half and compare to the first half in O(n) time and O(1) extra space.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 10: Linked Lists"
    url: "https://walkccc.me/CLRS/Chap10/10.2/"
    type: book
  - title: "Function to check if a singly linked list is palindrome — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/function-to-check-if-a-singly-linked-list-is-palindrome/"
    type: blog
  - title: "TheAlgorithms/Python — singly_linked_list.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/singly_linked_list.py"
    type: repo
status: published
---

## intro
A singly linked list is a palindrome when the sequence of values reads the same forward and backward. Unlike an array, we cannot index from the back, so the elegant solution combines two classic linked-list patterns: slow/fast pointers to find the middle, and in-place reversal of the trailing half.

## whyItMatters
The obvious approach copies values into an array and runs a two-pointer check — O(n) time but O(n) extra space. The optimal solution gets the same O(n) time at O(1) auxiliary memory by mutating the list briefly, then optionally restoring it. Mastering it forces you to compose three primitives — middle finding, reversal, and pointer comparison — in a single coherent pass.

## intuition
If we had a doubly linked list we could simply walk inward from both ends. A singly linked list only points forward, so we flip the second half's arrows to point backward toward the middle. Now both halves "start" at their respective ends and march toward each other. As long as the values match step by step, the original list was a palindrome.

## visualization
List: 1 → 2 → 3 → 2 → 1. Slow/fast pointers stop with slow at node 3. Reverse the tail starting at slow.next (or at slow for odd length variants), turning 2 → 1 into 1 → 2. Now walk head=1 and reversed_head=1 forward together: 1==1, 2==2 — palindrome confirmed in five total node touches.

## bruteForce
Traverse the list once and push every value into a Python list / Java ArrayList / std::vector. Then run a two-pointer check on the array: while left < right, compare arr[left] and arr[right]. Returns the right answer in O(n) time but uses O(n) extra space — wasteful when the list itself already stores those values in order.

## optimal
Three steps in one pass: (1) Find the middle with slow/fast pointers — slow lands on the middle (or just before, for even length). (2) Reverse the linked list starting from slow.next, producing a reversed second half whose head we hold. (3) Walk one pointer from the original head and another from the reversed-second-half head; compare values until the second pointer is null. Optionally reverse the second half again to leave the original list untouched.

## complexity
time: O(n)
space: O(1)
notes: Three linear traversals — find middle (n/2), reverse (n/2), compare (n/2) — sum to 1.5n which is O(n). Only a constant number of pointers are allocated regardless of list length.

## pitfalls
- Off-by-one when the list has odd length: the middle node belongs to neither half, so reverse from slow.next, not from slow.
- Failing to handle n ≤ 1 — a single node or empty list is trivially a palindrome; bail out early.
- Mutating the list and forgetting to restore it when the caller expects the list intact.
- Comparing node references instead of node values — the halves are different physical nodes even when values match.

## interviewTips
- Walk through the three phases explicitly — interviewers care that you can compose primitives, not invent new ones.
- Ask "should the list be unchanged after the check?" — a yes adds the restore step; a no is half the code.
- If asked the trade-off, name the space-vs-mutation tension out loud: array copy is non-destructive but O(n) space; in-place reversal is destructive but O(1).

## code.python
```python
def is_palindrome(head):
    if not head or not head.next:
        return True
    slow = fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next
    second = reverse(slow.next)
    p1, p2 = head, second
    ok = True
    while p2:
        if p1.val != p2.val:
            ok = False
            break
        p1 = p1.next
        p2 = p2.next
    slow.next = reverse(second)
    return ok

def reverse(node):
    prev = None
    while node:
        nxt = node.next
        node.next = prev
        prev = node
        node = nxt
    return prev
```

## code.javascript
```javascript
function isPalindrome(head) {
  if (!head || !head.next) return true;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = reverse(slow.next);
  let p1 = head, p2 = second, ok = true;
  while (p2) {
    if (p1.val !== p2.val) { ok = false; break; }
    p1 = p1.next;
    p2 = p2.next;
  }
  slow.next = reverse(second);
  return ok;
}

function reverse(node) {
  let prev = null;
  while (node) {
    const nxt = node.next;
    node.next = prev;
    prev = node;
    node = nxt;
  }
  return prev;
}
```

## code.java
```java
public boolean isPalindrome(ListNode head) {
    if (head == null || head.next == null) return true;
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode second = reverse(slow.next);
    ListNode p1 = head, p2 = second;
    boolean ok = true;
    while (p2 != null) {
        if (p1.val != p2.val) { ok = false; break; }
        p1 = p1.next;
        p2 = p2.next;
    }
    slow.next = reverse(second);
    return ok;
}

private ListNode reverse(ListNode node) {
    ListNode prev = null;
    while (node != null) {
        ListNode nxt = node.next;
        node.next = prev;
        prev = node;
        node = nxt;
    }
    return prev;
}
```

## code.cpp
```cpp
ListNode* reverse(ListNode* node) {
    ListNode* prev = nullptr;
    while (node) {
        ListNode* nxt = node->next;
        node->next = prev;
        prev = node;
        node = nxt;
    }
    return prev;
}

bool isPalindrome(ListNode* head) {
    if (!head || !head->next) return true;
    ListNode *slow = head, *fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode* second = reverse(slow->next);
    ListNode *p1 = head, *p2 = second;
    bool ok = true;
    while (p2) {
        if (p1->val != p2->val) { ok = false; break; }
        p1 = p1->next;
        p2 = p2->next;
    }
    slow->next = reverse(second);
    return ok;
}
```
