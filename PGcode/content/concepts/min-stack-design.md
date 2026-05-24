---
slug: min-stack-design
module: stacks-queues
title: Min Stack Design
subtitle: O(1) push, pop, and getMin via an auxiliary stack that tracks the running minimum.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Bags, Queues, Stacks"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "GeeksforGeeks — Stack & Queue"
    url: "https://www.geeksforgeeks.org/stack-data-structure/"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/stacks/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/stacks"
    type: repo
status: published
---

## intro
A min stack is a stack that exposes one extra operation: `getMin()` returns the smallest value currently on the stack in constant time. The challenge is that the minimum can change with every push and pop — and rescanning the stack on each `getMin` call would be O(n). The classic interview-grade answer keeps an auxiliary stack of "minimum so far" so that all four operations — push, pop, top, getMin — run in O(1).

## whyItMatters
The min stack pattern is the gateway to a family of "augmented stack" problems: max stack, stack of pairs, sliding window minimum (via deque), and largest rectangle in histogram. The core idea — *store the answer alongside the data, not as a function of the data* — repeats across data-structure design and database indexing (materialized views). It also shows up as an interview question at FAANGs precisely because it forces candidates to think about *amortization* and *invariants*, not just collections.

## intuition
You only care about the minimum at the current snapshot of the stack. Every time you push x, either x is the new minimum (push x onto the min stack) or the existing minimum still holds (push the existing minimum again). Either way, the min stack always has the same height as the main stack, and its top always equals the current minimum. On pop, you pop both stacks. The min stack is a contemporaneous record of "what would be the minimum if we stopped here."

## visualization
```
push(5)          push(2)          push(7)          push(1)          pop()
main:  [5]       main:  [5,2]     main:  [5,2,7]   main:  [5,2,7,1] main:  [5,2,7]
mins:  [5]       mins:  [5,2]     mins:  [5,2,2]   mins:  [5,2,2,1] mins:  [5,2,2]
min=5            min=2            min=2            min=1            min=2
```
The mins stack mirrors the main stack — its top is always the live minimum.

## bruteForce
Keep only the main stack. On `getMin()`, scan all elements — O(n) per call. Push and pop stay O(1). Acceptable if `getMin` is rare, fatal if it's hot. A subtler "optimization" stores a single cached `min` variable: O(1) until you pop the current minimum, at which point you need to recompute by scanning — back to O(n) in the worst case and worse on average.

## optimal
Maintain two stacks. On push(x): push x onto `data`; push `min(x, top of mins)` onto `mins` (or push x if mins is empty). On pop: pop both. `getMin()` returns `mins.top()`. To save space, the auxiliary stack can store only *strict* minima with their multiplicities, but at the cost of more conditional branches. For interviews, the equal-height variant is cleanest.

```
class MinStack:
    data = []
    mins = []

    push(x):
        data.append(x)
        if mins empty or x <= mins.top():
            mins.append(x)
        else:
            mins.append(mins.top())   # parallel-stack variant
        # (Space-optimized variant: only do the append in the if-branch)

    pop():
        mins.pop()
        return data.pop()

    top(): return data.top()
    getMin(): return mins.top()
```

## complexity
time: O(1) amortized for all operations (push, pop, top, getMin).
space: O(n) for the auxiliary stack — equal-height variant doubles memory; strict-minimum variant uses 1x to 2x.
notes: A single-stack O(1) min-stack exists using encoded differences (push `2*x - min` when x is a new minimum, store `min` separately), but interviewers prefer the two-stack version because it's bug-resistant. The encoded variant fails on integer overflow at extreme values.

## pitfalls
- Forgetting to handle the empty case in `push` — referencing `mins.top()` on an empty stack throws.
- Strict-min variant: comparing with `<` instead of `<=`. If duplicates are allowed, missing equal values means popping the wrong instance later.
- Returning the data top instead of the mins top from `getMin()` — easy to confuse under interview pressure.
- Trying to "save memory" prematurely with the encoded-difference trick and then mishandling overflow when values approach INT_MIN / INT_MAX.
- Ignoring concurrency: the two stacks must update atomically; otherwise a reader can see inconsistent state.

## interviewTips
- State the API contract first: "push, pop, top, getMin — all O(1)."
- Compare the two variants (equal-height vs strict-min) and explain the trade-off: simplicity vs memory.
- Walk through a worked example with duplicates: push 5, push 5, pop — confirm getMin still returns 5.
- Be ready for the natural follow-up: max stack (mirror), then `getMid()` (impossible in O(1) with two stacks — needs an order statistic tree or a deque).
- Mention applications: undo stacks with cheapest-state queries, stack-based parsers tracking minimum precedence, expression evaluators.

## code.python
```python
class MinStack:
    def __init__(self):
        self.data = []
        self.mins = []

    def push(self, x: int) -> None:
        self.data.append(x)
        self.mins.append(x if not self.mins else min(x, self.mins[-1]))

    def pop(self) -> int:
        self.mins.pop()
        return self.data.pop()

    def top(self) -> int:
        return self.data[-1]

    def getMin(self) -> int:
        return self.mins[-1]
```

## code.javascript
```javascript
class MinStack {
  constructor() {
    this.data = [];
    this.mins = [];
  }
  push(x) {
    this.data.push(x);
    this.mins.push(this.mins.length === 0 ? x : Math.min(x, this.mins[this.mins.length - 1]));
  }
  pop() {
    this.mins.pop();
    return this.data.pop();
  }
  top() { return this.data[this.data.length - 1]; }
  getMin() { return this.mins[this.mins.length - 1]; }
}
```

## code.java
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class MinStack {
    private final Deque<Integer> data = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        data.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }
    public int pop() {
        mins.pop();
        return data.pop();
    }
    public int top() { return data.peek(); }
    public int getMin() { return mins.peek(); }
}
```

## code.cpp
```cpp
#include <stack>
#include <algorithm>

class MinStack {
    std::stack<int> data;
    std::stack<int> mins;
public:
    void push(int x) {
        data.push(x);
        mins.push(mins.empty() ? x : std::min(x, mins.top()));
    }
    int pop() {
        mins.pop();
        int v = data.top();
        data.pop();
        return v;
    }
    int top() const { return data.top(); }
    int getMin() const { return mins.top(); }
};
```
