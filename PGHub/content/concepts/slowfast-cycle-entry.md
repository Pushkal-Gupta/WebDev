---
slug: slowfast-cycle-entry
module: linked-lists
title: Cycle Entry Point via Floyd's Algorithm
subtitle: Detect the loop, then find the exact node where the cycle begins — using only two pointers and a closed-form math trick.
difficulty: Intermediate
position: 13
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Floyd's Cycle Finding Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/floyds-cycle-finding-algorithm/"
    type: blog
  - title: "CLRS Solutions — Chapter 10: Linked Lists"
    url: "https://walkccc.me/CLRS/Chap10/10.2/"
    type: book
  - title: "TheAlgorithms/Python — floyds_cycle_detection.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/floyds_cycle_detection.py"
    type: repo
status: published
---

## intro
Once you know a linked list contains a cycle, the next question is invariably: where does the cycle start? Floyd's algorithm answers it with no extra memory and one elegant claim: after slow and fast meet inside the loop, resetting either pointer to the head and walking both one step at a time lands them exactly at the cycle's entry node.

## whyItMatters
This is the textbook example of how a small piece of number theory collapses an apparently complex problem into a six-line loop. Real systems care about it too: detecting where a memory-allocator free list got corrupted, finding the start of a circular schedule, or pinpointing where a graph-walk first revisits itself. The pattern reappears in duplicate-number search (LeetCode 287) where the array is reinterpreted as a linked list.

## intuition
Picture the list as a lollipop: a straight stick of length L feeding into a candy loop of circumference C. Two runners start at the head; the fast runner moves twice as quickly as the slow one. Because fast gains exactly one node of ground on slow every step, once both are circling the loop the gap between them shrinks by one each tick until it hits zero — so they are guaranteed to meet, and they meet somewhere inside the loop, never on the stick.

Let L be the distance from head to cycle entry, C be the cycle length, and let the slow/fast meeting point sit at distance m past the entry. When they meet, slow has walked L + m steps; fast has walked 2(L + m). The difference, L + m, is some whole number of full cycle laps: L + m = kC. So L = kC − m. Now start a fresh pointer at head and keep slow at the meeting point. After L steps the fresh pointer reaches the entry; slow has walked L = kC − m more steps inside the cycle, ending exactly k laps before the entry — i.e., at the entry. They collide there.

Put real numbers on it. Take the list 1 → 2 → 3 → 4 → 5 → 6 → back to 3, so L = 2 (head to node 3) and C = 4 (the loop 3-4-5-6). Trace phase one: slow visits 1,2,3,4,5,... while fast visits 1,3,5,3,5,... — they first coincide at node 5, so m = 2 (node 5 sits two nodes past the entry 3). Check the identity: L + m = 4 = 1·C, so k = 1 and L = kC − m = 4 − 2 = 2, matching the stick length exactly. What's actually happening is that the leftover distance to close the loop from the meeting point (C − m = 2) equals the untraveled stick length L — that symmetry is why walking one pointer from the head and one from the meeting point, both at unit speed, lands them together precisely at the entry.

## visualization
List 1 → 2 → 3 → 4 → 5 → 6 → 3 (6 loops back to 3). Phase one: slow and fast collide at node 5. Phase two: reset p to head (node 1); advance p and slow one step each. After 2 steps p is at 3 and slow is at 3. The cycle entry is node 3 — confirmed by the meeting.

```
PHASE 1  (slow +1, fast +2  until slow == fast)
 step | slow | fast | met?
 -----+------+------+------
   0  |   1  |   1  |  no    (both start at head)
   1  |   2  |   3  |  no
   2  |   3  |   5  |  no
   3  |   4  |   3  |  no    (fast wrapped: 5->6->3)
   4  |   5  |   5  | YES    meeting node = 5,  m = 2

PHASE 2  (p from head, slow held at 5, each +1  until p == slow)
 step |  p   | slow | met?
 -----+------+------+------
   0  |   1  |   5  |  no
   1  |   2  |   6  |  no
   2  |   3  |   3  | YES    cycle entry = node 3  (== L = 2 steps)
```

## bruteForce
Hash-set traversal: walk from head, insert each node reference into a set, and return the first node already present. O(n) time, O(n) space. Trivially correct and easy to explain, but it ignores the whole reason this problem is famous — the math trick that drops space to O(1).

## optimal
Two passes of Floyd:
- Pass 1: slow steps by 1, fast by 2. Stop when they meet (cycle exists) or fast hits null (no cycle, return null).
- Pass 2: reset one pointer to head, keep the other at the meeting point, advance both by 1. The node where they meet is the cycle's entry.

Both passes are O(n); the second is in fact O(L), which is at most n.

Why pass 1 is guaranteed correct: on every step fast closes the gap to slow by exactly one node (relative speed 2 − 1 = 1). Once both are inside the loop, that gap is at most C − 1 and strictly decreasing, so within fewer than C steps it reaches zero and the pointers collide. The invariant is that fast never "jumps over" slow without landing on it, because the gap only ever changes by one — a difference of one can never skip past zero. If instead fast reaches null, no loop exists and the closing-gap argument never engages.

Pass 2 rests on the identity L = kC − m derived in the intuition. The invariant it maintains is that after t unit steps, the fresh pointer sits t nodes from the head while the held pointer sits m + t nodes past the entry (modulo C). Set t = L: the fresh pointer is exactly at the entry, and the held pointer is at m + L = m + kC − m = kC nodes past the entry, which is k full laps — the entry again. So the first moment the two pointers are equal is precisely the entry node, and returning it is correct. Step by step: (1) run slow/fast until collision, capturing the meeting node; (2) park one pointer there, move the other to head; (3) advance both one node per step; (4) return the node where they first coincide.

Complexity intuition: pass 1 costs at most L + C steps for slow (it enters the loop after L, then needs under C more to be caught), and fast does twice that — still linear. Pass 2 costs exactly L steps. No structure beyond a handful of pointer variables is allocated, giving O(1) auxiliary space with linear time.

## complexity
time: O(n)
space: O(1)
notes: Pass 1 takes at most 2n steps; pass 2 takes at most n. Total work is linear with a small constant. No allocation other than two pointer variables.

## pitfalls
- Returning the meeting node instead of the entry — they are usually different.
- Skipping the null-check on fast.next.next, which crashes on length-1 lists.
- Misremembering the math and resetting the wrong pointer — the rule is "reset one, hold the other at the meeting point, walk both by 1."
- Treating "no cycle" and "cycle of length 1 at the tail" the same way — the latter still satisfies slow == fast.

## interviewTips
- Derive the L = kC − m identity on paper if asked why it works — interviewers love this.
- Mention LeetCode 287 (Find the Duplicate Number) as a non-obvious reuse of this same algorithm.
- Compare with hash-set up front and pick Floyd's explicitly for the O(1) space.
- Ask whether the function should return the entry node or its value — the API matters.

## code.python
```python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            p = head
            while p is not slow:
                p = p.next
                slow = slow.next
            return p
    return None
```

## code.javascript
```javascript
function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = p.next;
        slow = slow.next;
      }
      return p;
    }
  }
  return null;
}
```

## code.java
```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) {
                p = p.next;
                slow = slow.next;
            }
            return p;
        }
    }
    return null;
}
```

## code.cpp
```cpp
ListNode* detectCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            ListNode* p = head;
            while (p != slow) {
                p = p->next;
                slow = slow->next;
            }
            return p;
        }
    }
    return nullptr;
}
```
