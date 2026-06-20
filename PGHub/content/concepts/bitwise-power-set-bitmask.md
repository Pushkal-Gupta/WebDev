---
slug: bitwise-power-set-bitmask
module: bitwise
title: Power Set via Bitmask
subtitle: Enumerate every subset of n elements by counting 0..2^n-1 and reading the bits.
difficulty: Beginner
position: 52
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 11: Hash Tables (subset patterns)"
    url: "https://walkccc.me/CLRS/Chap11/11.1/"
    type: book
  - title: "Power Set — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/power-set/"
    type: blog
  - title: "TheAlgorithms/Python — power_set.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/power_set.py"
    type: repo
status: published
---

## intro
The power set of an n-element collection has exactly 2^n subsets. The bitmask trick maps each integer i in 0..2^n-1 onto a unique subset by treating the j-th bit of i as "is element j included?" It replaces backtracking, recursion, and stack juggling with a single nested loop and gives you the canonical lexicographic order for free.

## whyItMatters
- Bitmask DP powers exact TSP solvers in OR-Tools (Google's optimization library), routing engines at Uber and DoorDash, and the assignment DP behind Pixar's RenderMan task scheduler.
- Subset-sum and meet-in-the-middle enumeration in factoring algorithms (used in CADO-NFS and Msieve) iterate every subset via bitmask exactly this way.
- Feature-flag combination sweeps at Stripe, LaunchDarkly, and Optimizely test 2^n configuration matrices by walking masks 0..2^n-1.
- SAT solvers (MiniSat, CryptoMiniSat, Glucose) use bitmask enumeration for small clauses during preprocessing; CP-SAT in OR-Tools does it for symmetry breaking.
- Once n is small (typically <= 20), bitmask enumeration is the fastest practical form and the easiest to debug — no recursion frames to step through, just integers.

## intuition
There are exactly 2^n subsets of an n-element set, and they happen to be in bijection with the n-bit binary numbers 0 through 2^n - 1. The bijection is so direct that it is almost a definition: read bit j of the integer i as "is element j a member of subset number i?" Bit 0 toggles the first element, bit 1 toggles the second, and so on. Because every integer from 0 to 2^n - 1 has a unique binary representation, the mapping is one-to-one and onto — each integer names a distinct subset, and every subset corresponds to exactly one integer. So enumerating subsets reduces to counting, which is the simplest control flow available. Compare this to the alternative recursive include/exclude tree: at each level you decide "include element j?" with two branches, yielding 2^n leaves. The recursion is correct but pays one function-call frame per node (about 2^(n+1) calls) and consumes O(n) stack depth. The bitmask form pushes all that bookkeeping into the bits of a single integer that the CPU already increments for free. As a bonus, the enumeration order is lexicographic by membership, which is often exactly the order tests expect. The pattern generalizes to "iterate submasks of a fixed mask m" via the `s = (s - 1) & m` trick — the cornerstone of bitmask DP on partitions and subset-sum-with-constraints.

## visualization
```
nums = [a, b, c],  n = 3,  iterate i = 0..7
i = 0  bits 000  -> { }
i = 1  bits 001  -> { a }
i = 2  bits 010  -> { b }
i = 3  bits 011  -> { a, b }
i = 4  bits 100  -> { c }
i = 5  bits 101  -> { a, c }
i = 6  bits 110  -> { b, c }
i = 7  bits 111  -> { a, b, c }
Bit j set in i  <=>  element nums[j] is in the subset.
```

## bruteForce
A recursive include/exclude tree generates the same 2^n subsets but pays a function-call overhead per node (2^(n+1) calls) and uses O(n) stack space. For n = 20 that's roughly two million calls — fine, but on tight loops the bitmask version is several times faster and has zero stack risk.

## optimal
Outer loop counts `mask` from 0 to `(1 << n) - 1`. Inner loop inspects each bit position `j` and includes `nums[j]` when bit `j` of `mask` is set. Total work is O(n * 2^n), which is optimal because the output itself has 2^n subsets totaling that many element references. If you only need to operate on masks (DP, counting, sum), skip materialization and key your table directly on the integer — that drops the inner loop entirely for many uses.

```python
def power_set(nums):
    n = len(nums)
    out = []
    for mask in range(1 << n):                  # 2^n subsets, lex order by membership
        subset = [nums[j] for j in range(n) if mask & (1 << j)]
        out.append(subset)
    return out

def iterate_submasks(m):
    """Walk every submask of m, including 0, in O(3^n) total across all m."""
    s = m
    while s:
        yield s
        s = (s - 1) & m                         # cornerstone trick for bitmask DP
    yield 0
```

The `mask & (1 << j)` check compiles to a single CPU instruction. The `(s - 1) & m` submask trick is the deeper move — across all masks m of an n-bit universe, total submask iterations sum to 3^n, not 4^n, because every pair (mask, submask) corresponds to a unique element being "in mask, in submask," "in mask, not in submask," or "not in mask."

## complexity
- **Time:** O(n * 2^n) to materialize all subsets (each subset takes up to n work)
- **Space:** O(n * 2^n) for the output, O(1) auxiliary if you stream instead of store

## pitfalls
- Using `1 << n` when n could be 31 or more — in 32-bit ints that overflows. Cast to long, or guard.
- Confusing bit j with element index n - 1 - j; pick a convention and stick to it.
- Iterating subsets of a specific mask m with `i = 0..2^n` when you only want submasks of m — use the `for (s = m; s; s = (s - 1) & m)` trick instead.
- Materializing subsets with string concatenation in inner loops — kills performance for n > 16.

## interviewTips
- Say upfront: "n is small, so I will enumerate with bitmasks in O(n * 2^n)." It signals fluency.
- Mention the submask iteration trick — it shows up in bitmask DP and assignment problems.
- If interviewer asks for memory savings, note that you can yield subsets one at a time rather than storing all 2^n.

## code.python
```python
def power_set(nums):
    n = len(nums)
    out = []
    for mask in range(1 << n):
        subset = [nums[j] for j in range(n) if mask & (1 << j)]
        out.append(subset)
    return out

def iterate_submasks(m):
    s = m
    while s:
        yield s
        s = (s - 1) & m
    yield 0
```

## code.javascript
```javascript
function powerSet(nums) {
  const n = nums.length;
  const out = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let j = 0; j < n; j++) {
      if (mask & (1 << j)) subset.push(nums[j]);
    }
    out.push(subset);
  }
  return out;
}
```

## code.java
```java
public List<List<Integer>> powerSet(int[] nums) {
    int n = nums.length;
    List<List<Integer>> out = new ArrayList<>(1 << n);
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int j = 0; j < n; j++) {
            if ((mask & (1 << j)) != 0) subset.add(nums[j]);
        }
        out.add(subset);
    }
    return out;
}
```

## code.cpp
```cpp
vector<vector<int>> powerSet(vector<int>& nums) {
    int n = nums.size();
    vector<vector<int>> out;
    out.reserve(1 << n);
    for (int mask = 0; mask < (1 << n); mask++) {
        vector<int> subset;
        for (int j = 0; j < n; j++) {
            if (mask & (1 << j)) subset.push_back(nums[j]);
        }
        out.push_back(move(subset));
    }
    return out;
}
```
