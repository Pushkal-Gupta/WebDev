---
slug: min-stack
module: stacks-queues
title: Min Stack
subtitle: A stack that returns its minimum element in O(1).
difficulty: Beginner
position: 3
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
A min stack supports push, pop, top, and `getMin` — all in O(1). The hard requirement is `getMin`: scanning the stack on every call would be O(n). The trick is to *embed minimum information inside the stack itself*, paying a small O(1) cost on push to make `getMin` free.

## whyItMatters
This problem captures a recurring data-structure pattern: **trade a tiny per-write cost for a free read.** The same idea reappears in monotonic stacks (max sliding window), persistent stacks, undo histories that need "what was the previous state?" answers, and concurrent data structures where atomic reads matter more than writes.

## intuition
Whenever you push a value, you also know what the minimum was *before* this push. So push a pair `(value, current_min)` — or maintain a parallel "minimums so far" stack. On pop, both stacks shrink together. The stack-of-mins always has the same length as the value stack, and its top is always the current minimum.

## visualization
Push 5 → values [5], mins [5]. Push 3 → values [5, 3], mins [3]. Push 7 → values [5, 3, 7], mins [3] (still 3; we only push to mins when the new value beats or ties). Push 1 → values [5, 3, 7, 1], mins [3, 1]. Pop → values [5, 3, 7], mins [3]. getMin: 3.

## bruteForce
Use a single stack and scan it on each `getMin` call. O(n) per `getMin`, defeats the entire point. Mention only as a baseline before pivoting.

## optimal
Two synchronized stacks. **values** stack stores the actual values. **mins** stack stores the minimum-so-far. On push: append to values; append `min(new_value, mins.top())` to mins. On pop: pop both. `getMin()` returns `mins.top()`. All operations are amortized O(1).

A memory optimization stores only "new minimums" in the mins stack — push to mins only when the new value `≤` current minimum, and on pop, only pop from mins if the popped value equals the current minimum. Same O(1) operations, but mins stack stays small if minimums are sparse.

## complexity
time: O(1) per operation (push, pop, top, getMin).
space: O(n) — same order as a regular stack; the constant doubles in the naïve two-stack version.
notes: The "push only on new min" optimization keeps mins-stack length proportional to the number of distinct minimums, not total operations.

## pitfalls
- Pushing to the mins stack *unconditionally* without comparing — produces wrong answers (mins stack ends up with arbitrary values).
- Forgetting to pop from mins when the popped value is the current minimum.
- Using `<` instead of `<=` when comparing — duplicates of the minimum need separate min-stack entries, otherwise popping one removes the minimum prematurely.
- Confusing `top()` (returns latest pushed value) with `getMin()` (returns minimum across all values).

## interviewTips
- Open by stating the trade-off out loud: "We pay a little extra memory on push to make `getMin` O(1)." This shows you understand the design tension.
- Mention the memory-optimized variant once the basic solution is on the board — it shows depth without over-engineering the first answer.
- The natural follow-up is "now also support `getMax`" — same trick, just symmetric.

## code.python
```python
class MinStack:
    def __init__(self):
        self._values = []
        self._mins = []

    def push(self, val: int) -> None:
        self._values.append(val)
        if not self._mins or val <= self._mins[-1]:
            self._mins.append(val)

    def pop(self) -> None:
        if not self._values: return
        if self._values.pop() == self._mins[-1]:
            self._mins.pop()

    def top(self) -> int:
        return self._values[-1]

    def getMin(self) -> int:
        return self._mins[-1]
```

## code.javascript
```javascript
class MinStack {
  constructor() { this.values = []; this.mins = []; }
  push(val) {
    this.values.push(val);
    if (this.mins.length === 0 || val <= this.mins[this.mins.length - 1]) {
      this.mins.push(val);
    }
  }
  pop() {
    if (this.values.length === 0) return;
    if (this.values.pop() === this.mins[this.mins.length - 1]) this.mins.pop();
  }
  top() { return this.values[this.values.length - 1]; }
  getMin() { return this.mins[this.mins.length - 1]; }
}
```

## code.java
```java
class MinStack {
    private final Deque<Integer> values = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();
    public void push(int val) {
        values.push(val);
        if (mins.isEmpty() || val <= mins.peek()) mins.push(val);
    }
    public void pop() {
        if (values.isEmpty()) return;
        int v = values.pop();
        if (v == mins.peek()) mins.pop();
    }
    public int top()    { return values.peek(); }
    public int getMin() { return mins.peek(); }
}
```

## code.cpp
```cpp
class MinStack {
    stack<int> values;
    stack<int> mins;
public:
    void push(int val) {
        values.push(val);
        if (mins.empty() || val <= mins.top()) mins.push(val);
    }
    void pop() {
        if (values.empty()) return;
        int v = values.top(); values.pop();
        if (v == mins.top()) mins.pop();
    }
    int top() { return values.top(); }
    int getMin() { return mins.top(); }
};
```
