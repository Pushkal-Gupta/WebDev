---
slug: tortoise-and-hare-multi
module: linked-lists
title: Tortoise and Hare — Find the Cycle Start
subtitle: Floyd's algorithm extended: locate the exact node where the cycle begins.
difficulty: Intermediate
position: 9
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 10 (linked lists, walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap10/"
    type: book
  - title: "GeeksforGeeks — Linked List"
    url: "https://www.geeksforgeeks.org/data-structures/linked-list/"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/linked_list/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/linked_list"
    type: repo
status: published
---

## intro
Detecting a cycle with the tortoise-and-hare is the warm-up. The real interview question is "now return the node where the cycle starts." The fix is a tiny extension: after the pointers collide, reset one to the head and walk both at the same speed — they meet at the entry. The math behind why this works is elegant and a favorite whiteboard derivation.

## whyItMatters
The "find cycle start" idea generalizes to **Floyd's cycle finding for any function `f`** — random number generator period detection, Pollard's rho factorization, hash chain analysis, and detecting infinite loops in iterator-style state machines. The same `O(1)`-space trick works whenever you can repeatedly apply `f` and ask "does this sequence eventually repeat, and where does the repeat start?"

## intuition
Let `L` be the distance from head to cycle entry, and let `C` be the cycle's length. When slow and fast collide inside the cycle, slow has walked `L + x` steps for some `x` (distance into the cycle), and fast has walked `2(L + x)`. Their difference is a multiple of `C`, so `L + x = k*C`, i.e. `L = k*C - x`. That means walking `L` more steps from the collision point lands you exactly at the entry — and walking `L` more steps from the head also lands you at the entry. So if you reset one pointer to the head and move both one step at a time, they collide *at the entry*.

## visualization
```
1 -> 2 -> 3 -> 4 -> 5
          ^         |
          +---------+

L = 2 (head to node 3, the entry)
C = 3 (cycle 3 -> 4 -> 5 -> 3)

Phase 1 (detect): slow, fast both start at 1
  step 1: slow=2, fast=3
  step 2: slow=3, fast=5
  step 3: slow=4, fast=4   <-- collision at node 4

Phase 2 (find entry): reset p=1, walk p and slow one step
  p=1, slow=4
  p=2, slow=5
  p=3, slow=3   <-- collision at node 3 = cycle entry. Return 3.
```

## bruteForce
Walk the list pushing each node into a hash set. The first node already in the set is the cycle entry. O(n) time, O(n) space. Trivial to explain — but the interviewer asked for `O(1)` extra memory, which is exactly why Floyd's exists. Hash-set wastes memory on every solved instance.

## optimal
Two-phase Floyd's:
```
phase1:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: break
    else:
        return null   # no cycle

phase2:
    p = head
    while p != slow:
        p = p.next
        slow = slow.next
    return p          # cycle entry
```
Both phases use two pointers and constant extra memory. The for-else / while-else idiom (Python style) helps express "no cycle" cleanly; in other languages a boolean flag does the same job.

If the problem also asks for cycle **length**, after phase 1 fix `slow` and walk `fast` one step at a time, counting until `fast == slow` again — that count is `C`.

## complexity
- **Time**: `O(n)` total. Phase 1 is at most `2n` steps (slow reaches the collision in `L + x <= L + C - 1 <= n` moves). Phase 2 walks `L <= n` more.
- **Space**: `O(1)` — two pointers in phase 1, two in phase 2, no auxiliary structures.
- **Comparison vs hash set**: same time, dramatically less memory; matters when the list is huge or when the question prompt forbids extra space.

## pitfalls
- **Returning `slow` after phase 1** thinking it's the entry — it's the collision point inside the cycle, not the entry. You must run phase 2.
- **Advancing `p` and `slow` two steps in phase 2** — they must move at the *same* speed (one step each), or the math breaks.
- **Not handling the null case**: if `fast` or `fast.next` becomes null in phase 1, return null immediately; don't fall through to phase 2.
- **Edge case: cycle starts at head** (`L = 0`). Phase 2's loop body never runs because `p == slow` immediately; the return value is correctly `head`. Test this case.
- **Edge case: single-node self-loop**. `slow` and `fast` collide at the only node in one iteration; phase 2 returns it. Walk through it mentally.
- **Modifying the list** to mark visited nodes (e.g. setting `node.next = node`) — destructive, and forbidden in most interview prompts.

## interviewTips
- Derive the `L = k*C - x` equation on the whiteboard — it's a 30-second proof and it's what separates "memorized" from "understood."
- Mention **Brent's algorithm** as a faster cycle-detection variant (same `O(1)` space, fewer iterations on average) — bonus points for senior interviews.
- Note that the same trick applies to any iterated function `f` — Pollard's rho factorization uses Floyd's on `f(x) = x^2 + c mod n`.
- If asked for both the entry and the length, do phase 1, run a "count" loop inside the cycle for length, then phase 2 for the entry — same constants.

## code.python
```python
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


def cycle_length(head):
    start = cycle_start(head)
    if start is None:
        return 0
    n, cur = 1, start.next
    while cur is not start:
        cur = cur.next
        n += 1
    return n
```

## code.javascript
```javascript
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

function cycleLength(head) {
  const start = cycleStart(head);
  if (!start) return 0;
  let n = 1, cur = start.next;
  while (cur !== start) { cur = cur.next; n++; }
  return n;
}
```

## code.java
```java
public class CycleStart {
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

    public int cycleLength(ListNode head) {
        ListNode start = cycleStart(head);
        if (start == null) return 0;
        int n = 1;
        ListNode cur = start.next;
        while (cur != start) { cur = cur.next; n++; }
        return n;
    }
}
```

## code.cpp
```cpp
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

int cycleLength(ListNode* head) {
    ListNode* start = cycleStart(head);
    if (!start) return 0;
    int n = 1;
    ListNode* cur = start->next;
    while (cur != start) { cur = cur->next; ++n; }
    return n;
}
```
