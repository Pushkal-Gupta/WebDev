---
slug: dm-combinatorics
module: discrete-math
title: Counting and Combinatorics
subtitle: Sum and product rules, permutations, combinations, binomial coefficients, and the pigeonhole principle — the arithmetic of how many.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "MIT OCW 6.042J — Mathematics for Computer Science"
    url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/"
    type: course
  - title: "Khan Academy — Combinations"
    url: "https://www.khanacademy.org/math/statistics-probability/counting-permutations-and-combinations"
    type: course
  - title: "Brilliant — Combinatorics"
    url: "https://brilliant.org/wiki/combinatorics/"
    type: interactive
status: published
---

## intro
Counting sounds trivial until the objects get large: how many 8-character passwords, how many ways to seat 10 guests, how many 5-card poker hands, how many binary strings avoid three consecutive ones? Enumerating them by hand is hopeless, so combinatorics builds a small toolkit — the sum rule, the product rule, permutations, combinations, and the binomial coefficients — that turns "count them all" into a formula you evaluate directly. Master these five ideas and a huge fraction of probability, algorithm analysis, and interview counting questions collapses into a one-line calculation.

## whyItMatters
Every probability is a ratio of counts, so combinatorics is the foundation beneath all of probability and statistics: you cannot compute the chance of a full house without counting hands. In algorithms it fixes the size of a search space — the number of subsets, permutations, or paths a brute-force solution must consider, which is exactly what tells you whether backtracking is feasible or hopeless. Binomial coefficients appear in dynamic programming (grid paths, subset sums), in the analysis of randomized algorithms, in hashing and load-balancing bounds, and in the binomial and hypergeometric distributions. The pigeonhole principle proves that collisions, duplicates, and repeats are unavoidable — the backbone of lower-bound arguments across computer science. Counting well is what separates a guessed complexity from a proven one.

## intuition
Two rules generate everything. The **sum rule**: if a task can be done in one of several *disjoint* ways — \(a\) ways OR \(b\) ways with no overlap — the total is \(a+b\). The **product rule**: if a task is a *sequence* of independent choices — \(a\) ways for the first AND \(b\) ways for the second — the total is \(a\times b\). "Or" adds; "and" multiplies. A menu with 3 starters and 4 mains offers \(3\times 4=12\) two-course meals (product), while choosing a single dish from 3 starters or 4 mains gives \(3+4=7\) options (sum).

From the product rule comes the **factorial**. Arranging \(n\) distinct objects in a row fills the first slot \(n\) ways, the next \(n-1\), and so on down to 1, giving \(n!=n\cdot(n-1)\cdots 1\), with the convention \(0!=1\) (there is exactly one way to arrange nothing). If you only fill \(k\) of the \(n\) slots and order matters, you get a **permutation**:
\[
P(n,k)=\frac{n!}{(n-k)!}=n(n-1)\cdots(n-k+1).
\]
When order does *not* matter, every unordered group of \(k\) items was counted \(k!\) times among the permutations, so divide it out to get a **combination**:
\[
\binom{n}{k}=\frac{P(n,k)}{k!}=\frac{n!}{k!\,(n-k)!}.
\]
The single most useful reflex in counting is asking "does order matter?" — yes means permutations, no means combinations. Combinations satisfy the elegant symmetry \(\binom{n}{k}=\binom{n}{n-k}\) (choosing who is in equals choosing who is out) and **Pascal's rule**
\[
\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k},
\]
which says: fix one element; either it is in your group (choose \(k-1\) from the rest) or it is out (choose \(k\) from the rest). Stacking these rows produces **Pascal's triangle**, whose entries are exactly the binomial coefficients. Those same coefficients expand a power via the **binomial theorem**:
\[
(x+y)^n=\sum_{k=0}^{n}\binom{n}{k}x^{n-k}y^{k},
\]
because expanding the product picks \(x\) or \(y\) from each of the \(n\) factors, and \(\binom{n}{k}\) counts the terms with exactly \(k\) copies of \(y\). Setting \(x=y=1\) gives \(\sum_k \binom{n}{k}=2^n\): the number of subsets of an \(n\)-set. When repetition is allowed, arrangements of a multiset with counts \(n_1,\dots,n_r\) number \(\frac{n!}{n_1!\cdots n_r!}\). Finally the **pigeonhole principle**: place \(n\) items into \(m\) boxes with \(n>m\) and some box holds at least two — a deceptively simple observation that forces duplicates, collisions, and repeats to exist.

## visualization
```
Pascal's triangle  (row n, entry k) = C(n, k)   ->   binomial coefficients

n=0:                    1
n=1:                  1   1
n=2:                1   2   1
n=3:              1   3   3   1
n=4:            1   4   6   4   1
n=5:          1   5  10  10   5   1
n=6:        1   6  15  20  15   6   1

each entry = sum of the two above it   (Pascal's rule)
row n sums to 2^n            row 4:  1+4+6+4+1 = 16 = 2^4
C(5,2) = 10  is row 5, position 2      (choose 2 of 5, order ignored)
```

## bruteForce
The honest, unclever way to count is to *enumerate*: generate every arrangement or subset and tally them. For permutations of size \(k\), recursively pick an unused element for each of the \(k\) positions; for combinations, walk the elements in order and for each decide include-or-skip, emitting a group when \(k\) are chosen. This always gives the right answer and doubles as a way to *list* the objects, not just count them, which is what you actually need in a backtracking problem. The fatal flaw is scale: there are \(n!\) permutations and \(2^n\) subsets, so enumeration is exponential and dies well before \(n=20\). Use it to build intuition, to verify a formula on tiny inputs, or when the problem genuinely requires the objects themselves — never to merely produce a count that a formula delivers in constant time.

## optimal
Compute the count with a closed form and never enumerate. A permutation \(P(n,k)\) is just the falling product \(n(n-1)\cdots(n-k+1)\) — multiply \(k\) terms, \(O(k)\) time, no factorials needed. For combinations, do **not** compute three separate factorials and divide; \(n!\) overflows a 64-bit integer past \(n=20\) even when the answer \(\binom{n}{k}\) is small. Instead use the **multiplicative formula** with the symmetry \(\binom{n}{k}=\binom{n}{n-k}\) to shrink \(k\):
\[
\binom{n}{k}=\prod_{i=1}^{k}\frac{n-k+i}{i},
\]
building the result one factor at a time and exploiting that each partial product \(\binom{n-k+i}{i}\) is an integer, so integer division stays exact and intermediate values stay near the final answer. When you need a whole table of coefficients, use **Pascal's-triangle dynamic programming**: initialize \(\binom{n}{0}=1\) and apply \(\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k}\) row by row in \(O(n^2)\) time using only additions, which sidesteps overflow-until-the-end and multiplication entirely — ideal for grid-path DP and modular arithmetic (add under a modulus). For multiset arrangements apply \(\frac{n!}{n_1!\cdots n_r!}\); for "choose \(k\) with repetition allowed" use **stars and bars**, \(\binom{n+k-1}{k}\), which counts the ways to drop \(k\) indistinct balls into \(n\) bins. And when a problem asks you to *prove* a duplicate, collision, or repeated value must exist, reach for the **pigeonhole principle** as a counting shortcut: if the number of items exceeds the number of categories, at least \(\lceil n/m\rceil\) share a category — a one-line existence proof where enumeration would be hopeless.

```python
def nCk(n, k):
    if k < 0 or k > n:
        return 0
    k = min(k, n - k)                     # symmetry shrinks the loop
    result = 1
    for i in range(1, k + 1):
        result = result * (n - k + i) // i  # each partial product is an integer
    return result
```

## complexity
time: \(O(k)\) for a single \(P(n,k)\) or \(\binom{n}{k}\) via the multiplicative formula; \(O(n^2)\) to fill a full Pascal's-triangle table of all \(\binom{n}{k}\); enumeration is \(O(n!)\) for permutations and \(O(2^n)\) for subsets.
space: \(O(1)\) for a single multiplicative count; \(O(n)\) if you keep just the current Pascal row (rolling array), \(O(n^2)\) for the full triangle; \(O(n)\) recursion depth when enumerating.
notes: Prefer the multiplicative formula or additive Pascal DP over `n! / (k!(n-k)!)` — the direct factorial ratio overflows 64-bit integers past \(n=20\) even when the answer is tiny. Under a modulus, use additive Pascal DP or modular inverses; never real division.

## pitfalls
- Confusing permutations with combinations: order matters means \(P(n,k)=n!/(n-k)!\), order does not means \(\binom{n}{k}=n!/(k!(n-k)!)\). Ask "would swapping two chosen items give a *different* outcome?" before picking a formula — the wrong choice is off by a factor of \(k!\).
- Off-by-one in \(P(n,k)\): the falling product has exactly \(k\) terms ending at \(n-k+1\), not \(n-k\). Writing \(n(n-1)\cdots(n-k)\) counts \(k+1\) factors and overcounts.
- Integer overflow of factorials: \(21!\) already exceeds a signed 64-bit integer, so computing \(n!\), \(k!\), \((n-k)!\) separately overflows even when \(\binom{n}{k}\) fits easily. Use the multiplicative or additive form instead.
- Double-counting: summing over cases that overlap (violating the sum rule's disjointness) counts shared outcomes twice. Fix with inclusion–exclusion, or partition into genuinely disjoint cases.
- Forgetting \(0!=1\): the base case matters. Treating \(0!\) as \(0\) makes \(\binom{n}{0}\), \(\binom{n}{n}\), and every recursion base collapse to zero and breaks the whole table.

## interviewTips
- State "order matters vs not" out loud before writing any formula — interviewers watch for whether you reach for permutations or combinations by reflex, and naming it prevents the most common factor-of-\(k!\) error.
- Prefer the multiplicative \(\binom{n}{k}=\prod (n-k+i)/i\) with the \(\min(k,n-k)\) symmetry, and mention overflow: computing separate factorials fails past \(n=20\). This signals you think about numerical limits, not just math.
- For counting-argument or "must two share" questions, invoke the pigeonhole principle explicitly and identify the pigeons and the holes — it converts a vague "there must be a collision" into a rigorous one-line proof.

## keyTakeaways
- "Or" adds (sum rule, disjoint cases), "and" multiplies (product rule, sequential choices); factorials, permutations, and combinations all follow from these two rules plus the question "does order matter?"
- \(P(n,k)=n!/(n-k)!\) for ordered selections and \(\binom{n}{k}=n!/(k!(n-k)!)\) for unordered; compute via the multiplicative formula or additive Pascal's rule \(\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k}\) to avoid factorial overflow, and note \(\sum_k\binom{n}{k}=2^n\).
- Binomial coefficients power the binomial theorem \((x+y)^n=\sum_k\binom{n}{k}x^{n-k}y^k\) and Pascal's triangle; the pigeonhole principle turns "a duplicate must exist" into a rigorous counting proof.

## code.python
```python
from math import comb, perm  # stdlib since 3.8; hand-rolled versions below

def nPk(n, k):
    """Ordered selections: n! / (n-k)! as a k-term falling product."""
    if k < 0 or k > n:
        return 0
    result = 1
    for i in range(k):
        result *= n - i          # n, n-1, ..., n-k+1  (exactly k terms)
    return result

def nCk(n, k):
    """Unordered selections via the overflow-safe multiplicative formula."""
    if k < 0 or k > n:
        return 0
    k = min(k, n - k)            # symmetry: C(n,k) = C(n,n-k)
    result = 1
    for i in range(1, k + 1):
        result = result * (n - k + i) // i
    return result

print(nPk(5, 2), nCk(5, 2))     # 20 10
assert (nPk(5, 2), nCk(5, 2)) == (perm(5, 2), comb(5, 2))
```

## code.javascript
```javascript
function nPk(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result *= n - i;   // k falling factors
  return result;
}

function nCk(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);                          // symmetry shrinks the loop
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;           // stays integral for BigInt-free n
  }
  return Math.round(result);
}

console.log(nPk(5, 2), nCk(5, 2));                 // 20 10
```

## code.java
```java
public class Combinatorics {
    static long nPk(int n, int k) {
        if (k < 0 || k > n) return 0;
        long result = 1;
        for (int i = 0; i < k; i++) result *= (n - i);   // k terms
        return result;
    }

    static long nCk(int n, int k) {
        if (k < 0 || k > n) return 0;
        k = Math.min(k, n - k);                          // C(n,k) = C(n,n-k)
        long result = 1;
        for (int i = 1; i <= k; i++) {
            result = result * (n - k + i) / i;           // exact integer division
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(nPk(5, 2) + " " + nCk(5, 2)); // 20 10
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <algorithm>

long long nPk(int n, int k) {
    if (k < 0 || k > n) return 0;
    long long result = 1;
    for (int i = 0; i < k; i++) result *= (n - i);   // k falling factors
    return result;
}

long long nCk(int n, int k) {
    if (k < 0 || k > n) return 0;
    k = std::min(k, n - k);                          // symmetry
    long long result = 1;
    for (int i = 1; i <= k; i++) {
        result = result * (n - k + i) / i;           // partial products stay integral
    }
    return result;
}

int main() {
    std::printf("%lld %lld\n", nPk(5, 2), nCk(5, 2)); // 20 10
    return 0;
}
```
