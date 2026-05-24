---
slug: linkedlist-reverse-groups
module: linked-lists
title: Reverse Linked List in Groups of K
subtitle: Flip every k consecutive nodes in place using iterative pointer surgery — the gold-standard linked-list interview problem.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Reverse a Linked List in groups of given size — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/reverse-a-list-in-groups-of-given-size/"
    type: blog
  - title: "Algorithms, 4th Edition — Linked Lists"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "TheAlgorithms/Python — singly_linked_list.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/singly_linked_list.py"
    type: repo
status: published
---

## intro
Given the head of a singly linked list and a positive integer k, reverse the first k nodes, then the next k, and so on. Any final group of fewer than k nodes is left untouched (in the strict variant) or reversed too (in the loose variant). This problem stress-tests pointer hygiene more than any other linked-list question.

## whyItMatters
Group reversal is the canonical follow-up to plain reverse-linked-list. It shows up in real systems: LRU eviction batches, paged buffer flushes, and undo-history compaction all reverse fixed-size chunks of a doubly linked list. Interviewers use it to filter candidates who can hold three or four pointers in their head without losing the tail.

## intuition
Treat the list as a chain of length-k blocks. For each block, do the standard three-pointer reverse (prev, curr, next), but remember two extra anchors: the tail of the previously reversed block (so you can splice its next to the new block's new head) and the head of the current block (which becomes that block's new tail). After reversing block i, its old head is the new tail; wire that tail's next to whatever the next block reverses into.

## visualization
List 1 → 2 → 3 → 4 → 5 → 6 → 7, k=3. Block one: reverse [1,2,3] to get 3 → 2 → 1, remember 1 as the splice tail. Block two: reverse [4,5,6] to get 6 → 5 → 4; wire 1.next = 6. Remember 4 as the next splice tail. Block three: only [7] remains. Strict variant: leave 7 alone, wire 4.next = 7. Final: 3 → 2 → 1 → 6 → 5 → 4 → 7.

## bruteForce
Copy node values into an array, reverse each k-sized slice in place, then rebuild a linked list (or write back into the existing nodes). O(n) time, O(n) extra space, and it discards the entire point of practicing pointer manipulation. Acceptable as a warm-up; rejected as the final answer.

## optimal
Iterative in-place reversal with a dummy node anchoring the head. Walk the list, counting k nodes ahead to confirm a full block exists. If yes, reverse those k nodes using the standard prev/curr/next dance, then splice: the previous block's tail's next becomes the new head of this block, and the old head of this block becomes the next splice tail. Repeat until fewer than k nodes remain. O(n) time, O(1) extra space.

## complexity
time: O(n)
space: O(1)
notes: Each node is visited twice — once to count the block, once to reverse — so the constant factor is 2 but the asymptote is linear. A recursive solution costs O(n/k) stack space, which interviewers count against you on long lists.

## pitfalls
- Forgetting the dummy node and special-casing the first block — leads to ugly head reassignment.
- Reversing a partial trailing block when the prompt said "leave incomplete tails alone." Re-read the question.
- Losing the next-block pointer before reversal — save it first, always.
- Off-by-one in the k-counter — count from 1 to k inclusive, not 0 to k.

## interviewTips
- Draw the four pointers on paper before coding: dummy, groupPrev, groupStart, nextGroup.
- State the variant up front: "Reverse strict groups of k and leave the remainder, correct?"
- Mention the recursive alternative and explicitly reject it for the O(n/k) stack cost.
- The reverse-pairs (k=2) variant uses identical scaffolding — call that out as evidence of pattern recognition.

## code.python
```python
def reverse_k_group(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if kth is None:
                return dummy.next
        group_next = kth.next
        prev, curr = group_next, group_prev.next
        while curr is not group_next:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        tmp = group_prev.next
        group_prev.next = kth
        group_prev = tmp
```

## code.javascript
```javascript
function reverseKGroup(head, k) {
  const dummy = { next: head };
  let groupPrev = dummy;
  while (true) {
    let kth = groupPrev;
    for (let i = 0; i < k; i++) {
      kth = kth.next;
      if (!kth) return dummy.next;
    }
    const groupNext = kth.next;
    let prev = groupNext, curr = groupPrev.next;
    while (curr !== groupNext) {
      const nxt = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nxt;
    }
    const tmp = groupPrev.next;
    groupPrev.next = kth;
    groupPrev = tmp;
  }
}
```

## code.java
```java
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head);
    ListNode groupPrev = dummy;
    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i < k; i++) {
            kth = kth.next;
            if (kth == null) return dummy.next;
        }
        ListNode groupNext = kth.next;
        ListNode prev = groupNext, curr = groupPrev.next;
        while (curr != groupNext) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        ListNode tmp = groupPrev.next;
        groupPrev.next = kth;
        groupPrev = tmp;
    }
}
```

## code.cpp
```cpp
ListNode* reverseKGroup(ListNode* head, int k) {
    ListNode dummy(0, head);
    ListNode* groupPrev = &dummy;
    while (true) {
        ListNode* kth = groupPrev;
        for (int i = 0; i < k; i++) {
            kth = kth->next;
            if (!kth) return dummy.next;
        }
        ListNode* groupNext = kth->next;
        ListNode *prev = groupNext, *curr = groupPrev->next;
        while (curr != groupNext) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        ListNode* tmp = groupPrev->next;
        groupPrev->next = kth;
        groupPrev = tmp;
    }
}
```
