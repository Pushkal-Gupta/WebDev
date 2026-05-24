---
slug: linked-list-clone-random
module: linked-lists
title: Clone a Linked List with Random Pointers
subtitle: Deep-copy a list whose nodes carry both next and random pointers, using interleaving or a hashmap.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Clone a Linked List with Next and Random Pointer — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/a-linked-list-with-next-and-arbit-pointer/"
    type: blog
  - title: "CLRS Solutions — Chapter 10: Linked Lists"
    url: "https://walkccc.me/CLRS/Chap10/10.2/"
    type: book
  - title: "TheAlgorithms/Python — singly_linked_list.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/singly_linked_list.py"
    type: repo
status: published
---

## intro
A linked list with a `random` pointer per node — pointing to any node in the list or null — must be deep-cloned so the new list is structurally identical with brand-new node objects. The challenge: when you copy node A and need to set `A_copy.random = X_copy`, the copy of X may not exist yet.

## whyItMatters
This is the canonical question that separates candidates who lean on a hashmap from those who can engineer a constant-space solution. The interleaving trick — weaving copy nodes between originals so you can reach `original.next` to find `original.copy` — shows up in advanced list manipulation, in-place reversal sequences, and any time you need O(1) lookup without auxiliary memory.

## intuition
Two views of the same problem. **Hashmap:** first pass clones each node and stores `original -> copy`; second pass wires up `copy.next` and `copy.random` by looking up the originals' targets. **Interleaving:** first pass inserts each copy directly after its original, so `original.next` *is* `original.copy`. Now `original.random.next` is exactly the copy that `original.copy.random` should point at — constant extra space, three linear passes.

## visualization
Original: `1 -> 2 -> 3` with `1.random = 3` and `2.random = 1`. After interleaving pass: `1 -> 1' -> 2 -> 2' -> 3 -> 3'`. Random pass: `1'.random = 1.random.next = 3.next = 3'`. Likewise `2'.random = 2.random.next = 1.next = 1'`. Unweave pass: pull out the primes, restoring `1 -> 2 -> 3` and producing `1' -> 2' -> 3'` as the clone.

## bruteForce
Two-pass hashmap. Pass one: walk the original, create a copy of each node, store `{original: copy}`. Pass two: walk again, set `copy.next = map[orig.next]` and `copy.random = map[orig.random]`, with `map[None] = None` to handle nulls. O(n) time, O(n) extra space. This is the textbook answer and a perfectly valid interview submission.

## optimal
Three-pass interleaving without extra storage.
1. For each original node, splice a fresh copy directly after it: `orig -> copy -> orig.next`.
2. Walk again and set `orig.next.random = orig.random.next` (treating null specially) — every copy's random pointer wired without lookups.
3. Walk a third time and unweave the two lists, restoring originals and extracting the cloned list.

Three passes, O(n) time, O(1) extra space, no hashmap allocation.

## complexity
time: O(n)
space: O(1) interleaved, O(n) hashmap
notes: All three approaches are O(n) time. Interleaving needs only a handful of pointer variables; the hashmap version costs one entry per node. Pick interleaving when memory is tight, hashmap when clarity matters most.

## pitfalls
- Forgetting to handle `random == null` — null-deref on the second pass.
- In interleaving, computing the random wire-up *after* unweaving — by then `orig.random.next` is no longer the copy.
- Mutating the original list and forgetting to restore it: callers may still hold references and expect it intact.
- Confusing this with shallow copy: a shallow copy reuses node objects and silently fails any "do not share pointers" follow-up test.

## interviewTips
- Open with the hashmap version to lock in correctness, then volunteer "I can also do this in O(1) extra space by interleaving copies."
- Sketch the three passes on paper — interviewers want to see the unweave step done carefully.
- Mention that restoring the original list is part of the contract; many solutions silently break it.

## code.python
```python
class Node:
    def __init__(self, val, next=None, random=None):
        self.val, self.next, self.random = val, next, random

def copy_random_list(head):
    if not head:
        return None
    cur = head
    while cur:
        copy = Node(cur.val, cur.next)
        cur.next = copy
        cur = copy.next
    cur = head
    while cur:
        if cur.random:
            cur.next.random = cur.random.next
        cur = cur.next.next
    cur = head
    clone_head = head.next
    while cur:
        copy = cur.next
        cur.next = copy.next
        copy.next = copy.next.next if copy.next else None
        cur = cur.next
    return clone_head
```

## code.javascript
```javascript
function copyRandomList(head) {
  if (!head) return null;
  let cur = head;
  while (cur) {
    const copy = { val: cur.val, next: cur.next, random: null };
    cur.next = copy;
    cur = copy.next;
  }
  cur = head;
  while (cur) {
    if (cur.random) cur.next.random = cur.random.next;
    cur = cur.next.next;
  }
  cur = head;
  const cloneHead = head.next;
  while (cur) {
    const copy = cur.next;
    cur.next = copy.next;
    copy.next = copy.next ? copy.next.next : null;
    cur = cur.next;
  }
  return cloneHead;
}
```

## code.java
```java
public Node copyRandomList(Node head) {
    if (head == null) return null;
    Node cur = head;
    while (cur != null) {
        Node copy = new Node(cur.val);
        copy.next = cur.next;
        cur.next = copy;
        cur = copy.next;
    }
    cur = head;
    while (cur != null) {
        if (cur.random != null) cur.next.random = cur.random.next;
        cur = cur.next.next;
    }
    cur = head;
    Node cloneHead = head.next;
    while (cur != null) {
        Node copy = cur.next;
        cur.next = copy.next;
        copy.next = copy.next != null ? copy.next.next : null;
        cur = cur.next;
    }
    return cloneHead;
}
```

## code.cpp
```cpp
Node* copyRandomList(Node* head) {
    if (!head) return nullptr;
    Node* cur = head;
    while (cur) {
        Node* copy = new Node(cur->val);
        copy->next = cur->next;
        cur->next = copy;
        cur = copy->next;
    }
    cur = head;
    while (cur) {
        if (cur->random) cur->next->random = cur->random->next;
        cur = cur->next->next;
    }
    cur = head;
    Node* cloneHead = head->next;
    while (cur) {
        Node* copy = cur->next;
        cur->next = copy->next;
        copy->next = copy->next ? copy->next->next : nullptr;
        cur = cur->next;
    }
    return cloneHead;
}
```
