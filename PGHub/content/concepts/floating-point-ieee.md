---
slug: floating-point-ieee
module: math-number-theory
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
- **Patriot missile failure, 1991 Dhahran**: a `float` clock register accumulated drift; after 100 hours the time was off by 0.34 seconds and the system missed an incoming Scud, killing 28 soldiers. Root cause is in the IEEE 754 conversion of 0.1 to binary.
- **Knight Capital, 2012**: $440M lost in 45 minutes partly because price-tick floating-point comparisons aggregated incorrectly across order books.
- **Currency at every payment processor**: Stripe, Square, Adyen, PayPal — all store money as integer minor units (`amount_cents int64`) precisely because `0.1 + 0.2 != 0.3` in IEEE 754 would corrupt invoices.
- **Machine learning training (PyTorch, TensorFlow, JAX)**: gradient underflow into denormals silently zeroes updates; mixed-precision training (`float16` / `bfloat16`) requires explicit scaling to avoid losing the bottom of the gradient distribution.
- **Game physics determinism (Rocket League, fighting games, multiplayer RTS)**: `float` non-associativity (`(a+b)+c != a+(b+c)`) breaks lockstep simulation across clients with different CPU pipelines — engines pin to specific arithmetic modes or switch to fixed-point.
- **GPS / GIS computations**: subtracting two close coordinates loses 5+ digits of precision (catastrophic cancellation), so geospatial libs use double-double arithmetic or rebase coordinates locally.

Floating-point is universal, and almost every bug above traces to forgetting it is an approximation, not a real number.

## intuition
A `double` is binary scientific notation packed into 64 bits: 1 sign bit, 11 exponent bits, 52 fraction bits. The value is `(-1)^sign × 1.fraction × 2^(exponent - 1023)`. The leading `1` of the mantissa is implicit (it's always there for normal numbers, so the standard doesn't waste a bit storing it). This packing buys you roughly 15-17 decimal digits of precision and an exponent range from ~10^-308 to ~10^308 — extraordinary dynamic range for a 64-bit value.

The cost is that only numbers expressible as a finite sum of negative powers of 2 are exactly representable. 0.5 (= 2^-1) is exact. 0.25 (= 2^-2) is exact. 0.1 is *not* — its binary expansion is the repeating fraction 0.0001100110011... forever. The hardware stores the closest 53-bit approximation, which is 0.1000000000000000055511151231257827021181583404541015625. When you write `0.1 + 0.2 == 0.3` in any language, the comparison fails because all three numbers are approximations: 0.1 rounds up, 0.2 rounds up, their sum is 0.30000000000000004, and 0.3 rounds to 0.29999999999999998. The arithmetic is exact for the values actually stored; it's just that the values stored are not the values you wrote.

Special bit patterns extend the basic format. The all-zeros exponent encodes zero (with a sign — `-0.0` exists and behaves subtly differently from `+0.0`) and denormals (gradual underflow, numbers smaller than the smallest normal value, traded for reduced precision). The all-ones exponent encodes infinity (overflow result) and NaN (the result of `0/0`, `sqrt(-1)`, `inf - inf` and similar undefined operations). NaN has a critical property: it is unequal to everything, including itself — `nan == nan` is `false`. This is by design, so `if x == x` is a valid NaN check, but it surprises everyone the first time.

The other counterintuitive consequence is non-associativity. `(a + b) + c` need not equal `a + (b + c)` in floating-point, because each addition rounds to the nearest representable value and the rounding errors accumulate differently. Summing a long list left-to-right loses small terms once the running total is much larger than the next addend; summing pairwise or with Kahan's compensated-summation trick preserves precision by tracking the lost low-order bits. This non-associativity is why parallel reductions on GPUs can produce different bit-exact results across runs even for the same input.

Catastrophic cancellation is the third pitfall: subtracting two nearly-equal large numbers loses most of the significant digits, because the leading digits cancel and only the noisy tail remains. The numerics fix is to rearrange the math (`x^2 - y^2` as `(x - y)(x + y)` when x ≈ y) rather than blame the floating-point unit.

## optimal
The right answer depends on the domain. There is no single "use this type" — there is a decision tree based on what's being represented.

```python
from decimal import Decimal, getcontext
import math

# 1) Money: integer minor units OR Decimal. NEVER float.
price_cents = 19_99        # $19.99 stored exactly
total = sum(items_cents)   # exact integer arithmetic
# Or for arbitrary precision with rounding rules:
getcontext().prec = 28
amount = Decimal("19.99") + Decimal("0.01")    # exactly 20.00

# 2) Scientific / ML: float, but compare with tolerance.
def almost_equal(a, b, rel_tol=1e-9, abs_tol=1e-12):
    return math.isclose(a, b, rel_tol=rel_tol, abs_tol=abs_tol)

# 3) Summing many small numbers: Kahan compensated summation, O(n).
def kahan_sum(values):
    total, comp = 0.0, 0.0
    for x in values:
        y = x - comp                # subtract running compensation
        t = total + y               # may lose low bits of y
        comp = (t - total) - y      # recover the lost bits
        total = t
    return total

# 4) Two-nearly-equal subtraction: rearrange to avoid cancellation.
def stable_quadratic_root(a, b, c):
    # Standard formula loses precision when b^2 >> 4ac; use Vieta's variant.
    disc = math.sqrt(b * b - 4 * a * c)
    q = -0.5 * (b + math.copysign(disc, b))
    return q / a, c / q             # two roots, both numerically stable

# 5) NaN-safe aggregation: filter or propagate, never silently ignore.
def safe_mean(values):
    clean = [x for x in values if not math.isnan(x)]
    if not clean: raise ValueError("all NaN")
    return kahan_sum(clean) / len(clean)
```

Why this is the optimal toolkit: each technique addresses one of the four classic floating-point failure modes. Integer or `Decimal` for money eliminates representation error at the boundary; tolerance comparisons replace meaningless `==` with semantically correct "close enough"; Kahan summation reduces the O(n·ε) error growth of naive summation to O(ε) plus a small constant; algebraic rearrangement avoids catastrophic cancellation where it can be predicted; explicit NaN handling prevents one poisoned value from contaminating an entire aggregate. None of these are advanced — they are the default disciplines in numerical-computing literature (Higham's *Accuracy and Stability of Numerical Algorithms*, Chapter 4 on summation; IEEE 754-2008 §6 on special values).

Three implementation notes that matter in practice: (1) Python's `math.isclose` uses `max(rel_tol * max(|a|, |b|), abs_tol)` as its threshold, which handles both magnitudes-near-zero and large magnitudes correctly — most hand-rolled comparisons get the absolute-vs-relative tradeoff wrong; (2) Kahan summation costs roughly 4× the FLOPs of naive summation but is dramatically more accurate and still O(n) — use it unless you've measured a bottleneck; (3) on Intel CPUs, denormals can be 100× slower than normal arithmetic, so audio and DSP code often sets the FTZ (flush-to-zero) bit via `_MM_SET_FLUSH_ZERO_MODE`, trading correctness near zero for predictable latency.

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
