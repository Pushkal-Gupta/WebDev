---
slug: array-rotate-three-reverse
module: arrays-searching
title: Rotate Array via Three Reverses
subtitle: Right-rotate by k in O(n) time and O(1) extra space using a clever reversal trick.
difficulty: Beginner
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — algs4 booksite, Elementary Sorts"
    url: "https://algs4.cs.princeton.edu/21elementary/"
    type: book
  - title: "Array Rotation — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/program-for-array-rotation/"
    type: blog
  - title: "TheAlgorithms/Python — rotation.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/permutation_and_combination.py"
    type: repo
status: published
---

## intro
Given an array of length n, rotate it to the right by k positions. The last k elements should wrap to the front, and the rest should shift right. The challenge is to do it in O(n) time without allocating a second array — a classic interview probe for "can you think in transformations rather than copies?"

## whyItMatters
Rotation appears under many disguises: shifting a ring buffer, aligning sliding-window indices, decoding Caesar ciphers, rebalancing time-series windows. The three-reverse trick is the smallest-code, smallest-memory answer and demonstrates the broader pattern: many array problems become trivial once you allow reversing subranges as a primitive operation.

## intuition
A right rotation by k splits the array into two blocks: the prefix of length n - k and the suffix of length k. After rotation the suffix appears first, then the prefix. Reversing the whole array swaps their positions but corrupts internal order. Reversing each block individually un-corrupts them. So: reverse whole, reverse first k, reverse last n - k. Three linear passes, no extra memory.

## visualization
Start: [1,2,3,4,5,6,7], k=3. Reverse whole: [7,6,5,4,3,2,1]. Reverse first 3: [5,6,7,4,3,2,1]. Reverse last 4: [5,6,7,1,2,3,4]. Done. The suffix {5,6,7} now leads, the prefix {1,2,3,4} follows, each in original order — exactly a right rotation by 3.

## bruteForce
Allocate a second array of length n. For each index i in the original, write to position (i + k) mod n in the copy. Then copy back. O(n) time, O(n) space. Or, even slower, shift the array right by one and repeat k times — O(n * k) time. Both work; neither is the interview answer.

## optimal
Normalize k with `k = k mod n` to handle k larger than n. Then call reverse on three ranges: [0, n-1], [0, k-1], [k, n-1]. Each reverse is in-place with two index pointers, costing O(range-length) swaps. Total swaps add up to n, giving O(n) time and O(1) extra space. The technique generalizes: left rotation by k uses the same three reverses with the split points swapped.

## complexity
time: O(n)
space: O(1)
notes: Each element is swapped at most twice across the three reverses. The cyclic-replacement variant achieves the same bounds with exactly n writes but is trickier to get right when gcd(n, k) is not 1.

## pitfalls
- Skipping the `k = k mod n` normalization — large k blows past array bounds.
- Confusing right rotation with left rotation; the three ranges differ.
- Off-by-one in the reverse ranges (using k vs k-1) — write the boundary cases on paper first.
- Mutating the input when the prompt says "return a rotated copy" — clone first if required.

## interviewTips
- Call out the trade-off: cyclic replacement uses n writes flat but is harder to explain; three-reverse uses ~2n swaps but is one-liner clear.
- Have the visualization ready — drawing one example often convinces the interviewer faster than the proof.
- Mention that the same trick yields O(1)-space "swap halves of an array" by reversing each half and the whole.

## code.python
```python
def rotate(nums, k):
    n = len(nums)
    k %= n
    def rev(l, r):
        while l < r:
            nums[l], nums[r] = nums[r], nums[l]
            l += 1
            r -= 1
    rev(0, n - 1)
    rev(0, k - 1)
    rev(k, n - 1)
```

## code.javascript
```javascript
function rotate(nums, k) {
  const n = nums.length;
  k = ((k % n) + n) % n;
  const rev = (l, r) => {
    while (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
  };
  rev(0, n - 1);
  rev(0, k - 1);
  rev(k, n - 1);
}
```

## code.java
```java
public void rotate(int[] nums, int k) {
    int n = nums.length;
    k = ((k % n) + n) % n;
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
}

private void reverse(int[] a, int l, int r) {
    while (l < r) {
        int t = a[l]; a[l] = a[r]; a[r] = t;
        l++; r--;
    }
}
```

## code.cpp
```cpp
void rotate(vector<int>& nums, int k) {
    int n = nums.size();
    k = ((k % n) + n) % n;
    reverse(nums.begin(), nums.end());
    reverse(nums.begin(), nums.begin() + k);
    reverse(nums.begin() + k, nums.end());
}
```
