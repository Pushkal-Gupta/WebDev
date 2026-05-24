---
slug: queue-using-stacks
module: stacks-queues
title: Queue Using Two Stacks
subtitle: Simulate FIFO with two LIFO stacks; lazy transfer gives amortized O(1) dequeue.
difficulty: Beginner
position: 8
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Queue using Stacks — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/queue-using-stacks/"
    type: blog
  - title: "Algorithms, 4th Edition — Stacks and Queues"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "TheAlgorithms/Python — queue_by_two_stacks.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/queue/queue_by_two_stacks.py"
    type: repo
status: published
---

## intro
You have only a stack abstraction — push, pop, peek, empty — and you must build a queue. The classic trick uses two stacks and exploits the fact that popping one stack into another reverses the order, turning two LIFOs into one FIFO with amortized O(1) per operation.

## whyItMatters
Beyond the interview, the two-stack queue is the cleanest illustration of amortized analysis a beginner ever sees: each item moves between stacks at most twice, so n operations cost O(n) total work even though one individual dequeue may cost O(n). The same lazy-transfer idea reappears in persistent data structures and in Okasaki's purely-functional queues.

## intuition
Designate one stack as in-stack (handles enqueues) and the other as out-stack (handles dequeues). Enqueue always pushes onto in-stack. Dequeue pops from out-stack — but if out-stack is empty, first drain in-stack into out-stack one element at a time, which reverses the order so the oldest enqueued element ends up on top. Once items are on out-stack they stay there until dequeued; never push them back.

## visualization
Enqueue 1, 2, 3: in=[1,2,3] (top=3), out=[]. Dequeue: out is empty so drain in → out, giving out=[3,2,1] (top=1); pop and return 1. Enqueue 4: in=[4], out=[3,2]. Dequeue: out is non-empty, pop and return 2. State now: in=[4], out=[3]. Dequeue: return 3. Dequeue: drain in → out giving out=[4]; pop and return 4.

## bruteForce
Single-stack queue: every dequeue pops the entire stack into a temp stack, removes the bottom, then pushes everything back. Each operation costs O(n); n operations cost O(n²). Correct but defeats the purpose — the whole point is to demonstrate amortized analysis.

## optimal
Two-stack queue with lazy transfer. Enqueue: O(1), push onto in-stack. Dequeue: if out-stack non-empty, pop O(1); otherwise transfer all of in-stack to out-stack (O(k) for the k items moved), then pop O(1). Amortized: each item is pushed twice and popped twice across its lifetime, so the total cost of n operations is O(n) — amortized O(1) per call. Peek/front mirrors dequeue minus the final pop.

## complexity
time: O(1) amortized per enqueue and dequeue; O(n) worst case for a single dequeue
space: O(n) total across both stacks
notes: The amortized bound assumes each item is dequeued at most once. For applications with bursty access patterns, this is acceptable; for hard real-time systems where worst-case latency matters, prefer a deque or a circular buffer.

## pitfalls
- Re-pushing out-stack back onto in-stack on every dequeue — breaks amortized O(1) and reverts to O(n²) total.
- Transferring on every dequeue even when out-stack is non-empty — also wastes work.
- Forgetting to check both stacks in the empty() predicate.
- Implementing peek by popping and re-pushing onto in-stack — wrong stack, wrong order.

## interviewTips
- Walk through the amortized argument explicitly: each element is pushed at most twice, popped at most twice.
- Ask whether the interviewer wants amortized O(1) or worst-case O(1) — the latter requires a deque or three stacks.
- Mention the symmetric "stack using two queues" problem as a contrast — it is harder and has worse complexity.
- Sketch the invariant: "out-stack holds the oldest items in dequeue order; in-stack holds the newest items in arrival order."

## code.python
```python
class MyQueue:
    def __init__(self):
        self.in_stk = []
        self.out_stk = []

    def push(self, x):
        self.in_stk.append(x)

    def pop(self):
        self._shift()
        return self.out_stk.pop()

    def peek(self):
        self._shift()
        return self.out_stk[-1]

    def empty(self):
        return not self.in_stk and not self.out_stk

    def _shift(self):
        if not self.out_stk:
            while self.in_stk:
                self.out_stk.append(self.in_stk.pop())
```

## code.javascript
```javascript
class MyQueue {
  constructor() {
    this.inStk = [];
    this.outStk = [];
  }
  push(x) {
    this.inStk.push(x);
  }
  pop() {
    this.shift();
    return this.outStk.pop();
  }
  peek() {
    this.shift();
    return this.outStk[this.outStk.length - 1];
  }
  empty() {
    return this.inStk.length === 0 && this.outStk.length === 0;
  }
  shift() {
    if (this.outStk.length === 0) {
      while (this.inStk.length) this.outStk.push(this.inStk.pop());
    }
  }
}
```

## code.java
```java
class MyQueue {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    public void push(int x) {
        in.push(x);
    }
    public int pop() {
        shift();
        return out.pop();
    }
    public int peek() {
        shift();
        return out.peek();
    }
    public boolean empty() {
        return in.isEmpty() && out.isEmpty();
    }
    private void shift() {
        if (out.isEmpty()) {
            while (!in.isEmpty()) out.push(in.pop());
        }
    }
};
```

## code.cpp
```cpp
class MyQueue {
    std::stack<int> in_stk, out_stk;
    void shift() {
        if (out_stk.empty()) {
            while (!in_stk.empty()) {
                out_stk.push(in_stk.top());
                in_stk.pop();
            }
        }
    }
public:
    void push(int x) {
        in_stk.push(x);
    }
    int pop() {
        shift();
        int v = out_stk.top();
        out_stk.pop();
        return v;
    }
    int peek() {
        shift();
        return out_stk.top();
    }
    bool empty() {
        return in_stk.empty() && out_stk.empty();
    }
};
```
