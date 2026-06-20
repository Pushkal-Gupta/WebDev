---
slug: bitwise-bit-manipulation-tricks
module: bitwise
title: Bit-Manipulation Cookbook
subtitle: A reference of bit hacks every interviewer asks about
difficulty: Intermediate
position: 54
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Introduction to Algorithms (CLRS)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "Bit manipulation"
    url: "https://cp-algorithms.com/algebra/bit-manipulation.html"
    type: blog
  - title: "TheAlgorithms/Python"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Bit manipulation turns expensive arithmetic into a few processor instructions. Once you internalize a small cookbook of patterns (set, clear, toggle, isolate-lowest, count, parity, swap-without-temp, xor-trick) you can recognize them at sight inside larger problems like subset enumeration, deduplication, and bitmask DP.

## whyItMatters
- Bit tricks unlock O(1) operations that would otherwise need loops.
- They are the foundation of bitmask DP, Bloom filters, hash maps, and compression.
- Interviewers love them because they reveal whether you actually understand binary representation.

## intuition
Think of an integer as a fixed-length array of switches. Every bit operator is either reading, flipping, or asking a question about one switch. The whole cookbook reduces to four primitives applied to a chosen mask `1 << i`: set with OR, clear with AND of the complement, toggle with XOR, test with AND followed by a compare to zero. Once that is automatic, the more famous tricks fall out as combinations. The expression `x & (x - 1)` clears the lowest set bit because subtracting 1 borrows through the trailing zeros and lands exactly on the lowest 1, which the AND then erases. Repeatedly applying it gives Brian Kernighan's popcount, where the loop runs once per set bit instead of once per bit. The expression `x & -x` isolates the lowest set bit because the two's complement of `x` flips every bit above the lowest 1 and leaves the lowest 1 in place. XOR is its own inverse, so `a ^ b ^ b == a`; this is why you can swap two numbers in place and why XOR-sums solve the "find the unique element" family. Finally, parity, gray code, and subset enumeration all rely on the fact that incrementing a bitmask in a particular order touches each bit a predictable number of times. Build the mental table once, then translate problems into masks.

## visualization
```
x        = 0 1 1 0 1 0 1 0   (decimal 106)
x - 1    = 0 1 1 0 1 0 0 1
x & (x-1)= 0 1 1 0 1 0 0 0   lowest 1 cleared
-x       = 1 0 0 1 0 1 1 0   two's complement
x & -x   = 0 0 0 0 0 0 1 0   lowest 1 isolated
set bit 5:   x |  (1<<5)  -> 0 1 1 0 1 0 1 0
clear bit 3: x & ~(1<<3) -> 0 1 1 0 0 0 1 0
toggle bit 0:x ^  (1<<0) -> 0 1 1 0 1 0 1 1
test bit 6:  (x >> 6) & 1 -> 1
```

## bruteForce
Looping through every bit position to count, test, or flip works but is `O(b)` per operation where `b` is the word size. For popcount it visits 32 bits even when only two are set. For subset enumeration the naive approach builds lists of indices and then permutes, which is exponential in both time and allocation. None of this is wrong, just slow and noisy.

## optimal
The cookbook is a constant-size table you should memorize, then compose. Setting bit `i` is `x |= 1 << i`. Clearing is `x &= ~(1 << i)`. Toggling is `x ^= 1 << i`. Testing is `(x >> i) & 1`. Isolating the lowest set bit is `x & -x`; clearing it is `x &= x - 1`. Brian Kernighan's popcount keeps clearing the lowest set bit and increments a counter, running in `O(popcount(x))` time instead of `O(b)`. Hardware popcount instructions (`__builtin_popcount`, `Integer.bitCount`) are typically a single cycle and should be preferred when available. To check whether `x` is a power of two, use `x > 0 && (x & (x - 1)) == 0`. To round down to the previous power of two, repeatedly OR the value with right-shifted copies of itself to fill the low bits, then add one and shift right; equivalently use `1 << (31 - __builtin_clz(x))`. For subset enumeration of a mask `m`, the idiom `for (int s = m; s; s = (s - 1) & m)` walks every nonempty submask exactly once and totals `O(3^n)` across all masks of size `n`, which is the optimal cost. For XOR puzzles, remember that XOR is associative, commutative, and self-inverse, so any element appearing an even number of times cancels and the survivor reveals itself. For gray-code traversal, the `i`-th code is `i ^ (i >> 1)`; consecutive codes differ in exactly one bit, useful for Hamiltonian walks on the hypercube. Finally, when designing bitmask DP, fix the bit layout up front, write down what each bit means, and never mix conventions mid-problem.

## complexity
- **Time:** O(1) per primitive, O(popcount(x)) for Kernighan, O(3^n) for full submask iteration.
- **Space:** O(1) extra; masks fit in a single machine word for n <= 30.

## pitfalls
- **Signed shifts.** `1 << 31` overflows in Java/C++ signed `int`. Fix: use `1L << 31` or unsigned types when you need the top bit.
- **Operator precedence.** `x & 1 == 0` parses as `x & (1 == 0)`. Fix: always parenthesize: `(x & 1) == 0`.
- **Right shift of negative.** In C/C++ the result of `>>` on a negative is implementation-defined. Fix: cast to `unsigned` first, or use logical shift in JS (`>>>`).
- **Confusing mask sizes.** Using a 32-bit mask for 64-bit data silently truncates. Fix: pick the type explicitly (`uint64_t`, Python's arbitrary ints) and match every constant.
- **Iterating submasks the wrong way.** `for (int s = 0; s <= m; s++) if ((s & m) == s)` is `O(2^n)` per mask. Fix: use `s = (s - 1) & m`.

## interviewTips
- When a problem screams "find the one number" or "count differing bits", reach for XOR before anything else.
- For subset DP, the inner loop `s = (s - 1) & m` is the single line interviewers want to see.
- Always state the bit-width assumption (32 vs 64) and how you handle negative inputs.

## code.python
```python
def popcount(x: int) -> int:
    count = 0
    while x:
        x &= x - 1
        count += 1
    return count


def is_power_of_two(x: int) -> bool:
    return x > 0 and (x & (x - 1)) == 0


def lowest_set_bit(x: int) -> int:
    return x & -x


def iter_submasks(mask: int):
    sub = mask
    while sub:
        yield sub
        sub = (sub - 1) & mask
    yield 0
```

## code.javascript
```javascript
function popcount(x) {
  let count = 0;
  while (x) {
    x &= x - 1;
    count++;
  }
  return count;
}

const isPowerOfTwo = (x) => x > 0 && (x & (x - 1)) === 0;
const lowestSetBit = (x) => x & -x;

function* iterSubmasks(mask) {
  let sub = mask;
  while (sub) {
    yield sub;
    sub = (sub - 1) & mask;
  }
  yield 0;
}
```

## code.java
```java
public class BitTricks {
    public static int popcount(int x) {
        int count = 0;
        while (x != 0) {
            x &= x - 1;
            count++;
        }
        return count;
    }

    public static boolean isPowerOfTwo(int x) {
        return x > 0 && (x & (x - 1)) == 0;
    }

    public static int lowestSetBit(int x) {
        return x & -x;
    }

    public static void forEachSubmask(int mask, java.util.function.IntConsumer fn) {
        int sub = mask;
        while (sub != 0) {
            fn.accept(sub);
            sub = (sub - 1) & mask;
        }
        fn.accept(0);
    }
}
```

## code.cpp
```cpp
#include <cstdint>
#include <functional>

int popcount(uint32_t x) {
    int count = 0;
    while (x) {
        x &= x - 1;
        ++count;
    }
    return count;
}

bool isPowerOfTwo(uint32_t x) {
    return x > 0 && (x & (x - 1)) == 0;
}

uint32_t lowestSetBit(uint32_t x) {
    return x & (~x + 1);
}

void forEachSubmask(uint32_t mask, const std::function<void(uint32_t)>& fn) {
    uint32_t sub = mask;
    while (sub) {
        fn(sub);
        sub = (sub - 1) & mask;
    }
    fn(0);
}
```
