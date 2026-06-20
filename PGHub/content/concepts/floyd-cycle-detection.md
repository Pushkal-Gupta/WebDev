---
slug: floyd-cycle-detection
module: linked-lists
title: Floyd's Cycle Detection (Tortoise and Hare)
subtitle: Detect a cycle in a linked list — and find its entry — in O(n) time and O(1) space using two pointers at different speeds.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Lists and Cycles"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "cp-algorithms — Floyd's algorithm"
    url: "https://cp-algorithms.com/others/tortoise_and_hare.html"
    type: blog
  - title: "TheAlgorithms/Python — Floyd cycle"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/linked_list"
    type: repo
status: published
---

## intro
Floyd's algorithm — colloquially "tortoise and hare" — detects whether a linked list contains a cycle, and if so finds the node where the cycle begins, using two pointers that advance at different speeds. The slow pointer moves one step per iteration; the fast pointer moves two. If the list is acyclic, fast hits `None` and the answer is "no cycle". If the list has a cycle, fast eventually laps slow inside the loop and they meet. A short, beautiful number-theoretic argument then locates the loop entry without any extra memory.

## whyItMatters
- Cycle detection is the canonical `O(1)`-space algorithm — used as the textbook example of pointer tricks that beat the obvious hash-set solution.
- It generalises to any function `f: X -> X` whose orbit is being followed (Pollard's rho for factoring, random-number-generator cycle detection, file-system loop checks).
- It is the basis for the "find the duplicate in an array of `n + 1` integers in `[1, n]`" trick — treat the array as a function `i -> a[i]`.
- Identifying the cycle entry is needed for resource-leak detection (where the list "loops" by accident) and for parsing data structures with intentional cycles.

## intuition
Imagine two runners on a circular track. The fast runner laps the slow one for every full lap of relative speed. If the track is a single cycle, they will eventually be at the same spot — the moment fast catches up. If the track is a straight line, fast falls off the end and never meets slow. That's phase one: detect the cycle.

For the entry-point trick, set up the geometry. Let `L` be the distance from head to the cycle entry, `C` the cycle length, and let the meeting point be `k` nodes into the cycle (`0 <= k < C`). Slow has walked `L + k` steps; fast has walked `2(L + k)`. Fast has also gone some integer number of laps further: `2(L + k) = L + k + nC`, so `L + k = nC`, or equivalently `L = nC - k = (n-1)C + (C - k)`.

That last form is the magic: starting from the head and starting from the meeting point, if you walk both at speed 1, the head walker travels `L` steps to reach the entry, and the meeting-point walker travels `(n-1)C + (C - k) = L` steps to reach the entry too (the `(n-1)C` is just a few full laps, which return to the same spot). They meet **at the entry**. Restart one pointer at the head, keep the other at the meeting point, advance both one step at a time, and the node where they meet is the cycle entry. No hash set, no extra memory.

## visualization
List with cycle:

```
   1 -> 2 -> 3 -> 4 -> 5 -> 6
                  ^         |
                  |_________|

phase 1 (detect):
   step 1: slow=2, fast=3
   step 2: slow=3, fast=5
   step 3: slow=4, fast=4   <- meeting point

phase 2 (find entry):
   p1 = head (1), p2 = meeting (4)
   step 1: p1=2, p2=5
   step 2: p1=3, p2=6
   step 3: p1=4, p2=4       <- cycle entry
```

Algebra: `L = 3` (head -> entry 4), `C = 3` (4 -> 5 -> 6 -> 4), meeting `k = 0`. Then `L + k = 3 = 1 * C`, consistent.

## bruteForce
Walk the list and record every visited node in a hash set; the first node already in the set is the cycle entry, or you walk off the end (no cycle). That works in `O(n)` time and `O(n)` space. Floyd's trick keeps the time and drops the space to `O(1)`.

## optimal
Two phases.

```python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            break
    else:
        return None  # fast hit the end -> no cycle

    p = head
    while p is not slow:
        p = p.next
        slow = slow.next
    return p
```

The `for/while ... else` pattern in Python triggers when the loop exits **without** `break`. In other languages emulate it with a flag. Both phases are linear; total work `O(n)` and space `O(1)`. A subtle variant — **Brent's algorithm** — detects cycles slightly faster in practice by doubling the spacing between checks; same asymptotic, smaller constant.

## complexity
- **Time**: `O(n)`. Slow walks at most one full extra lap inside the cycle before fast catches it.
- **Space**: `O(1)` — two pointers, no auxiliary data structure.
- **Works on any iterator-style structure** with a `next` function: linked lists, simulated arrays (`i -> a[i]`), iterators over deterministic generators.

## pitfalls
- **Initialising `slow` and `fast` to different starting nodes.** Both must start at `head`, otherwise the algebra `L = nC - k` no longer holds. Fix: `slow = fast = head`.
- **Advancing fast without checking `fast.next` first.** A null dereference crashes on lists of length 1 or 2. Fix: loop condition `while fast and fast.next`.
- **Returning `slow` directly after phase 1.** That is the meeting point, not the cycle entry. Fix: run phase 2 — walk one pointer from `head`, one from `slow`, both at speed 1, until they meet.
- **Forgetting to handle "no cycle".** If `fast` reaches `None` you must return early. Fix: use `for-else` in Python or a boolean `found` flag elsewhere.

## interviewTips
- State both halves up front: phase 1 detects, phase 2 locates. Don't conflate them.
- Sketch the `L + k = nC` algebra on the whiteboard — interviewers want to see you derive it, not memorise it.
- Mention the array-duplicate generalisation; it's the most common follow-up.

## code.python
```python
class Node:
    def __init__(self, v): self.v, self.next = v, None

def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast: break
    else:
        return None
    p = head
    while p is not slow:
        p, slow = p.next, slow.next
    return p
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
      while (p !== slow) { p = p.next; slow = slow.next; }
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
            while (p != slow) { p = p.next; slow = slow.next; }
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
            while (p != slow) { p = p->next; slow = slow->next; }
            return p;
        }
    }
    return nullptr;
}
```
