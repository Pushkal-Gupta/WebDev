---
slug: task-scheduler-cooldown
module: greedy
title: Task Scheduler with Cooldown
subtitle: Schedule tasks with an n-tick cooldown between identical types — priority queue greedy plus a closed-form bound.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Priority Queues (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "Task Scheduler — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/task-scheduler-problem/"
    type: blog
  - title: "TheAlgorithms/Python — heap (priority_queue implementations)"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/heap/heap.py"
    type: repo
status: published
---

## intro
You have a list of task labels and an integer `n`. The CPU executes one task per tick. Two identical tasks must be separated by at least `n` ticks of other work or idle. Find the minimum total ticks to finish every task. Two ways are interesting: a priority-queue simulation, and a beautiful closed-form derived from the most frequent task.

## whyItMatters
Cooldown scheduling models OS task dispatchers, ad-rotation pacing, and rate-limited API call planners. The closed-form bound — `max(len(tasks), (maxCount - 1) * (n + 1) + tiesAtMax)` — is one of the most elegant results in introductory greedy theory and is worth memorising.

## intuition
The most-frequent task forms a "skeleton" of `maxCount` slots, separated by `n` idle ticks. Between two skeleton placements you have `n` slots that you fill with the next-most-frequent tasks (or leave idle). If `k` task types tie for the maximum frequency, they all need to appear in the final block, so add `k` for those tail occurrences. The result is either this skeleton-bound expression or simply `len(tasks)` — whichever is larger (more tasks than skeleton slots means no idle ticks are needed).

## visualization
Tasks = `["A","A","A","B","B","B"]`, `n = 2`. maxCount = 3 (both A and B), ties = 2. Skeleton: `(3 - 1) * (2 + 1) + 2 = 8`. A valid schedule: `A B _ A B _ A B` — exactly 8 ticks. With less frequent fillers like `["A","A","A","B","B","B","C","D","E","F"]`: skeleton still 8, but len = 10, so the answer is 10 and the schedule packs cleanly: `A B C A B D A B E F` — no idle slots needed.

## bruteForce
Backtracking over every permutation of the multiset of tasks, enforcing the cooldown at each step, taking the minimum length. O(n!) — infeasible past a dozen tasks. Useful only to validate the closed form on tiny inputs.

## optimal
Two equivalent approaches. (1) Max-heap simulation: count frequencies, push counts into a max-heap. Each tick, pop up to `n + 1` distinct tasks, decrement each, push back any still positive. If after a round the heap is non-empty, you used `n + 1` ticks; otherwise you used only as many ticks as you popped. (2) Closed-form: compute max count and tie count, return `max(len(tasks), (maxCount - 1) * (n + 1) + ties)`. Both run in linear time over the input plus constant work over the 26 distinct labels (in the LeetCode formulation).

## complexity
time: O(t) where t is the number of tasks (the heap holds at most the number of distinct labels, treated as a constant in the standard formulation).
space: O(1) for fixed-alphabet inputs (constant-size heap or count array).
notes: The closed form sidesteps simulation entirely. The heap version is easier to extend to variants (per-task cooldowns, weighted priorities) where the formula breaks.

## pitfalls
- Forgetting the `max(len(tasks), …)` clamp — the closed form can underestimate when fillers exceed skeleton slots.
- Counting `ties` as task instances instead of *task types* whose count equals the max — overcounts the trailing block.
- Pushing zero counts back into the heap — wastes space and breaks the round-end check.
- Using `n` instead of `n + 1` in the cycle length — off-by-one because the executing task itself occupies one slot.

## interviewTips
- Lead with the closed form, then defend it with the skeleton picture — interviewers love seeing both an answer and an intuition.
- Mention that the heap simulation generalizes when the formula doesn't (variable cooldown, weighted priorities).
- For the follow-up "return the schedule, not just the length," switch to the heap version — the formula gives a count but not a witness.

## code.python
```python
import heapq
from collections import Counter

def least_interval(tasks, n):
    counts = Counter(tasks)
    max_count = max(counts.values())
    ties = sum(1 for v in counts.values() if v == max_count)
    return max(len(tasks), (max_count - 1) * (n + 1) + ties)

def least_interval_heap(tasks, n):
    counts = Counter(tasks)
    heap = [-c for c in counts.values()]
    heapq.heapify(heap)
    time = 0
    while heap:
        round_picks = []
        for _ in range(n + 1):
            if heap:
                round_picks.append(heapq.heappop(heap))
        for c in round_picks:
            if c + 1 < 0:
                heapq.heappush(heap, c + 1)
        time += (n + 1) if heap else len(round_picks)
    return time
```

## code.javascript
```javascript
function leastInterval(tasks, n) {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  let maxCount = 0, ties = 0;
  for (const v of counts.values()) {
    if (v > maxCount) { maxCount = v; ties = 1; }
    else if (v === maxCount) ties++;
  }
  return Math.max(tasks.length, (maxCount - 1) * (n + 1) + ties);
}
```

## code.java
```java
public int leastInterval(char[] tasks, int n) {
    int[] counts = new int[26];
    for (char t : tasks) counts[t - 'A']++;
    int maxCount = 0, ties = 0;
    for (int c : counts) {
        if (c > maxCount) { maxCount = c; ties = 1; }
        else if (c == maxCount) ties++;
    }
    return Math.max(tasks.length, (maxCount - 1) * (n + 1) + ties);
}
```

## code.cpp
```cpp
int leastInterval(vector<char>& tasks, int n) {
    int counts[26] = {0};
    for (char t : tasks) counts[t - 'A']++;
    int maxCount = 0, ties = 0;
    for (int c : counts) {
        if (c > maxCount) { maxCount = c; ties = 1; }
        else if (c == maxCount) ties++;
    }
    return max((int)tasks.size(), (maxCount - 1) * (n + 1) + ties);
}
```
