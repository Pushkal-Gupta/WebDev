---
slug: xor-tricks
module: bitwise
title: XOR Tricks
subtitle: The toolbox of bitwise XOR patterns — single number, swap without temp, find missing, partitioned bitmasks.
difficulty: Intermediate
position: 15
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Hacker's Delight (Warren)"
    url: ""
status: published
---

## intro
XOR (`^`) has three properties that turn it into a Swiss army knife: `a ^ a = 0`, `a ^ 0 = a`, and it's commutative + associative. Together they let you cancel duplicates, swap values without a temporary, find missing elements in O(1) extra space, and partition arrays in clever ways. Interview problems lean on these so hard that XOR tricks deserve their own concept page.

## whyItMatters
A handful of "single number," "missing number," "swap without temp," "find the two non-duplicates" problems all collapse to a few lines once you see the XOR pattern. Outside coding interviews: error detection (parity bits, CRC), cheap one-time pad encryption, image masks in graphics, hash mixing in fast PRNGs.

## intuition
- `a ^ a = 0` — anything XOR'd with itself cancels.
- `a ^ 0 = a` — XOR with zero is identity.
- Commutative + associative — `(a ^ b) ^ c = a ^ (b ^ c)`.

If you XOR every element of an array, all the duplicated values cancel pairwise to 0, leaving only the elements that appeared an odd number of times.

## visualization
```
[4, 1, 2, 1, 2]  XOR all:
  0 ^ 4 = 4
  4 ^ 1 = 5
  5 ^ 2 = 7
  7 ^ 1 = 6
  6 ^ 2 = 4   ← the single non-duplicate

[3, 5, 4, 3, 5, 7, 4]  XOR all → 7
```

## bruteForce
For "find the single number in an array where every other element appears twice": use a hash set or counter. O(n) time, O(n) space. The XOR approach hits O(n) time, O(1) space.

## optimal
### Trick 1 — Single number in an array of pairs
```
result = 0
for x in arr: result ^= x
return result
```
All pairs cancel, leaving the singleton.

### Trick 2 — Two non-duplicates (every other appears twice)
```
xor_all = 0
for x in arr: xor_all ^= x      # = a ^ b for the two singletons a, b
bit = xor_all & -xor_all        # isolate lowest set bit — bit where a, b differ
a = b = 0
for x in arr:
    if x & bit: a ^= x
    else:       b ^= x
return [a, b]
```

### Trick 3 — Missing number from 0..n
```
result = n
for i, x in enumerate(arr): result ^= i ^ x
return result
```

### Trick 4 — Swap without temp
```
a ^= b
b ^= a       # b is now original a
a ^= b       # a is now original b
```
(Don't actually do this — modern compilers don't gain anything and it confuses readers. Memorize because interviewers ask.)

### Trick 5 — Count differing bits between two ints (Hamming distance)
```
return popcount(a ^ b)
```

### Trick 6 — Subset XOR sum
For all 2^n subsets, sum of XORs simplifies via per-bit linearity. Each bit contributes `(set bit count) * 2^(n-1) * 2^bit_pos` when n ≥ 1.

## complexity
All tricks above: **O(n) time, O(1) extra space** (assuming int-sized XOR).

## pitfalls
- **Different element counts**: "single number" trick assumes every other appears exactly twice. For "appears 3 times," use bitwise tally with mod 3 — different algorithm.
- **Negative numbers in 2's-complement languages**: XOR works fine but be careful with `>>` (use unsigned shift `>>>` in Java/JS).
- **XOR swap on the same variable**: `a ^= a` zeroes it. Always check the pointers differ first.
- **Confusing XOR with OR/AND**: only XOR has the self-cancel property.

## interviewTips
- The instant the problem says "every element appears twice except one" or "find the missing number" — reach for XOR.
- State the three core properties before writing code: `a^a=0`, `a^0=a`, commutativity.
- For "two non-duplicates," walk through the lowest-set-bit partition trick — it's the elegant payoff.
- For senior interviews, mention **XOR + prefix sum trick**: prefix XOR array gives subarray XOR in O(1) per query.

## code.python
```python
def single_number(nums):
    r = 0
    for x in nums: r ^= x
    return r

def two_non_dupes(nums):
    xor_all = 0
    for x in nums: xor_all ^= x
    bit = xor_all & -xor_all
    a = b = 0
    for x in nums:
        if x & bit: a ^= x
        else:       b ^= x
    return [a, b]

def missing_number(nums):
    r = len(nums)
    for i, x in enumerate(nums): r ^= i ^ x
    return r

print(single_number([4, 1, 2, 1, 2]))          # 4
print(two_non_dupes([1, 2, 1, 3, 2, 5]))       # [3, 5] in some order
print(missing_number([3, 0, 1]))                # 2
```

## code.javascript
```javascript
function singleNumber(nums) { let r = 0; for (const x of nums) r ^= x; return r; }
function twoNonDupes(nums) {
  let xorAll = 0;
  for (const x of nums) xorAll ^= x;
  const bit = xorAll & -xorAll;
  let a = 0, b = 0;
  for (const x of nums) (x & bit) ? a ^= x : b ^= x;
  return [a, b];
}
function missingNumber(nums) {
  let r = nums.length;
  for (let i = 0; i < nums.length; i++) r ^= i ^ nums[i];
  return r;
}
```

## code.java
```java
class XorTricks {
    static int singleNumber(int[] nums) { int r = 0; for (int x : nums) r ^= x; return r; }
    static int[] twoNonDupes(int[] nums) {
        int xorAll = 0;
        for (int x : nums) xorAll ^= x;
        int bit = xorAll & -xorAll;
        int a = 0, b = 0;
        for (int x : nums) if ((x & bit) != 0) a ^= x; else b ^= x;
        return new int[]{ a, b };
    }
    static int missingNumber(int[] nums) {
        int r = nums.length;
        for (int i = 0; i < nums.length; i++) r ^= i ^ nums[i];
        return r;
    }
}
```

## code.cpp
```cpp
#include <vector>
int singleNumber(const std::vector<int>& nums) {
    int r = 0; for (int x : nums) r ^= x; return r;
}
std::vector<int> twoNonDupes(const std::vector<int>& nums) {
    int xorAll = 0;
    for (int x : nums) xorAll ^= x;
    int bit = xorAll & -xorAll;
    int a = 0, b = 0;
    for (int x : nums) (x & bit) ? a ^= x : b ^= x;
    return { a, b };
}
int missingNumber(const std::vector<int>& nums) {
    int r = nums.size();
    for (size_t i = 0; i < nums.size(); i++) r ^= i ^ nums[i];
    return r;
}
```
