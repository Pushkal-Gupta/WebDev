---
slug: stack-with-getmin
module: stacks-queues
title: Stack with O(1) getMin
subtitle: Augment a stack with a parallel min-stack so push, pop, top, and getMin all run in constant time.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Design a stack that supports getMin() in O(1) — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/design-a-stack-that-supports-getmin-in-o1-time-and-o1-extra-space/"
    type: blog
  - title: "Algorithms, 4th Edition — Stacks and Queues"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "TheAlgorithms/Python — stack.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/stacks/stack.py"
    type: repo
status: published
---

## intro
A vanilla stack offers push, pop, and top in O(1) but cannot answer "what's the current minimum?" without scanning every element. A min-stack augments the structure so that getMin also runs in O(1) — at the cost of a second auxiliary stack mirroring the running minimum.

## whyItMatters
Constant-time min/max queries on a mutable LIFO sequence underpin sliding-window minimum, the histogram largest-rectangle algorithm, and many parser/expression-evaluation tricks. It is the simplest example of "carry an extra structure alongside the primary one to make queries free." Interviewers ask it because it tests whether you can think about amortized cost rather than reaching for a heap.

## intuition
The minimum of a stack only changes when you push a value smaller than (or equal to) the current minimum. So alongside the main stack, keep a min-stack whose top always equals the minimum of all values currently in the main stack. On every push, compare the new value with the current min-top and push the smaller of the two (or push unconditionally and use ≤). On every pop, pop both stacks together. Now getMin is just min_stack.top().

## visualization
Push 5: main=[5], min=[5]. Push 3: main=[5,3], min=[5,3]. Push 7: main=[5,3,7], min=[5,3,3] (we keep mirroring the current min). Push 2: main=[5,3,7,2], min=[5,3,3,2]. Pop: removes 2 from both. getMin returns 3. Pop again: removes 7; getMin still returns 3.

## bruteForce
Implement getMin by scanning the underlying array on demand — O(n) per call. Acceptable if queries are rare, but interviewers usually specify "all operations O(1)" precisely to rule this out. A second naïve idea — maintaining a single int "currentMin" — fails because there is no way to recover the previous min after popping the smallest value.

## optimal
Two parallel stacks. On push(v): main.push(v); min.push(v ≤ min.top() ? v : min.top()). On pop(): main.pop(); min.pop(). On getMin(): return min.top(). All four operations are O(1). A space-saving variant only pushes onto min-stack when v ≤ min.top() and only pops when the top matches, halving memory in the common case where most pushes are not new minimums.

## complexity
time: O(1) per push, pop, top, and getMin
space: O(n) total — the auxiliary stack mirrors the worst-case number of distinct running minimums
notes: A "compressed" variant stores (value, count) pairs in the min-stack and uses O(distinct-mins) extra space, which is strictly less than n in any list with repeated runs.

## pitfalls
- Pushing unconditionally onto min-stack without taking the min — corrupts the invariant.
- Using strict < instead of ≤ in the compressed variant — when the same minimum is pushed twice, popping it once would surface a stale (incorrect) min.
- Forgetting to pop the min-stack alongside the main stack.
- Calling getMin on an empty stack — guard with a precondition or throw.

## interviewTips
- State the invariant out loud: "min-stack's top always equals the minimum of main-stack."
- Mention the compressed variant if asked to reduce space — shows awareness beyond the textbook answer.
- The same "carry a parallel structure" idea is the seed of monotonic-stack/queue patterns — make the connection.
- If the interviewer asks for getMax too, point out the structure is symmetric: a second auxiliary max-stack.

## code.python
```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, x):
        self.stack.append(x)
        self.mins.append(x if not self.mins else min(x, self.mins[-1]))

    def pop(self):
        self.mins.pop()
        return self.stack.pop()

    def top(self):
        return self.stack[-1]

    def get_min(self):
        return self.mins[-1]
```

## code.javascript
```javascript
class MinStack {
  constructor() {
    this.stack = [];
    this.mins = [];
  }
  push(x) {
    this.stack.push(x);
    this.mins.push(this.mins.length === 0 ? x : Math.min(x, this.mins[this.mins.length - 1]));
  }
  pop() {
    this.mins.pop();
    return this.stack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  getMin() {
    return this.mins[this.mins.length - 1];
  }
}
```

## code.java
```java
class MinStack {
    private final Deque<Integer> stack = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        stack.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }
    public int pop() {
        mins.pop();
        return stack.pop();
    }
    public int top() {
        return stack.peek();
    }
    public int getMin() {
        return mins.peek();
    }
}
```

## code.cpp
```cpp
class MinStack {
    std::stack<int> stk, mins;
public:
    void push(int x) {
        stk.push(x);
        mins.push(mins.empty() ? x : std::min(x, mins.top()));
    }
    void pop() {
        mins.pop();
        stk.pop();
    }
    int top() {
        return stk.top();
    }
    int getMin() {
        return mins.top();
    }
};
```
