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
- **LeetCode 141 (Linked List Cycle)** and **142 (Linked List Cycle II)** are the textbook problems; the same Floyd skeleton solves **LeetCode 287 (Find Duplicate)**, **202 (Happy Number)**, **234 (Palindrome Linked List)**.
- **Floyd's 1967 paper** introduced tortoise-and-hare; **Knuth's TAOCP Vol. 2** discusses it as the canonical cycle detector. **Brent's algorithm (1980)** is a 1.5x faster variant used in **Pollard's rho integer factorization** (which broke RSA-129 in 1994).
- **Garbage collectors** (Mark-and-Sweep, Generational) and **reference-counting cycle collectors** (CPython's `gc` module, Swift ARC) use cycle detection variants to free reference cycles that would otherwise leak.
- **Database join optimizers**, **circular dependency detectors** in build systems (npm, Cargo, Bazel), and **graph-based config validators** (Terraform, Kubernetes admission controllers) detect cycles via DFS coloring — algorithmically related to Floyd's idea.

## intuition
A linked list "loops" when some node's next pointer references an earlier node, creating a cycle that traversal can never escape. Detecting a loop is the foundational linked-list interview question; it sets up cycle removal, finding the cycle start, length, and middle-element tricks. The naive detector dumps every visited node into a hash set — easy, O(n) time, but O(n) memory. The textbook O(1)-space answer is Floyd's tortoise-and-hare.

The mental model: two runners on a circular track. A **slow** runner moves one step at a time; a **fast** runner moves two steps at a time. If the track is straight (no loop), the fast runner reaches the end and we conclude "no cycle." If the track loops, the fast runner eventually enters the cycle, and because both runners are now on the same circle with the fast moving at 2x the slow's speed, the fast laps the slow once per cycle traversal. The crucial observation: **the distance between them shrinks by exactly 1 unit per tick** (fast gains one position on slow each tick), so after at most `lambda` ticks (the cycle length) inside the cycle, they collide. The collision is the proof of a loop.

The same two pointers handle the **find cycle start** follow-up via a beautiful distance argument. Let `mu` be the distance from head to the cycle entry, `lambda` be the cycle's length. When slow and fast first meet, slow has moved some distance d, fast has moved 2d, and fast has lapped slow some integer number of times k, so `2d - d = k * lambda`, meaning `d = k * lambda`. Slow is at distance `d - mu` past the entry inside the cycle. Now reset one pointer to the head and advance both by **one step at a time**: after `mu` more steps, the reset pointer is at the entry, and the other pointer is at `(d - mu + mu) mod lambda == 0` past the entry — they meet at the cycle's entry.

The same shape of "two pointers moving at different speeds" generalizes to: **find the middle of a linked list** (slow=1x, fast=2x; when fast reaches end, slow is at middle), **find k-th node from end** (fast moves k steps first, then both move together until fast hits end), **palindrome check on a linked list** (find middle, reverse second half, compare). Once you internalize the pattern, half a dozen interview problems collapse into the same template.

## visualization
Picture nodes 1 → 2 → 3 → 4 → 5 → 3 (the 5 loops back to 3). Slow starts at 1, fast at 1. After step 1: slow=2, fast=3. After step 2: slow=3, fast=5. After step 3: slow=4, fast=4. Collision. The cycle is confirmed in three steps without storing a single visited node.

## bruteForce
Walk the list and insert each node reference into a hash set. If you ever see a reference already in the set, that's a cycle. If you reach null first, there is no cycle. O(n) time, O(n) space — and easy to explain — but wastes memory and is rejected as the final answer in any interview that asks about space complexity.

## optimal
**Floyd's tortoise-and-hare**, O(n) time and O(1) space — provably optimal on both axes (you must read every node to confirm no cycle, and you can detect a cycle with two integer pointers and no auxiliary structures).

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next

def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True                 # collision inside the cycle
    return False                        # fast hit end -> no cycle

def cycle_start(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    # Phase 1: detect a collision (or terminate if no cycle).
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            # Phase 2: find the entry via the mu = (d - mu) mod lambda argument.
            p = head
            while p is not slow:
                p = p.next
                slow = slow.next
            return p                    # cycle entry
    return None
```

Why this is right: the two-pointer race converges in at most `mu + lambda` ticks of the slow pointer (where mu = distance to cycle entry, lambda = cycle length), so phase 1 is O(n). Phase 2 runs at most another `mu` steps, also O(n). Both pointers are integers (4-8 bytes each), giving O(1) auxiliary space — the goal that ruled out the hash-set approach.

**Why the alternatives lose**:
- **Hash set of visited nodes**: O(n) time, O(n) space — easy to explain but rejected when interviewers specify O(1) space.
- **Mark-by-mutation** (set a "visited" flag on each node): O(n) time, O(1) extra space, but mutates input — forbidden by most prompts and impossible for read-only linked lists.
- **Reverse and compare** (reverse in place, check if you can get back): destroys the list, may not even detect general cycles.

**Edge cases and pitfalls**:
- **Check `fast.next` before reading `fast.next.next`**: null-deref on lists of length 1 or 2. The `while fast and fast.next` guard handles this.
- **Initial state**: both pointers start at head; advance both before comparing. Starting `fast = head.next` is a common variant but breaks the symmetry the cycle-entry math relies on.
- **No cycle**: the loop exits via `fast` hitting null; `has_cycle` returns False.
- **Cycle is the entire list** (last node points back to head): the entry is `head` itself; the algorithm correctly returns it after zero advance steps in phase 2.
- **Single node with self-loop** (head.next = head): slow=head, fast=head, then slow=head, fast=head — collision on first iteration; entry is head.

**Adjacent algorithms with the same skeleton**:
- **Brent's algorithm (1980)**: ~36% faster constant factor by advancing the fast pointer in powers of two and periodically resetting the slow pointer. Used in production Pollard's rho factorization.
- **Pollard's rho integer factorization**: applies Floyd to the functional iteration `f(x) = (x^2 + c) mod n` to find non-trivial divisors of large composites; broke RSA-129.
- **LeetCode 287 (Find Duplicate)**: treats `f(i) = nums[i]` as a linked list; cycle entry == duplicate value.
- **LeetCode 202 (Happy Number)**: cycle detection on `f(n) = sum_of_digit_squares(n)`; reaches 1 iff happy.

The interview answer in one line: "Floyd's tortoise-and-hare — two pointers at 1x and 2x speed — detect any cycle in O(n) time and O(1) space; reset-and-step-together finds the cycle's entry."

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
