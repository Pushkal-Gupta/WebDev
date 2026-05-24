---
slug: find-duplicate-floyd
module: arrays-searching
title: Find the Duplicate via Floyd's Cycle
subtitle: Locate the single duplicate in an n+1 array of values 1..n by treating indices as a linked list.
difficulty: Advanced
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Find Duplicate in Array — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/find-the-only-repetitive-element-between-1-to-n-1/"
    type: blog
  - title: "Floyd's Cycle Detection — cp-algorithms"
    url: "https://cp-algorithms.com/others/tortoise_and_hare.html"
    type: blog
  - title: "TheAlgorithms/Python — floyds_cycle_detection.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/linked_list/floyds_cycle_detection.py"
    type: repo
status: published
---

## intro
You're given an array of `n+1` integers, each in the range `1..n`. By pigeonhole, exactly one value must repeat. Find it without modifying the array and in O(1) extra space. The clean answer reinterprets array indices as a linked list and runs Floyd's tortoise-and-hare.

## whyItMatters
This problem is the canonical bridge between two domains: cycle detection (linked lists) and pigeonhole reasoning (arrays). Solving it without sorting, without a hash set, and without mutating input demonstrates exactly the kind of constraint-juggling interviewers probe for. It also showcases how a *change of representation* can unlock an algorithm that looks unrelated.

## intuition
Treat the array as a function `f(i) = nums[i]`. Since values are in `1..n` and there are `n+1` indices, the function maps `{0..n} -> {1..n}`. Starting at index 0 and repeatedly applying `f`, you walk a sequence `0 -> nums[0] -> nums[nums[0]] -> ...`. Because the codomain is smaller than the domain and at least two indices map to the same value (the duplicate), this sequence eventually revisits a node — a cycle. Floyd's algorithm finds the cycle's entry point, which is precisely the duplicated value.

## visualization
Take `nums = [1,3,4,2,2]`. Starting at index 0, follow `f`: 0 -> 1 -> 3 -> 2 -> 4 -> 2 -> 4 -> ... — the cycle is `2 -> 4 -> 2`, entered at value 2. Run tortoise/hare: slow and fast meet inside the cycle, then reset slow to index 0 and advance both by one step until they meet again at value 2 — the duplicate.

## bruteForce
Sort the array and scan for an adjacent duplicate: O(n log n) time, but mutates the input. Or hash-set the values: O(n) time and O(n) space. Both violate the textbook constraints (no mutation, O(1) extra space). They're the baselines to *mention and reject* before pivoting to Floyd's.

## optimal
Phase 1 — detection: `slow = nums[0]`, `fast = nums[0]`. Repeat `slow = nums[slow]`, `fast = nums[nums[fast]]` until they meet. Phase 2 — find entry: reset `slow = nums[0]`, then advance both one step at a time until they meet again. The meeting point is the duplicate. The proof is identical to "find cycle start" in a linked list — the distance from start to entry equals the distance from collision back around to entry.

## complexity
time: O(n)
space: O(1)
notes: Each pointer traverses at most 2n indices before convergence. No allocation, no input mutation, no recursion. The algorithm assumes exactly one duplicate; multiple duplicates change the cycle structure and the entry need not be unique.

## pitfalls
- Starting both pointers at `0` and advancing them before the first comparison — easy to overshoot the meeting.
- Confusing this with "find all duplicates" — Floyd's pinpoints one duplicate; multiple duplicates require a different approach.
- Forgetting the phase-2 reset to `nums[0]` — without it, you only know a cycle exists, not where it starts.
- Using array values out of the `1..n` range (e.g., zero-indexed values) — the index mapping breaks and the algorithm may not terminate.

## interviewTips
- Spell out the no-mutation, O(1)-space constraint and explain why sort and hash-set both fail.
- Sketch the index-as-pointer reinterpretation explicitly — most interviewers want to hear that insight stated.
- Be prepared to prove correctness of phase 2 with a short distance argument; it's the part that separates rote pattern matching from genuine understanding.

## code.python
```python
def find_duplicate(nums):
    slow = nums[0]
    fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow
```

## code.javascript
```javascript
function findDuplicate(nums) {
  let slow = nums[0], fast = nums[0];
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}
```

## code.java
```java
public int findDuplicate(int[] nums) {
    int slow = nums[0], fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```

## code.cpp
```cpp
int findDuplicate(vector<int>& nums) {
    int slow = nums[0], fast = nums[0];
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```
