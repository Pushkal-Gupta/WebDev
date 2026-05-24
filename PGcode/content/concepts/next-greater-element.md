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
Stock-span, daily-temperatures, largest-rectangle-in-histogram, trapping-rain-water, online-stock-price — every one of them reduces to "for each i, find the nearest j to the left or right satisfying some monotonic property." Mastering next-greater-element is the unlock for that whole interview category. Compilers also use the same structure when emitting bytecode for matching brackets or operator precedence parsing.

## intuition
Walk the array right to left. Maintain a stack of "candidate next-greater values" in decreasing order from top to bottom. For the current element, pop everything that is not strictly greater — those popped values are dominated and can never serve as anyone else's next-greater. The remaining stack top, if any, is exactly the answer. Push the current value and continue.

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
Iterate from right to left while maintaining a stack of indices (or values) in strictly decreasing order from bottom to top. For each new value v: pop while the stack's top is less than or equal to v; the new top — if any — is the next greater. Record it, then push v. Each element is pushed and popped at most once, giving O(n) amortized work. For the circular variant, iterate over indices 0..2n-1 and take i mod n.

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
