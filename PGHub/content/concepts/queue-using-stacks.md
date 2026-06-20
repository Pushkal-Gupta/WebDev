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
The two-stack queue is the cleanest demonstration of amortized analysis in any textbook. Okasaki's *Purely Functional Data Structures* (1996) builds persistent queues on the same lazy-transfer idea, which is why Clojure's `PersistentQueue` and Haskell's `Data.Sequence` use a paired-list representation internally. The pattern shows up in real systems too: Kafka's commit-log replay reverses batches in memory the same way, and Git's pack-file delta resolution buffers reverse-applied deltas across two work stacks. Beyond systems use, every coding interview at Google, Amazon, and Meta has shipped a variant of this question because it forces candidates to articulate amortized `O(1)` without hand-waving.

## intuition
Stacks reverse order, and reversing twice restores it. That single observation is the entire algorithm. If you push `1, 2, 3` onto a stack and then pop everything into a second stack, the second stack now reads `1` on top, `2` in the middle, `3` on the bottom which is exactly the FIFO order you wanted. So one stack collects new arrivals (last-in on top, the wrong order for FIFO) and a second stack holds items already flipped into the right order, ready to be dequeued.

The lazy part is what makes it fast. You do not flip on every dequeue; you only flip when the output stack is empty and someone asks for an item. Once flipped, items live on the output stack until they are removed; you never push them back. That means each element is touched at most four times in its lifetime: pushed onto the input stack, popped off the input stack, pushed onto the output stack, popped off the output stack. Total work across `n` operations is at most `4n`, which is `O(n)` and gives `O(1)` amortized per call.

The invariant is worth saying aloud: the output stack holds the oldest items in dequeue order; the input stack holds the newest items in arrival order. Together they represent one queue. Any operation that breaks this invariant (pushing the output stack back into the input stack, or re-flipping while items still wait on the output stack) destroys the amortization and reverts performance to `O(n)` per call.

## visualization
Enqueue 1, 2, 3: in=[1,2,3] (top=3), out=[]. Dequeue: out is empty so drain in → out, giving out=[3,2,1] (top=1); pop and return 1. Enqueue 4: in=[4], out=[3,2]. Dequeue: out is non-empty, pop and return 2. State now: in=[4], out=[3]. Dequeue: return 3. Dequeue: drain in → out giving out=[4]; pop and return 4.

## bruteForce
Single-stack queue: every dequeue pops the entire stack into a temp stack, removes the bottom, then pushes everything back. Each operation costs O(n); n operations cost O(n²). Correct but defeats the purpose — the whole point is to demonstrate amortized analysis.

## optimal
Maintain two stacks, `in_stk` and `out_stk`. Enqueue pushes onto `in_stk` in `O(1)`. Dequeue first checks `out_stk`; if non-empty it pops the top in `O(1)`. Otherwise it drains every element of `in_stk` onto `out_stk` (an `O(k)` flip for the `k` items held), then pops the new top. Because each item is pushed at most twice and popped at most twice across its lifetime, `n` operations cost a total of `O(n)` work, giving amortized `O(1)` per call. Peek mirrors dequeue minus the final pop.

```python
class MyQueue:
    def __init__(self):
        self.in_stk, self.out_stk = [], []
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

The key line is `_shift`: it only fires when `out_stk` is empty, which is what bounds the total flips to one per element ever and saves the amortization argument. If you need worst-case `O(1)` (hard-real-time systems, audio buffers, low-latency network pipelines) you have to switch to a deque or to Okasaki's incremental-rebuild variant that does a constant amount of flip work on every operation. For interview purposes always state the invariant first, then the per-op cost, then the amortization proof — interviewers grade the explanation more than the code.

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
