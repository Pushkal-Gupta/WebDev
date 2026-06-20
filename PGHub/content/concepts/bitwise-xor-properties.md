---
slug: bitwise-xor-properties
module: bitwise
title: XOR Properties and Classic Tricks
subtitle: Commutativity, self-inverse, and the single-number family
difficulty: Beginner
position: 55
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "Bitwise operators"
    url: "https://cp-algorithms.com/algebra/bit-manipulation.html"
    type: blog
  - title: "TheAlgorithms/Python"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
XOR is the most under-appreciated operator in interviews. Its four algebraic properties — `x ^ x = 0`, `x ^ 0 = x`, commutativity, and associativity — combine into a swiss-army knife: swap two variables without a temp, find the unique element in an array where every other element repeats, locate a missing number in `0..n`, and detect odd-occurrence elements in O(n) time and O(1) space.

## whyItMatters
- XOR tricks turn O(n) space hash-set solutions into O(1) constant-space wins, which is the gap between "solved" and "optimal" in a senior interview.
- Many bit-manipulation rounds at Google, Apple, and Bloomberg use a missing/duplicate variation as a warm-up filter.
- Understanding the underlying group structure (XOR forms an abelian group over GF(2)^k) clarifies why these tricks work, which protects you when an interviewer adds a twist (two unique elements, three-times repeats, etc.).
- The same algebra underpins parity bits, hashing, Gray codes, and RAID storage.

## intuition
XOR is bitwise addition modulo 2. For each bit position the result is `1` if and only if an odd number of operands have that bit set. From this single rule four useful facts fall out: any value XORed with itself produces `0` because every bit appears twice (even parity); any value XORed with `0` is unchanged because zero contributes no bits; the order of operations does not matter because XOR is commutative and associative. Put these together and `a ^ b ^ a = b`. So if you XOR every element of an array where each value appears twice except one, the duplicates annihilate in pairs and only the unique value survives. For the swap trick, `a = a ^ b; b = a ^ b; a = a ^ b` works because after the first step `a` holds the combined parity, then assigning it back to `b` cancels the original `b`, recovering the original `a`. The missing-number variant XORs all indices `0..n` against all array values; the matching pairs cancel and only the missing index remains. The same algebra extends to range XOR with prefix arrays: `prefix[r+1] ^ prefix[l]` returns the XOR over `[l..r]` because the common prefix self-cancels. Once you see XOR as a parity sum it stops feeling magical and starts feeling like arithmetic.

## visualization
```
arr = [4, 1, 2, 1, 2]

step 0: acc = 0
step 1: acc = 0 ^ 4 = 0100
step 2: acc = 0100 ^ 0001 = 0101
step 3: acc = 0101 ^ 0010 = 0111
step 4: acc = 0111 ^ 0001 = 0110
step 5: acc = 0110 ^ 0010 = 0100  -> 4 (unique)

Missing in [0,1,3]:
acc = 0^0 ^ 1^1 ^ 2 ^ 3^3 = 2   (index 2 is missing)
```

## bruteForce
The naive single-number solver builds a hash map counting occurrences then scans for the count of 1. That works in O(n) time but uses O(n) auxiliary space. For "missing number" the naive route sorts the array (O(n log n)) or builds a boolean presence array of size n+1 (O(n) space). The swap-by-XOR trick is normally compared against the temp-variable swap, which uses one extra word but is simpler to read. The XOR alternatives keep the O(n) time and drop space to O(1).

## optimal
Read the input once, accumulate a single running XOR, and return it. That is the entire algorithm for the classic single-number problem. For the missing-number problem, fold both the indices `0..n` and the array values into the same accumulator; every present value cancels with its index, leaving the missing index. For the two-unique-elements variant (every value appears twice except two distinct values `a` and `b`), the total XOR equals `a ^ b`, which is nonzero somewhere; isolate any set bit using `diff & -diff` and partition the array on that bit. The two unique values fall into different buckets because that bit differs between them, so XORing each bucket independently recovers `a` and `b`. For three-times repeats, count the number of `1` bits at each position modulo 3; positions where the count is nonzero modulo 3 belong to the unique value. Each pattern leans on the same insight — XOR is parity, parity ignores even multiplicities, and you can recover information about specific bits by masking. Range XOR uses a prefix-XOR array: `prefix[i] = a[0] ^ a[1] ^ ... ^ a[i-1]`, then `query(l, r) = prefix[r+1] ^ prefix[l]`. Building the prefix is O(n); each query is O(1). These tricks are workhorses; mastering them earns you the right to pivot the conversation from "can I solve this?" to "what variant should we discuss?"

## complexity
- **Time:** O(n) for a single pass.
- **Space:** O(1) extra beyond the accumulator.

## pitfalls
- **Forgetting the identity element.** Initializing the accumulator with anything other than `0` corrupts the result. Fix: always start with `acc = 0`.
- **Mixing index and value XOR carelessly.** For missing-number, you must XOR `n` as well or you will miss the upper bound. Fix: loop `i in 0..=n` and XOR both `i` and the element when `i < n`.
- **Self-swap via XOR.** `a ^= b; b ^= a; a ^= b` zeroes both variables if `&a == &b` (same memory). Fix: guard with `if i != j` when swapping array slots.
- **Assuming XOR isolates the smallest difference.** `a ^ b` only marks bit positions where `a` and `b` differ; do not conclude anything about magnitude. Fix: use `diff & -diff` to grab one such bit before partitioning.

## interviewTips
- Open by stating the four XOR identities out loud before coding; it signals you know *why* the trick works.
- For "find two unique values," walk the interviewer through the partition step explicitly — most candidates conflate it with the single-number version.
- Mention prefix-XOR for range queries even if not asked; it is a natural follow-up that buys time and shows breadth.

## code.python
```python
def single_number(nums: list[int]) -> int:
    acc = 0
    for x in nums:
        acc ^= x
    return acc

def missing_number(nums: list[int]) -> int:
    acc = len(nums)
    for i, x in enumerate(nums):
        acc ^= i ^ x
    return acc

def two_unique(nums: list[int]) -> tuple[int, int]:
    diff = 0
    for x in nums:
        diff ^= x
    bit = diff & -diff
    a = b = 0
    for x in nums:
        if x & bit:
            a ^= x
        else:
            b ^= x
    return a, b
```

## code.javascript
```javascript
function singleNumber(nums) {
  let acc = 0;
  for (const x of nums) acc ^= x;
  return acc;
}

function missingNumber(nums) {
  let acc = nums.length;
  for (let i = 0; i < nums.length; i++) acc ^= i ^ nums[i];
  return acc;
}

function twoUnique(nums) {
  let diff = 0;
  for (const x of nums) diff ^= x;
  const bit = diff & -diff;
  let a = 0, b = 0;
  for (const x of nums) {
    if (x & bit) a ^= x;
    else b ^= x;
  }
  return [a, b];
}
```

## code.java
```java
class XorTricks {
    public int singleNumber(int[] nums) {
        int acc = 0;
        for (int x : nums) acc ^= x;
        return acc;
    }

    public int missingNumber(int[] nums) {
        int acc = nums.length;
        for (int i = 0; i < nums.length; i++) acc ^= i ^ nums[i];
        return acc;
    }

    public int[] twoUnique(int[] nums) {
        int diff = 0;
        for (int x : nums) diff ^= x;
        int bit = diff & -diff;
        int a = 0, b = 0;
        for (int x : nums) {
            if ((x & bit) != 0) a ^= x;
            else b ^= x;
        }
        return new int[]{a, b};
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <utility>
using namespace std;

int singleNumber(const vector<int>& nums) {
    int acc = 0;
    for (int x : nums) acc ^= x;
    return acc;
}

int missingNumber(const vector<int>& nums) {
    int acc = (int)nums.size();
    for (int i = 0; i < (int)nums.size(); ++i) acc ^= i ^ nums[i];
    return acc;
}

pair<int,int> twoUnique(const vector<int>& nums) {
    int diff = 0;
    for (int x : nums) diff ^= x;
    int bit = diff & -diff;
    int a = 0, b = 0;
    for (int x : nums) {
        if (x & bit) a ^= x;
        else b ^= x;
    }
    return {a, b};
}
```
