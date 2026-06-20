---
slug: monotonic-stack
module: stacks-queues
title: Monotonic Stack
subtitle: Maintain a strictly increasing or decreasing stack to answer "next greater / smaller element" in linear time.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 6
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
A monotonic stack is an ordinary stack with one extra rule: before pushing a new element, pop everything that would break the desired monotonicity (strictly increasing or strictly decreasing from bottom to top). That single discipline turns a class of seemingly `O(n^2)` problems into clean `O(n)` solutions: next greater element, previous smaller element, daily temperatures, largest rectangle in histogram, trapping rain water, sum of subarray minimums.

## whyItMatters
The naive answer to "for each index, find the next index whose value is larger" is a quadratic double loop. A monotonic stack solves it in one pass because each element is pushed and popped at most once. The pattern recognition — "I am looking for the nearest element on one side that satisfies a comparison" — is one of the highest-leverage cues in array interviews; once you spot it, the implementation is twenty lines.

## intuition
Imagine you walk through the array left to right carrying a stack of indices whose values are strictly decreasing from bottom to top. When you encounter a new value larger than the top of the stack, every popped index has just found its "next greater element" — the current value. Indices that stay on the stack are still waiting. When the walk ends, anything still on the stack has no next greater element. Each index is pushed once and popped at most once, so the total work is linear.

## visualization
```
heights:  [2, 1, 5, 6, 2, 3]
Goal:      next greater element index for each position.

i=0 val=2  stack=[]            push 0          stack=[0]
i=1 val=1  top=0 (val 2 > 1)   push 1          stack=[0,1]
i=2 val=5  pop 1 (ans[1]=2)    pop 0 (ans[0]=2)  push 2  stack=[2]
i=3 val=6  pop 2 (ans[2]=3)    push 3          stack=[3]
i=4 val=2  top=3 (val 6 > 2)   push 4          stack=[3,4]
i=5 val=3  pop 4 (ans[4]=5)    push 5          stack=[3,5]
End: stack=[3,5] -> ans[3] = ans[5] = -1.

ans = [2, 2, 3, -1, 5, -1]
```
The stack's contents at any moment are exactly the indices whose answer is still pending.

## bruteForce
For each index `i`, scan forward until you find a larger value. Correct but `O(n^2)` time. For `n = 10^5` it is already too slow; for `n = 10^6` it is hopeless. The monotonic stack does the same job in one pass by reusing previous work — every comparison that fails to pop becomes "this index is still waiting," not "let me re-scan from scratch."

## optimal
For "next greater element to the right," maintain a stack of indices whose values are strictly decreasing. For each `i` from `0` to `n - 1`:
1. While the stack is non-empty and `arr[stack.top()] < arr[i]`, pop `t` and set `ans[t] = i` (or `arr[i]` depending on the prompt).
2. Push `i`.

After the loop, every index left on the stack has no next greater element. For "previous greater," walk left-to-right but record the stack top *before* popping. For "next smaller," flip the comparison to `>`.

```
next_greater_right(arr):
  n = len(arr); ans = [-1] * n; stack = []
  for i in 0..n-1:
    while stack and arr[stack[-1]] < arr[i]:
      ans[stack.pop()] = i
    stack.append(i)
  return ans
```

A small decision table keeps the four variants straight:

```
                next-greater-right   next-smaller-right
                next-greater-left    next-smaller-left

direction       affects loop order (forward vs backward)
comparison      strict < vs strict > affects monotonicity
strict vs not   affects tie-breaking; use >= or <= to skip equals
```

## complexity
time: O(n)
space: O(n)
notes: Each index is pushed exactly once and popped at most once, giving an amortized O(1) per element. The stack itself uses at most n indices. For "largest rectangle in histogram" the same pattern computes left- and right-bounded widths in two linear passes.

## pitfalls
- Comparing values when you meant indices, or vice versa. Stack stores **indices**; comparisons read `arr[stack.top()]`.
- Using `<=` when the problem says "strictly greater." That changes the semantics for equal-value runs.
- Forgetting that elements left on the stack at the end have no answer; initialize the answer array to a sentinel (-1, `n`, `Integer.MAX_VALUE`, etc.).
- Mis-ordering operations: pop *first*, then push the new index. Pushing first corrupts the monotonicity invariant.
- Trying to do "next greater on the left" with a right-to-left loop without realizing it is the same code with reversed direction.

## interviewTips
- The cue phrase is "for each element, find the nearest one that...". If you hear that, reach for a monotonic stack before anything else.
- Walk through a length-six example on the whiteboard before coding — it forces you to lock down the comparison and direction.
- Mention the four-way variant table (greater/smaller, left/right). Interviewers love a candidate who recognizes the family, not just one instance.
- Largest rectangle in histogram is the canonical hard application; trapping rain water is the canonical "two stacks vs two pointers" comparison.

## code.python
```python
def next_greater(arr):
    n = len(arr)
    ans = [-1] * n
    stack = []
    for i in range(n):
        while stack and arr[stack[-1]] < arr[i]:
            ans[stack.pop()] = i
        stack.append(i)
    return ans

def largest_rectangle(heights):
    stack = []
    best = 0
    heights = heights + [0]
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] >= h:
            top = stack.pop()
            left = stack[-1] if stack else -1
            best = max(best, heights[top] * (i - left - 1))
        stack.append(i)
    return best
```

## code.javascript
```javascript
function nextGreater(arr) {
  const n = arr.length;
  const ans = new Array(n).fill(-1);
  const stack = [];
  for (let i = 0; i < n; i++) {
    while (stack.length && arr[stack[stack.length - 1]] < arr[i]) {
      ans[stack.pop()] = i;
    }
    stack.push(i);
  }
  return ans;
}

function largestRectangle(heights) {
  const stack = [];
  let best = 0;
  const h = [...heights, 0];
  for (let i = 0; i < h.length; i++) {
    while (stack.length && h[stack[stack.length - 1]] >= h[i]) {
      const top = stack.pop();
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, h[top] * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}
```

## code.java
```java
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            ans[stack.pop()] = i;
        }
        stack.push(i);
    }
    return ans;
}

public int largestRectangle(int[] heights) {
    int n = heights.length;
    int[] h = Arrays.copyOf(heights, n + 1);
    Deque<Integer> stack = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i < h.length; i++) {
        while (!stack.isEmpty() && h[stack.peek()] >= h[i]) {
            int top = stack.pop();
            int left = stack.isEmpty() ? -1 : stack.peek();
            best = Math.max(best, h[top] * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}
```

## code.cpp
```cpp
vector<int> nextGreater(vector<int>& arr) {
    int n = arr.size();
    vector<int> ans(n, -1);
    stack<int> st;
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && arr[st.top()] < arr[i]) {
            ans[st.top()] = i;
            st.pop();
        }
        st.push(i);
    }
    return ans;
}

int largestRectangle(vector<int>& heights) {
    vector<int> h = heights;
    h.push_back(0);
    stack<int> st;
    int best = 0;
    for (int i = 0; i < (int)h.size(); ++i) {
        while (!st.empty() && h[st.top()] >= h[i]) {
            int top = st.top(); st.pop();
            int left = st.empty() ? -1 : st.top();
            best = max(best, h[top] * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}
```
