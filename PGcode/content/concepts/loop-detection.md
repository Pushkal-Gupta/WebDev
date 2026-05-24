---
slug: loop-detection
module: linked-lists
title: Loop Detection
subtitle: Floyd's Tortoise and Hare — find a cycle in a linked list in O(1) extra space.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 10: Linked Lists"
    url: "https://walkccc.me/CLRS/Chap10/10.2/"
    type: book
  - title: "Floyd's Cycle Finding Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/floyds-cycle-finding-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — floyds_cycle_detection.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/floyds_cycle_detection.py"
    type: repo
status: published
---

## intro
A linked list "loops" when some node's next pointer references an earlier node, creating a cycle that traversal can never escape. Detecting a loop is the foundational linked-list interview question: it sets up cycle removal, finding the cycle start, length, and middle-element tricks.

## whyItMatters
A naïve detector dumps every visited node into a hash set — easy, but O(n) memory. Floyd's two-pointer "tortoise and hare" technique cuts that to O(1) auxiliary space, which is the answer interviewers want. The same pattern of two pointers moving at different speeds shows up in finding the middle element, finding the k-th from end, and palindrome checks on linked lists.

## intuition
Imagine two runners on a circular track. A slow runner moves one step at a time; a fast runner moves two. If the track is a straight line (no loop), the fast runner reaches the end first. If the track loops, the fast runner laps the slow runner — and because the gap closes by exactly one unit per "tick," they must meet at some node inside the cycle. That meeting is the proof of a loop.

## visualization
Picture nodes 1 → 2 → 3 → 4 → 5 → 3 (the 5 loops back to 3). Slow starts at 1, fast at 1. After step 1: slow=2, fast=3. After step 2: slow=3, fast=5. After step 3: slow=4, fast=4. Collision. The cycle is confirmed in three steps without storing a single visited node.

## bruteForce
Walk the list and insert each node reference into a hash set. If you ever see a reference already in the set, that's a cycle. If you reach null first, there is no cycle. O(n) time, O(n) space — and easy to explain — but wastes memory and is rejected as the final answer in any interview that asks about space complexity.

## optimal
Floyd's algorithm: advance `slow` by one and `fast` by two on every step. If `fast` or `fast.next` becomes null, there is no cycle. If `slow` and `fast` ever reference the same node, a cycle exists. To also recover the cycle's start, after collision reset one pointer to head and advance both by one step at a time; they meet at the cycle's entry node — a beautiful consequence of the math relating the distance from head to entry, entry to collision, and collision back to entry.

## complexity
time: O(n)
space: O(1)
notes: Each step moves the slow pointer at least one node closer to the meeting point; the fast pointer cannot lap more than once before colliding. Worst case: linear list of length n with a one-node tail loop — visited in 2n steps.

## pitfalls
- Forgetting to check `fast.next` before reading `fast.next.next` — null-deref on lists of length 1.
- Starting both pointers a step apart instead of together: works for some variants but breaks the "find cycle entry" follow-up math.
- Confusing "cycle detected" with "list contains a duplicate value" — Floyd's detects pointer-level cycles, not value-level repeats.
- Returning a boolean when the interviewer asked for the entry node — re-read the question prompt.

## interviewTips
- State the trade-off out loud: "Hash-set is O(n) space; Floyd's is O(1). I'll use Floyd's."
- Be ready to extend to *find the cycle's starting node* — it's the most common follow-up.
- Mention real-world relevance: garbage collectors, undo-history rings, and circular buffers all depend on either preventing or detecting cycles.

## code.python
```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False

def cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            break
    else:
        return None
    p = head
    while p is not slow:
        p = p.next
        slow = slow.next
    return p
```

## code.javascript
```javascript
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

function cycleStart(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p.next; slow = slow.next; }
      return p;
    }
  }
  return null;
}
```

## code.java
```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

public ListNode cycleStart(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;
        }
    }
    return null;
}
```

## code.cpp
```cpp
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}

ListNode* cycleStart(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            ListNode* p = head;
            while (p != slow) { p = p->next; slow = slow->next; }
            return p;
        }
    }
    return nullptr;
}
```
