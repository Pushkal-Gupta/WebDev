---
slug: linked-list-merge-k
module: linked-lists
title: Merge K Sorted Linked Lists
subtitle: Combine k sorted lists in O(N log k) using a min-heap of heads.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 6: Heapsort"
    url: "https://walkccc.me/CLRS/Chap06/6.5/"
    type: book
  - title: "Merge K Sorted Lists — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/merge-k-sorted-linked-lists/"
    type: blog
  - title: "TheAlgorithms/Python — merge_two_lists.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/merge_two_lists.py"
    type: repo
status: published
---

## intro
You are handed k linked lists, each already sorted in non-decreasing order, and asked to produce one merged sorted list. Total node count across all lists is N. The naïve approach concatenates and re-sorts; the right answer keeps the per-list ordering work and only pays log k overhead per emitted node by using a min-heap over the current heads.

## whyItMatters
This is the canonical "merge phase" of external sorting, log-structured storage compaction, and parallel map-reduce shuffles. Any time several already-sorted streams must be unified — search-engine posting list intersection, time-series database compaction, k-way merge sort — the same heap-of-heads structure appears. Interviewers love it because the optimal solution requires choosing the right data structure rather than inventing a new algorithm.

## intuition
At every step the next node of the answer must be the smallest head among the k lists. A min-heap answers "smallest of k things" in O(log k). After extracting the minimum, push its successor (if any) and repeat. The invariant is that the heap always contains at most one node per still-live list, so its size never exceeds k.

## visualization
Three lists: A=1->4->5, B=1->3->4, C=2->6. Heap starts with {1(A), 1(B), 2(C)}. Pop 1(A), push 4(A). Pop 1(B), push 3(B). Pop 2(C), push 6(C). Pop 3(B), push 4(B). Pop 4(A) then 4(B). Pop 5(A). Pop 6(C). Output: 1,1,2,3,4,4,5,6. Each pop is O(log 3) and the answer is built in N pops.

## bruteForce
Concatenate every list into one giant array, run a comparison sort, then rebuild a linked list. O(N log N) time, O(N) auxiliary space, and throws away the sorted structure you were given. Acceptable as a warm-up answer but rejected in any interview that mentions k explicitly.

## optimal
Push the head of every non-empty list into a min-heap keyed by node value. Repeatedly extract the minimum, append it to the tail of the result, and push its `next` pointer if non-null. Stop when the heap is empty. Because heap size stays bounded by k and each of the N nodes is pushed and popped exactly once, total work is N * (log k push + log k pop) = O(N log k). The output is built in place — no new nodes are allocated beyond a dummy head sentinel.

## complexity
time: O(N log k) where N is total nodes across all k lists
space: O(k) for the heap, plus O(1) extra for output pointers
notes: Divide-and-conquer pairwise merging hits the same O(N log k) bound without a heap, but the heap version streams the answer one node at a time, which matters when k is large or memory is tight.

## pitfalls
- Forgetting to handle empty input lists — pushing a null head crashes the comparator.
- Using a comparator that compares node references when values tie — Python and C++ heaps need a tiebreaker (a counter) or they will try to compare unhashable node objects.
- Allocating new nodes instead of relinking existing ones — wastes memory and breaks the "in-place" contract.
- Forgetting that the dummy head sentinel's `next` is the answer; returning the dummy itself ships a leading garbage node.

## interviewTips
- State the bound O(N log k) and contrast with the naïve O(N log N).
- Be ready to discuss the divide-and-conquer alternative (pair lists, merge in rounds) — same complexity, no heap, sometimes easier on cache.
- Mention that the same pattern appears in external merge sort and database query execution.

## code.python
```python
import heapq

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    dummy = ListNode(0)
    tail = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    tail.next = None
    return dummy.next
```

## code.javascript
```javascript
function mergeKLists(lists) {
  const heap = new MinHeap((a, b) => a.val - b.val);
  for (const node of lists) if (node) heap.push(node);
  const dummy = { next: null };
  let tail = dummy;
  while (heap.size()) {
    const node = heap.pop();
    tail.next = node;
    tail = node;
    if (node.next) heap.push(node.next);
  }
  tail.next = null;
  return dummy.next;
}
```

## code.java
```java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        tail.next = node;
        tail = node;
        if (node.next != null) heap.offer(node.next);
    }
    tail.next = null;
    return dummy.next;
}
```

## code.cpp
```cpp
struct Cmp { bool operator()(ListNode* a, ListNode* b) const { return a->val > b->val; } };

ListNode* mergeKLists(vector<ListNode*>& lists) {
    priority_queue<ListNode*, vector<ListNode*>, Cmp> heap;
    for (auto* n : lists) if (n) heap.push(n);
    ListNode dummy(0);
    ListNode* tail = &dummy;
    while (!heap.empty()) {
        ListNode* node = heap.top(); heap.pop();
        tail->next = node;
        tail = node;
        if (node->next) heap.push(node->next);
    }
    tail->next = nullptr;
    return dummy.next;
}
```
