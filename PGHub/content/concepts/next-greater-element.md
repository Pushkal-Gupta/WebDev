---
slug: next-greater-element
module: stacks-queues
title: Next Greater Element
subtitle: Find the next greater value for every element in a single pass with a monotonic stack.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 10: Stacks and Queues"
    url: "https://walkccc.me/CLRS/Chap10/10.1/"
    type: book
  - title: "Next Greater Element — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/next-greater-element/"
    type: blog
  - title: "TheAlgorithms/Python — next_greater_element.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/stacks/next_greater_element.py"
    type: repo
status: published
---

## intro
For each element in an array, the next greater element is the first value to its right that strictly exceeds it. If none exists, the answer is -1 (or any sentinel). A pair of nested loops solves it in O(n^2); a single pass with a monotonic decreasing stack solves it in O(n). This is the gateway problem to the entire monotonic-stack family.

## whyItMatters
- **LeetCode's monotonic-stack family** (Stock Span, Daily Temperatures, Largest Rectangle in Histogram, Trapping Rain Water, Sum of Subarray Minimums, 132 Pattern, Remove K Digits) all reduce to a next-greater / next-smaller scan; the technique appears in roughly 30 LeetCode problems.
- **Compilers** (LLVM, GCC, V8's Crankshaft) use monotonic stacks for operator-precedence parsing (Dijkstra's shunting-yard algorithm) and for emitting bytecode with bracket matching.
- **Real-time market-data systems** (Bloomberg terminal, Nasdaq's matching engine telemetry) compute stock-span — the number of consecutive prior days where today's price was greater-or-equal — as a streaming next-greater problem.
- **The CLRS exercises and Knuth's TAOCP Vol. 1 (sec. 2.2.1)** introduce the monotonic-stack technique under "next larger element" decades before LeetCode existed; it is the textbook gateway to amortized analysis.

## intuition
The naive nested-loop approach (for each i, scan rightward until something larger appears) is O(n^2). It is wasteful because it re-scans the same suffix repeatedly. Every element you skip is **dominated** by some larger element you already saw — once a smaller value has a known answer, you never need to look at it again. The monotonic stack captures this insight: keep only the values that could still be someone's next-greater answer, and throw away everything else as soon as it is dominated.

Walk the array **right to left**. Maintain a stack of candidate next-greater values, kept in **strictly decreasing order from bottom to top**. When you process index i with value v: pop every element on the stack that is <= v, because v is at least as large and is closer to any future index on the left — those popped values can never serve as anyone's next-greater again. The new top of the stack, if any, is exactly the next greater element for position i. Then push v itself, because v is now a candidate for positions further to the left.

The key amortized argument: every element is pushed at most once and popped at most once across the entire run. The inner while-loop looks O(n) per iteration but its total work across all iterations is O(n) — bounded by the total number of pops, which is at most n. This is the classic amortized-analysis pattern, the same reasoning that justifies dynamic array append being O(1) amortized despite occasional O(n) resizes. Once you internalize this, the entire monotonic-stack family becomes a single template with the comparator and direction swapped.

## visualization
Array: [2, 1, 2, 4, 3]. Process right to left.
- i=4, val=3: stack empty, ans[4]=-1, push 3. Stack: [3].
- i=3, val=4: pop 3 (not > 4), stack empty, ans[3]=-1, push 4. Stack: [4].
- i=2, val=2: top=4 > 2, ans[2]=4, push 2. Stack: [4, 2].
- i=1, val=1: top=2 > 1, ans[1]=2, push 1. Stack: [4, 2, 1].
- i=0, val=2: pop 1, pop 2; top=4 > 2, ans[0]=4, push 2. Stack: [4, 2].
Final: [4, 2, 4, -1, -1].

## bruteForce
Two nested loops: for each i, scan j from i+1 to n-1 and stop at the first nums[j] > nums[i]. Quadratic time, no extra memory. Acceptable for tiny inputs but rejected once n exceeds a few thousand. The pattern is also harder to extend to "circular" variants where indices wrap around.

## optimal
The optimal pattern is a **right-to-left monotonic stack** with O(n) amortized time and O(n) space. The structural invariant: at every moment, the stack contains a strictly decreasing sequence (bottom to top) of values that have not yet been "claimed" as someone's next-greater. The technique generalizes to next-smaller (flip the comparator), previous-greater / previous-smaller (iterate left to right), and the circular variant (iterate `2n` times with `i % n`).

```python
def next_greater(nums):
    n = len(nums)
    ans = [-1] * n
    stack = []                                # decreasing from bottom to top
    for i in range(n - 1, -1, -1):
        while stack and stack[-1] <= nums[i]: # pop dominated values
            stack.pop()
        if stack:
            ans[i] = stack[-1]                # closest larger value to the right
        stack.append(nums[i])
    return ans

# Circular variant (LeetCode 503): wrap by iterating twice.
def next_greater_circular(nums):
    n = len(nums)
    ans = [-1] * n
    stack = []                                # store indices, not values
    for i in range(2 * n - 1, -1, -1):
        v = nums[i % n]
        while stack and nums[stack[-1]] <= v:
            stack.pop()
        if i < n and stack:
            ans[i] = nums[stack[-1]]
        stack.append(i % n)
    return ans
```

Why this is right: it achieves the asymptotic lower bound (you must read every input, so O(n) is best possible) while solving the problem in a single pass. The amortized analysis — total push count <= n, total pop count <= n — collapses the apparent quadratic cost of the inner while loop. For **distance variants** (Stock Span, Daily Temperatures), store indices on the stack instead of values, and compute `i - stack[-1]` at each match. For **strict vs non-strict semantics**, swap `<=` and `<` in the pop condition — using `<=` enforces strict greater; `<` allows equality. Re-read the prompt every time; this is the single most common interview slip.

Adjacent patterns: **Largest Rectangle in Histogram** is two next-smaller scans (left and right) combined; **Trapping Rain Water** uses two passes of max-so-far (a degenerate monotonic stack); **Sum of Subarray Minimums** uses next-smaller plus a contribution formula. Master one template, unlock the family.

## complexity
time: O(n)
space: O(n) for the stack in the worst case (strictly decreasing input)
notes: The amortized argument is the heart of monotonic-stack analysis: total push count is n, total pop count is at most n, so the inner while loop's apparent quadratic cost collapses to linear.

## pitfalls
- Using <= vs < when popping — flips between strict-greater and greater-or-equal semantics; re-read the prompt.
- Forgetting that the answer for indices with no greater element to the right is some agreed-on sentinel.
- Pushing values when you need indices for distance-based variants like stock span — store indices and dereference.
- Misordering the stack invariant (increasing vs decreasing); draw three elements on paper before coding.

## interviewTips
- Say "monotonic stack" out loud — interviewers love hearing the pattern name.
- Be ready to switch direction (left-to-right finds next-smaller-to-the-left) without rewriting from scratch.
- Mention the circular variant — extending to 2n iterations is a frequent follow-up.

## code.python
```python
def next_greater(nums):
    n = len(nums)
    ans = [-1] * n
    stack = []
    for i in range(n - 1, -1, -1):
        while stack and stack[-1] <= nums[i]:
            stack.pop()
        if stack:
            ans[i] = stack[-1]
        stack.append(nums[i])
    return ans
```

## code.javascript
```javascript
function nextGreater(nums) {
  const n = nums.length;
  const ans = new Array(n).fill(-1);
  const stack = [];
  for (let i = n - 1; i >= 0; i--) {
    while (stack.length && stack[stack.length - 1] <= nums[i]) stack.pop();
    if (stack.length) ans[i] = stack[stack.length - 1];
    stack.push(nums[i]);
  }
  return ans;
}
```

## code.java
```java
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && stack.peek() <= nums[i]) stack.pop();
        if (!stack.isEmpty()) ans[i] = stack.peek();
        stack.push(nums[i]);
    }
    return ans;
}
```

## code.cpp
```cpp
vector<int> nextGreater(vector<int>& nums) {
    int n = nums.size();
    vector<int> ans(n, -1);
    stack<int> st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.top() <= nums[i]) st.pop();
        if (!st.empty()) ans[i] = st.top();
        st.push(nums[i]);
    }
    return ans;
}
```
