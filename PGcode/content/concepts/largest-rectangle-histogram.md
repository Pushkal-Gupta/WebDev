---
slug: largest-rectangle-histogram
module: stacks-queues
title: Largest Rectangle in Histogram
subtitle: Find the maximum-area axis-aligned rectangle in a bar chart using a monotonic stack in O(n).
difficulty: Advanced
position: 2
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — algs4 booksite, Stacks and Queues"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "Largest Rectangle in Histogram — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/largest-rectangle-under-histogram/"
    type: blog
  - title: "TheAlgorithms/Python — largest_rectangle_histogram.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/stacks/largest_rectangle_histogram.py"
    type: repo
status: published
---

## intro
Given heights[0..n-1] representing bar heights of width 1, return the area of the largest axis-aligned rectangle that fits entirely under the histogram. The optimal solution uses a monotonic increasing stack and runs in O(n). It is the gateway problem to "Maximal Rectangle in a 0/1 matrix," which simply runs this routine once per row.

## whyItMatters
The same technique computes per-element "span" left and right, which appears in volatility windows, skyline silhouettes, max-area submatrix, and 2D image segmentation. Recruiters use this problem as a stress test for two skills: spotting that "for each bar, find left and right boundaries where it remains the minimum" is the right reformulation, and recognizing that the monotonic stack computes both boundaries in one pass.

## intuition
For each bar h[i] consider the largest rectangle that uses h[i] as its shortest bar. That rectangle extends left to the first index with a strictly smaller height and right to the same on the other side. Width is right - left - 1, area is h[i] * width. A monotonic increasing stack of indices computes both boundaries while scanning left to right: when a shorter bar arrives, we pop, and the popped bar's right boundary is the current index, while its left boundary is the new stack top.

## visualization
heights = [2, 1, 5, 6, 2, 3]. Push 0(h=2). At i=1 (h=1), pop 0: width = 1-(-1)-1 = 1, area = 2. Push 1. Push 2(5). Push 3(6). At i=4 (h=2), pop 3: width = 4-2-1 = 1, area = 6. Pop 2: width = 4-1-1 = 2, area = 10. Push 4. Push 5(3). Flush with sentinel i=6 (h=0): pop 5: width = 6-4-1 = 1, area = 3. Pop 4: width = 6-1-1 = 4, area = 8. Pop 1: width = 6-(-1)-1 = 6, area = 6. Max = 10.

## bruteForce
Two nested loops: for each pair (l, r), compute the minimum height in heights[l..r] and the candidate area (r - l + 1) * min. O(n^2) with running min, O(n^3) without. A divide-and-conquer variant finds the global minimum and recurses on left and right segments, giving O(n log n) average but O(n^2) worst case on sorted input.

## optimal
Maintain a stack of indices with strictly increasing heights. For each new index i (including a sentinel i = n with height 0 to flush the stack), while the stack is non-empty and heights[top] >= heights[i]: pop the top, compute its rectangle with right boundary i and left boundary the new stack top (or -1 if empty), update the answer. Then push i. Each index is pushed and popped at most once, giving amortized O(1) work per bar.

## complexity
time: O(n)
space: O(n) for the index stack
notes: The sentinel trick — pretending heights[n] = 0 — removes the post-loop flush and shortens the code. Use a wide enough integer type for area when bar heights and widths can each reach 10^5.

## pitfalls
- Forgetting the sentinel flush — the largest rectangle may straddle the last bar and stay on the stack.
- Using >= vs > when popping — both work for area, but > can leave duplicate heights on the stack and cost an extra pass.
- Mixing up "stack stores indices" with "stack stores heights" — distance math needs indices.
- Integer overflow in C++/Java when areas exceed 2^31 — use long.

## interviewTips
- Frame it as "for each bar, find left and right strictly-smaller bars" — that re-statement unlocks the stack approach.
- Be ready to extend to "Maximal Rectangle in a 0/1 matrix": for each row, accumulate column heights and call this routine. O(rows * cols).
- Walk through the example with the stack drawn on the side; this problem is hard to follow without a visual.

## code.python
```python
def largest_rectangle(heights):
    stack = []
    best = 0
    n = len(heights)
    for i in range(n + 1):
        cur = 0 if i == n else heights[i]
        while stack and heights[stack[-1]] >= cur:
            h = heights[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, h * (i - left - 1))
        stack.append(i)
    return best
```

## code.javascript
```javascript
function largestRectangle(heights) {
  const stack = [];
  let best = 0;
  const n = heights.length;
  for (let i = 0; i <= n; i++) {
    const cur = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= cur) {
      const h = heights[stack.pop()];
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, h * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}
```

## code.java
```java
public int largestRectangle(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int best = 0;
    int n = heights.length;
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : heights[i];
        while (!stack.isEmpty() && heights[stack.peek()] >= cur) {
            int h = heights[stack.pop()];
            int left = stack.isEmpty() ? -1 : stack.peek();
            best = Math.max(best, h * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}
```

## code.cpp
```cpp
int largestRectangle(vector<int>& heights) {
    stack<int> st;
    long long best = 0;
    int n = heights.size();
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : heights[i];
        while (!st.empty() && heights[st.top()] >= cur) {
            int h = heights[st.top()]; st.pop();
            int left = st.empty() ? -1 : st.top();
            best = max(best, (long long)h * (i - left - 1));
        }
        st.push(i);
    }
    return (int)best;
}
```
