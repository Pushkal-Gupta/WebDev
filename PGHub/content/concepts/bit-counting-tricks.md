---
slug: bit-counting-tricks
module: bitwise
title: Bit Counting Tricks
subtitle: Count, isolate, and clear bits with branchless one-liners — popcount, lowest-set-bit, n & (n-1).
difficulty: Intermediate
position: 16
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sean Eron Anderson — Bit Twiddling Hacks (Stanford)"
    url: "https://graphics.stanford.edu/~seander/bithacks.html"
    type: book
  - title: "GeeksforGeeks — Count set bits in an integer"
    url: "https://www.geeksforgeeks.org/count-set-bits-in-an-integer/"
    type: blog
  - title: "TheAlgorithms/Python — bit_manipulation"
    url: "https://github.com/TheAlgorithms/Python/tree/master/bit_manipulation"
    type: repo
status: published
---

## intro
Beyond XOR, a handful of one-line bit tricks come up constantly in interviews and systems code:
- **`n & (n - 1)`** — clears the lowest set bit.
- **`n & -n`** — isolates the lowest set bit.
- **`popcount(n)`** — counts set bits.
- **`__builtin_clz / ctz`** — leading / trailing zero count.

Knowing these turns 5-line loops into one-liners.

## whyItMatters
Direct uses:
- **Count set bits** (Hamming weight, popcount) — O(set_bits) via `n & (n-1)`.
- **Iterate subsets of a mask** — `sub = (sub - 1) & mask` walks all sub-bitmasks in O(3^n) total.
- **Detect power of two**: `(n > 0) && (n & (n-1)) == 0`.
- **Isolate / extract individual bits** for Fenwick tree's `i & -i`, bitmask DP transitions.
- **Find next-larger permutation with same popcount** (Gosper's hack) — combinatorics + bit-DP.

Used inside every Fenwick tree, every bitmask DP, every chess engine, every bloom filter, every database engine that operates on packed bitmaps.

## intuition
- `n - 1` flips the lowest set bit to 0 and every bit below it from 0 to 1. ANDing with n keeps only the unchanged higher bits.
- `-n` in two's complement = `~n + 1`, which is "flip all bits, add 1." The lowest set bit ends up as the only common bit between n and -n.

These flow from how two's complement is defined; no magic.

## visualization
```
n = 0b1101_1000      (decimal 216)

n - 1   = 0b1101_0111
n & (n-1) = 0b1101_0000  ← lowest set bit (bit 3) cleared

-n      = 0b0010_1000  (in 8-bit two's complement)
n & -n  = 0b0000_1000  ← lowest set bit isolated

popcount: keep clearing the lowest set bit until n = 0:
  216  → 0b1101_1000  count=0
  208  → 0b1101_0000  count=1
  192  → 0b1100_0000  count=2
  128  → 0b1000_0000  count=3
    0                  count=4
```

## bruteForce
Count set bits by iterating each bit position: O(32) or O(64). Always works, but Brian Kernighan's trick (`n & (n-1)`) runs in O(popcount) — usually much faster.

## optimal
**Popcount (Kernighan)**:
```
count = 0
while n:
    n &= n - 1   # clear lowest set bit
    count += 1
```

**Iterate subsets of a mask**:
```
sub = mask
while sub > 0:
    process(sub)
    sub = (sub - 1) & mask
process(0)
```
Total iterations across all masks: 3^n. Useful for "for each subset of S, also iterate its subsets."

**Power of two check**: `(n > 0) && ((n & (n - 1)) == 0)`.

**Lowest set bit**: `n & -n` returns just that bit. Useful for Fenwick tree `i += i & -i`.

**Highest set bit (clz)**: `31 - __builtin_clz(n)` (C++/GCC), `Integer.numberOfLeadingZeros` (Java).

**Count trailing zeros (ctz)**: `__builtin_ctz(n)` — position of lowest set bit as an integer.

**Gosper's hack** — next number with same popcount:
```
c = n & -n
r = n + c
next = (((r ^ n) >> 2) / c) | r
```
Used in iterating all length-k subsets in lexicographic order over an n-bit field.

## complexity
- All one-liners: O(1).
- Kernighan popcount: O(popcount) = O(set bits), faster than O(bits).
- Subset iteration: O(3^n) across all masks.
- Hardware `popcnt` instruction (SSE4.2+): true O(1) — use compiler intrinsics or `bin(n).count('1')` (Python) which is C-level fast.

## pitfalls
- **Signed-overflow on negate**: `-INT_MIN` overflows in two's complement. Cast to unsigned: `(unsigned)n & -(unsigned)n`.
- **JavaScript bit ops are 32-bit signed**: `n | 0`, `n & -n` work only up to 2^31 - 1. Use `BigInt` if you need 64-bit bit tricks.
- **Off-by-one in Gosper's hack**: many editorial versions have subtle bugs. Use a well-tested implementation.
- **Confusing `n & (n - 1)` (clear lowest bit) with `n & (n + 1)` (clear lowest run of 1-bits)**: different identities — pay attention.
- **Python's arbitrary-precision integers**: no overflow but bit ops can be slow on huge n. Use `int.bit_count()` (3.10+) instead of hand-rolled popcount.

## interviewTips
- For "count set bits" — Kernighan's `n & (n-1)` loop is the canonical answer.
- For "is this a power of two" — `(n > 0) && (n & (n-1)) == 0`.
- Mention `i & -i` when talking about Fenwick / BIT internals.
- For senior interviews, walk through Gosper's hack as a subset-iteration tool.

## code.python
```python
def popcount(n):
    c = 0
    while n:
        n &= n - 1
        c += 1
    return c

def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

def lowest_set_bit(n):
    return n & -n

# Iterate subsets of mask=0b1011
mask = 0b1011
sub = mask
subsets = []
while sub > 0:
    subsets.append(bin(sub))
    sub = (sub - 1) & mask
subsets.append(bin(0))
print(subsets)
# In Python 3.10+: n.bit_count() does this with hardware popcnt.
print((0b1101_1000).bit_count())   # 4
```

## code.javascript
```javascript
function popcount(n) {
  let c = 0;
  while (n) { n &= n - 1; c++; }
  return c;
}
function isPowerOfTwo(n) { return n > 0 && (n & (n - 1)) === 0; }
function lowestSetBit(n) { return n & -n; }
```

## code.java
```java
class BitTricks {
    static int popcount(int n) { return Integer.bitCount(n); }   // HW popcnt
    static boolean isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }
    static int lowestSetBit(int n) { return n & -n; }
}
```

## code.cpp
```cpp
#include <bit>
int popcount(unsigned n) { return std::popcount(n); }  // C++20 HW popcnt
bool isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }
int lowestSetBit(int n) { return n & -n; }
```
