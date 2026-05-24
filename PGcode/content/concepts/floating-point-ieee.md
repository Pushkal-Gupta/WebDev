---
slug: floating-point-ieee
module: math
title: Floating Point — IEEE 754
subtitle: Mantissa, exponent, gradual underflow, NaN and Infinity — why 0.1 + 0.2 is not 0.3.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Princeton (numerics chapter)"
    url: "https://algs4.cs.princeton.edu/14analysis/"
    type: book
  - title: "IEEE 754 Standard — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/digital-logic/ieee-standard-754-floating-point-numbers/"
    type: blog
  - title: "TheAlgorithms/Python — maths (floating-point demos)"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
IEEE 754 is the standard that defines how almost every CPU represents real numbers. A 32-bit `float` and 64-bit `double` pack a sign bit, an exponent, and a mantissa into a fixed number of bits. The result is an extraordinarily useful but lossy approximation of the real numbers — and almost every floating-point bug comes from forgetting it is an approximation.

## whyItMatters
Money calculations, ML training, physics simulations, graphics, and analytics all rest on floating-point. Bugs here are subtle: a sum that depends on iteration order, an `==` comparison that "randomly" fails, a NaN that propagates silently through a pipeline, an underflow that quietly zeroes a gradient. Knowing the format prevents hours of confused debugging.

## intuition
A double is essentially scientific notation in binary: `(-1)^sign * 1.mantissa * 2^(exponent - 1023)`. Sixty-four bits split as 1 sign, 11 exponent, 52 mantissa. The mantissa's leading 1 is implicit. Special exponent values encode zero (with a sign!), denormals (gradual underflow near zero), infinity (overflow), and NaN (result of 0/0, sqrt(-1), etc.).

## visualization
0.1 in binary is the repeating fraction 0.0001100110011... — it has no finite representation. Stored as the nearest double, it is actually 0.1000000000000000055511151231257827021181583404541015625. Add the equally-imprecise stored 0.2 and you get 0.30000000000000004 — not a bug, the exact arithmetic of the actual stored values.

## bruteForce
Use floats for currency and round at the end. Catastrophic: errors accumulate, an order of operations changes the result, and customers see "$10.00" become "$9.99999999" on the invoice. The "fix" of multiplying by 100 and using ints is the right answer all along — represent money as integer cents or use a `Decimal` type.

## optimal
Pick the representation for the problem. For currency, use fixed-point integers or arbitrary-precision decimals. For physics and ML, accept floating-point but compare with a tolerance (`abs(a - b) < eps * max(1, abs(a), abs(b))`). Use Kahan summation when adding many small numbers. Watch for catastrophic cancellation: subtracting two nearly-equal large numbers loses most significant digits.

## complexity
time: O(1) per arithmetic op (hardware instruction); O(n) for stable summation algorithms.
space: O(1) for primitive types; O(precision) for arbitrary-precision libraries.
notes: A `double` has ~15-17 significant decimal digits; a `float` has ~6-9.

## pitfalls
- Comparing floats with `==`: even `0.1 + 0.2 == 0.3` is `false`.
- Summing a long list left-to-right: large + small + small + ... loses the small terms (use Kahan or pairwise).
- Casting from `double` to `float` silently for storage and not noticing precision loss.
- Letting NaN propagate through a metric calculation — one NaN poisons every aggregate.
- Forgetting `-0.0` exists and is `== 0.0` but `1/-0.0 == -Infinity`.
- Using `Math.floor((x - y) * 1e6)` for rounding — off-by-one near ties.

## interviewTips
- Be ready to derive how 0.1 + 0.2 ends up != 0.3 — every numerics interviewer asks.
- Mention denormals: they enable gradual underflow but are very slow on some hardware (Intel's "flush-to-zero" mode trades correctness for speed in audio).
- Bring up Decimal types as the correct money answer (`decimal.Decimal` in Python, `BigDecimal` in Java).

## code.python
```python
import math

def almost_equal(a: float, b: float, rel: float = 1e-9, abs_tol: float = 1e-12) -> bool:
    return math.isclose(a, b, rel_tol=rel, abs_tol=abs_tol)

def kahan_sum(values):
    total, c = 0.0, 0.0
    for x in values:
        y = x - c
        t = total + y
        c = (t - total) - y
        total = t
    return total
```

## code.javascript
```javascript
export function almostEqual(a, b, rel = 1e-9, absTol = 1e-12) {
  return Math.abs(a - b) <= Math.max(absTol, rel * Math.max(Math.abs(a), Math.abs(b)));
}

export function kahanSum(values) {
  let total = 0, c = 0;
  for (const x of values) {
    const y = x - c;
    const t = total + y;
    c = (t - total) - y;
    total = t;
  }
  return total;
}
```

## code.java
```java
public class FloatMath {
    public static boolean almostEqual(double a, double b, double rel, double absTol) {
        return Math.abs(a - b) <= Math.max(absTol, rel * Math.max(Math.abs(a), Math.abs(b)));
    }
    public static double kahanSum(double[] values) {
        double total = 0, c = 0;
        for (double x : values) {
            double y = x - c;
            double t = total + y;
            c = (t - total) - y;
            total = t;
        }
        return total;
    }
}
```

## code.cpp
```cpp
#include <cmath>
#include <vector>
#include <algorithm>

bool almostEqual(double a, double b, double rel = 1e-9, double absTol = 1e-12) {
    return std::fabs(a - b) <= std::max(absTol, rel * std::max(std::fabs(a), std::fabs(b)));
}

double kahanSum(const std::vector<double>& values) {
    double total = 0, c = 0;
    for (double x : values) {
        double y = x - c;
        double t = total + y;
        c = (t - total) - y;
        total = t;
    }
    return total;
}
```
