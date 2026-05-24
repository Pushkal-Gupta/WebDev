---
slug: master-theorem
module: foundations
title: Master Theorem
subtitle: Read the complexity of a divide-and-conquer recurrence T(n) = a·T(n/b) + f(n) by inspection — three cases cover almost everything.
difficulty: Intermediate
position: 9
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 4.5 — The Master Method (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap04/4.5/"
    type: book
  - title: "GeeksforGeeks — Master Theorem for Divide and Conquer Recurrences"
    url: "https://www.geeksforgeeks.org/advanced-master-theorem-for-divide-and-conquer-recurrences/"
    type: blog
  - title: "TheAlgorithms/Python — divide-and-conquer implementations"
    url: "https://github.com/TheAlgorithms/Python/tree/master/divide_and_conquer"
    type: repo
status: published
---

## intro
Most divide-and-conquer algorithms have a runtime recurrence of the form `T(n) = a · T(n/b) + f(n)` — split into `a` subproblems each of size `n/b`, with `f(n)` work to combine. The **Master Theorem** classifies the closed-form solution by comparing `f(n)` to `n^(log_b a)`.

## whyItMatters
You memorize it once and apply it to every divide-and-conquer algorithm:
- **Merge sort**: T(n) = 2T(n/2) + Θ(n) → Θ(n log n).
- **Binary search**: T(n) = T(n/2) + Θ(1) → Θ(log n).
- **Karatsuba**: T(n) = 3T(n/2) + Θ(n) → Θ(n^log₂3) ≈ Θ(n^1.585).
- **Strassen**: T(n) = 7T(n/2) + Θ(n²) → Θ(n^log₂7) ≈ Θ(n^2.807).
- **Closest pair (2D)**: T(n) = 2T(n/2) + Θ(n) → Θ(n log n).

If you can read the recurrence, you can read the complexity. Saves writing an O(n²) algorithm by accident.

## intuition
The work splits between three levels of the recursion tree:
- **The leaves** dominate when `a > b^k` (lots of small subproblems).
- **The root** dominates when `a < b^k` (combine work dwarfs subproblems).
- **All levels equally** when `a = b^k` (the famous `Θ(n^k log n)` case).

Here k is the exponent of the "combine" work: `f(n) = Θ(n^k)`.

## visualization
```
T(n) = 2T(n/2) + n               (merge sort)

Level 0:   Θ(n)               ← total work at root
Level 1:   Θ(n/2) + Θ(n/2)    = Θ(n)
Level 2:   Θ(n/4) × 4         = Θ(n)
...
Level k:   Θ(n)
Depth:     log n

Total = n · log n   →   Θ(n log n)
```

## bruteForce
Solve by unrolling the recurrence manually each time. Works, but error-prone for non-trivial recurrences.

## optimal
**Master Theorem (CLRS form)**: given T(n) = a·T(n/b) + f(n) with a ≥ 1, b > 1:

Let `n_log = log_b(a)`. Three cases:

**Case 1**: `f(n) = O(n^c)` with `c < n_log` → `T(n) = Θ(n^n_log)`.
> The subproblems dominate; work piles up at the leaves.

**Case 2**: `f(n) = Θ(n^n_log)` → `T(n) = Θ(n^n_log · log n)`.
> Each level contributes the same amount of work.

**Case 3**: `f(n) = Ω(n^c)` with `c > n_log` AND "regularity condition" → `T(n) = Θ(f(n))`.
> The combine work dominates; the root determines the cost.

Worked examples:
- Merge sort: a=2, b=2, n_log = 1. f(n) = n = n^1. Case 2 → Θ(n log n). ✓
- Binary search: a=1, b=2, n_log = 0. f(n) = 1 = n^0. Case 2 → Θ(log n). ✓
- Karatsuba: a=3, b=2, n_log = log₂3 ≈ 1.585. f(n) = n. Case 1 → Θ(n^1.585). ✓

## complexity
- **Applying the theorem**: O(1) — just three checks.
- **Recursions it doesn't cover**: 
  - `f(n)` polynomial-log of `n^n_log` (e.g., `n^n_log · log n`): not covered by classical master theorem; use **Akra-Bazzi**.
  - Recursions with variable splits (e.g., T(n) = T(n/3) + T(2n/3) + Θ(n)): use Akra-Bazzi.

## pitfalls
- **Case 3 regularity condition**: `a · f(n/b) ≤ c · f(n)` for some c < 1 and large n. Most polynomial f satisfy this.
- **Confusing comparisons**: it's `f(n)` vs `n^(log_b a)`, NOT vs `n^a` or `n^(a/b)`.
- **Polylog gaps**: if f(n) = n^n_log · log n, you're in the gap between Cases 2 and 3. Akra-Bazzi gives `Θ(n^n_log · log² n)`.
- **Recursions that aren't of this form**: T(n) = T(√n) + Θ(1) gives Θ(log log n); master theorem doesn't apply.

## interviewTips
- For any divide-and-conquer algorithm in an interview, write the recurrence first, then state which case applies.
- Memorize the three classic results (merge sort, binary search, Karatsuba) — they're cited constantly.
- For senior interviews, mention **Akra-Bazzi** as the generalization for non-uniform splits.

## code.python
```python
def master_theorem(a, b, c):
    """Classify T(n) = a·T(n/b) + Θ(n^c). Returns the asymptotic."""
    import math
    n_log = math.log(a, b)
    if c < n_log: return f"Θ(n^{n_log:.3f})"
    if abs(c - n_log) < 1e-9: return f"Θ(n^{n_log:.3f} · log n)"
    return f"Θ(n^{c})"

print(master_theorem(2, 2, 1))  # merge sort  → Θ(n^1 · log n)
print(master_theorem(1, 2, 0))  # binary search → Θ(n^0 · log n) = Θ(log n)
print(master_theorem(3, 2, 1))  # Karatsuba   → Θ(n^1.585)
print(master_theorem(7, 2, 2))  # Strassen    → Θ(n^2.807)
```

## code.javascript
```javascript
function masterTheorem(a, b, c) {
  const nLog = Math.log(a) / Math.log(b);
  if (c < nLog) return `Θ(n^${nLog.toFixed(3)})`;
  if (Math.abs(c - nLog) < 1e-9) return `Θ(n^${nLog.toFixed(3)} · log n)`;
  return `Θ(n^${c})`;
}
```

## code.java
```java
class MasterTheorem {
    public static String classify(double a, double b, double c) {
        double nLog = Math.log(a) / Math.log(b);
        if (c < nLog) return String.format("Θ(n^%.3f)", nLog);
        if (Math.abs(c - nLog) < 1e-9) return String.format("Θ(n^%.3f · log n)", nLog);
        return String.format("Θ(n^%.1f)", c);
    }
}
```

## code.cpp
```cpp
#include <cmath>
#include <string>
std::string masterTheorem(double a, double b, double c) {
    double nLog = std::log(a) / std::log(b);
    if (c < nLog) return "Theta(n^" + std::to_string(nLog) + ")";
    if (std::abs(c - nLog) < 1e-9) return "Theta(n^" + std::to_string(nLog) + " log n)";
    return "Theta(n^" + std::to_string(c) + ")";
}
```
