---
slug: ps-expectation-variance
module: prob-stats
title: Expectation, Variance, and Linearity
subtitle: The balance point of a distribution and how far it spreads — and the one rule that makes both easy.
difficulty: Beginner
position: 3
estimatedReadMinutes: 12
prereqs: [ps-random-variables]
relatedProblems: []
references:
  - title: "Khan Academy — Expected value & variance of random variables"
    url: "https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library/expected-value-lib"
    type: course
  - title: "Seeing Theory — Chapter 3: Expectation and Variance"
    url: "https://seeing-theory.brown.edu/basic-probability/index.html"
    type: interactive
  - title: "StatQuest — Expected Values, Clearly Explained"
    url: "https://www.youtube.com/watch?v=KLs_7b7SKi4"
    type: video
status: published
---

## intro
A distribution can be a sprawling thing — dozens of values, each with its own probability. Two numbers tame it. The **expectation** \(E[X]\) is its center of gravity: where the distribution would balance if you set it on a pivot. The **variance** is its spread: how widely the values scatter around that center. Together they are the first thing anyone asks of a random quantity — "what do I get on average, and how much does it bounce around?" And one quietly powerful rule, the **linearity of expectation**, lets you compute averages of complicated sums by adding up simple pieces, even when those pieces are tangled together by dependence. That rule turns problems that look like nightmares of combinatorics into one-line answers.

## whyItMatters
Expectation and variance are the workhorses of every quantitative field that touches uncertainty. A casino prices a game by its expected payout; an investor trades off expected return against variance (risk) in exactly the framework of modern portfolio theory; an algorithm's *average-case* running time is an expectation over random inputs, and randomized algorithms (quicksort, hashing, skip lists) are analyzed almost entirely through linearity of expectation. In machine learning, training minimizes an *expected* loss and the bias–variance decomposition that governs over- and under-fitting is literally a statement about these two quantities. Variance underlies the standard error, confidence intervals, and the signal-to-noise ratio. And linearity of expectation is the single most reused trick in combinatorial probability — counting expected fixed points of a permutation, expected collisions in a hash table, expected length of the longest run — because it ignores dependence entirely.

## intuition
For a discrete random variable, the **expectation** is the probability-weighted average of its values:
\[
E[X]=\sum_x x\,p(x),
\]
and for a continuous one it is the same idea with an integral, \(E[X]=\int x f(x)\,dx\). The mechanical picture is a balance beam: place a weight \(p(x)\) at position \(x\) on a number line; the beam balances exactly at \(E[X]\), the center of mass. A fair die has \(E[X]=(1+2+\dots+6)/6=3.5\) — note the expectation need not be an attainable value; you never roll a 3.5, yet that is the long-run average. The Law of Large Numbers makes "average" literal: average enough independent rolls and the sample mean converges to \(3.5\).

A vital subtlety: to get the expectation of a *function* of \(X\), you do **not** plug \(E[X]\) into the function. Instead, \(E[g(X)]=\sum_x g(x)\,p(x)\) — the "law of the unconscious statistician." In general \(E[g(X)]\neq g(E[X])\); for convex \(g\) like squaring, \(E[X^2]\ge (E[X])^2\), and that gap is precisely the variance.

The **variance** measures spread as the expected squared distance from the mean:
\[
\operatorname{Var}(X)=E[(X-\mu)^2]=E[X^2]-(E[X])^2,
\]
where \(\mu=E[X]\). The right-hand form ("mean of the square minus square of the mean") is the one you compute with. Squaring is deliberate: it makes deviations positive and punishes large excursions more than small ones. Because variance is in squared units (squared dollars, squared seconds — not intuitive), we usually report the **standard deviation** \(\sigma=\sqrt{\operatorname{Var}(X)}\), which lives in the original units and reads directly as a typical distance from the mean. For a fair die, \(\operatorname{Var}=35/12\approx 2.92\), so \(\sigma\approx 1.71\).

Now the rule that makes expectations easy. **Linearity of expectation** says
\[
E[X+Y]=E[X]+E[Y]\quad\text{and}\quad E[aX+b]=aE[X]+b,
\]
and — this is the magic — it holds **whether or not \(X\) and \(Y\) are independent**. The average of a sum is always the sum of the averages, no matter how the parts interact. So to find the expected number of, say, fixed points in a random permutation, write the count as a sum of indicator variables (one per position, equal to 1 if that position is fixed), take the expectation of each tiny indicator (just the probability it equals 1), and add them up. The dependence between positions is real but irrelevant to the *expectation*. This indicator-and-add technique dissolves problems that look hopeless by direct enumeration.

Variance is *not* so forgiving. It only adds for **independent** (or at least uncorrelated) variables: \(\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)\) requires zero covariance; in general \(\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)+2\operatorname{Cov}(X,Y)\). And scaling hits variance quadratically: \(\operatorname{Var}(aX)=a^2\operatorname{Var}(X)\), so doubling a variable quadruples its variance but only doubles its mean. Shifting by a constant leaves variance untouched — sliding the whole distribution does not change its spread. These asymmetries between how expectation and variance behave are exactly what makes averaging reduce noise: average \(n\) independent copies and the mean stays put while the variance drops by a factor of \(n\).

## visualization
```
weights p(x) on a number line; the beam balances at E[X] (the center of mass)

 p(x)
 0.30 |        ##
 0.25 |     ## ## ##
 0.15 |  ## ## ## ## ##
 0.05 |  ## ## ## ## ## ##
      +--1--2--3--4--5--6----> x
                /\                <- fulcrum sits at E[X] = sum x*p(x)
      |<-- sigma -->|<-- sigma -->|   standard deviation = typical distance from the balance point

 linearity:  E[X1 + X2 + ... + Xn] = E[X1] + E[X2] + ... + E[Xn]   (always, dependence or not)
 variance:   Var(X+Y) = Var(X) + Var(Y)   ONLY when X, Y are uncorrelated
```

## bruteForce
The definitional approach is to **enumerate every value and sum**: list all \((x, p(x))\) pairs, compute \(\sum x\,p(x)\) for the mean, then \(\sum (x-\mu)^2 p(x)\) for the variance in a second pass. For a known small PMF this is exactly right and perfectly clear. The naive habit that gets people into trouble is doing this two-pass and, worse, attacking *sums* of variables by first working out the full joint distribution of the sum. To find the expected total of three dice by building the distribution of the sum, you would enumerate \(6^3=216\) outcomes, tally the 16 possible totals, then average — correct but absurdly more work than necessary, and it scales exponentially. The brute-force mindset treats every expectation as a fresh enumeration over the joint sample space, which is precisely what linearity exists to avoid.

## optimal
**Reach for linearity of expectation first.** Decompose the quantity into a sum of simpler random variables — ideally **indicator variables** that are 1 when some event happens and 0 otherwise — and use \(E[\text{indicator}]=P(\text{event})\). The expected sum is then just the sum of those probabilities, computed without ever forming a joint distribution and without caring about dependence. Expected number of heads in \(n\) tosses? \(n\cdot p\), instantly. Expected fixed points of a random permutation of \(n\) items? Each of the \(n\) positions is fixed with probability \(1/n\), so the expectation is \(n\cdot(1/n)=1\), regardless of \(n\) — a result that is painful to get by enumeration and trivial by linearity.

For variance, use the computational identity \(\operatorname{Var}(X)=E[X^2]-(E[X])^2\), which needs only a single pass accumulating \(\sum x\), \(\sum x^2\) (and count). For sums of *independent* variables, add the variances directly. When estimating from data in one streaming pass, prefer a numerically stable online algorithm (Welford's method) over the raw \(E[X^2]-(E[X])^2\) formula, because subtracting two large nearly-equal numbers loses precision catastrophically — the textbook formula is fine on paper and a liability in floating point. The general strategy: never enumerate a joint distribution to get a mean; decompose, use linearity, and accumulate moments in one pass.

```python
# Expected fixed points of a random permutation by linearity of expectation.
# Each of n positions is a fixed point with probability 1/n, so E[fixed points] = n*(1/n) = 1.
def expected_fixed_points(n):
    return sum(1 / n for _ in range(n))   # = 1.0 for every n >= 1

# Mean and variance of a die from its PMF, single pass via E[X^2] - E[X]^2.
values = [1, 2, 3, 4, 5, 6]
p = 1 / 6
mean = sum(x * p for x in values)                 # 3.5
ex2 = sum(x * x * p for x in values)              # 15.1666...
var = ex2 - mean * mean                            # 2.9166...
print(round(expected_fixed_points(10), 4))         # 1.0
print(mean, round(var, 4))                          # 3.5 2.9167
```

## complexity
time: O(k) to compute mean and variance from a PMF over k values (single pass with the E[X^2]-E[X]^2 identity); O(n) to apply linearity over n component/indicator variables -- versus O(exp) to enumerate a joint distribution
space: O(1) extra beyond the distribution when accumulating running sums of x and x^2; O(n) only if you must materialize the components
notes: Linearity of expectation holds with or without independence -- this is what makes the indicator-variable trick so powerful. Variance only adds for uncorrelated variables. The E[X^2]-E[X]^2 formula is exact in theory but loses precision in floating point; use Welford's online algorithm for data.

## pitfalls
- Assuming \(E[g(X)]=g(E[X])\). False in general: \(E[X^2]\neq (E[X])^2\) (their difference is the variance), and plugging the mean into a nonlinear function is one of the most common probability errors (Jensen's inequality governs the direction of the gap).
- Adding variances of dependent variables. \(\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)\) only when \(\operatorname{Cov}(X,Y)=0\); otherwise the \(2\operatorname{Cov}\) term is essential and ignoring it underestimates or overestimates the true spread.
- Forgetting that scaling hits variance quadratically. \(\operatorname{Var}(aX)=a^2\operatorname{Var}(X)\), not \(a\operatorname{Var}(X)\); and shifting by a constant changes the mean but leaves the variance unchanged.
- Computing variance with \(E[X^2]-(E[X])^2\) in floating point on large values. Catastrophic cancellation can yield a tiny or even negative "variance"; use a stable online algorithm (Welford) for real data.
- Confusing variance with standard deviation, and reporting variance as if it were in the original units. Variance is in *squared* units; only \(\sigma=\sqrt{\operatorname{Var}}\) reads as a typical deviation in the data's own units.

## interviewTips
- Lead with the balance-point picture for expectation and "expected squared distance from the mean" for variance, then write \(E[X]=\sum x\,p(x)\) and \(\operatorname{Var}(X)=E[X^2]-(E[X])^2\) — intuition plus formula reads as mastery.
- The instant a problem asks for the expected value of a *count* of something, decompose it into indicator variables and apply linearity; explicitly note that linearity needs no independence. This is the single highest-leverage move in probability interviews.
- Be precise about what adds: expectations always add; variances add only for uncorrelated variables, and scaling multiplies variance by \(a^2\). Mention that averaging \(n\) independent copies divides the variance by \(n\) — the reason sample means are more stable than single observations.

## keyTakeaways
- Expectation \(E[X]=\sum x\,p(x)\) is the distribution's balance point (center of mass); it need not be an attainable value, and \(E[g(X)]\neq g(E[X])\) for nonlinear \(g\).
- Variance \(\operatorname{Var}(X)=E[X^2]-(E[X])^2\) is the expected squared deviation from the mean; standard deviation \(\sigma=\sqrt{\operatorname{Var}(X)}\) reports spread in the original units. Scaling gives \(\operatorname{Var}(aX)=a^2\operatorname{Var}(X)\).
- Linearity of expectation, \(E[X+Y]=E[X]+E[Y]\), holds regardless of dependence; combined with indicator variables it computes expected counts in one line. Variances add only when variables are uncorrelated.

## code.python
```python
def mean_variance(values, probs):
    mean = sum(x * p for x, p in zip(values, probs))
    ex2 = sum(x * x * p for x, p in zip(values, probs))
    var = ex2 - mean * mean
    return mean, var, var ** 0.5

def welford(samples):
    """Numerically stable streaming mean and (population) variance."""
    n, mean, m2 = 0, 0.0, 0.0
    for x in samples:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    return mean, (m2 / n if n else 0.0)

die_vals, die_p = [1, 2, 3, 4, 5, 6], [1 / 6] * 6
print(tuple(round(v, 4) for v in mean_variance(die_vals, die_p)))  # (3.5, 2.9167, 1.7078)
print(tuple(round(v, 4) for v in welford([2, 4, 4, 4, 5, 5, 7, 9])))  # (5.0, 4.0)
```

## code.javascript
```javascript
function meanVariance(values, probs) {
  let mean = 0, ex2 = 0;
  for (let i = 0; i < values.length; i++) {
    mean += values[i] * probs[i];
    ex2 += values[i] * values[i] * probs[i];
  }
  const variance = ex2 - mean * mean;
  return { mean, variance, std: Math.sqrt(variance) };
}

function welford(samples) {
  let n = 0, mean = 0, m2 = 0;
  for (const x of samples) {
    n++;
    const delta = x - mean;
    mean += delta / n;
    m2 += delta * (x - mean);
  }
  return { mean, variance: n ? m2 / n : 0 };
}

const p = 1 / 6;
console.log(meanVariance([1, 2, 3, 4, 5, 6], Array(6).fill(p)));
console.log(welford([2, 4, 4, 4, 5, 5, 7, 9])); // mean 5, variance 4
```

## code.java
```java
public class ExpectationVariance {
    static double[] meanVariance(double[] values, double[] probs) {
        double mean = 0, ex2 = 0;
        for (int i = 0; i < values.length; i++) {
            mean += values[i] * probs[i];
            ex2 += values[i] * values[i] * probs[i];
        }
        double var = ex2 - mean * mean;
        return new double[]{mean, var, Math.sqrt(var)};
    }
    static double[] welford(double[] samples) {
        int n = 0; double mean = 0, m2 = 0;
        for (double x : samples) {
            n++;
            double delta = x - mean;
            mean += delta / n;
            m2 += delta * (x - mean);
        }
        return new double[]{mean, n > 0 ? m2 / n : 0};
    }
    public static void main(String[] args) {
        double p = 1.0 / 6;
        double[] mv = meanVariance(new double[]{1, 2, 3, 4, 5, 6},
            new double[]{p, p, p, p, p, p});
        System.out.printf("%.4f %.4f %.4f%n", mv[0], mv[1], mv[2]); // 3.5 2.9167 1.7078
        double[] w = welford(new double[]{2, 4, 4, 4, 5, 5, 7, 9});
        System.out.printf("%.1f %.1f%n", w[0], w[1]);               // 5.0 4.0
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>

std::vector<double> meanVariance(const std::vector<double>& v, const std::vector<double>& p) {
    double mean = 0, ex2 = 0;
    for (size_t i = 0; i < v.size(); ++i) { mean += v[i] * p[i]; ex2 += v[i] * v[i] * p[i]; }
    double var = ex2 - mean * mean;
    return {mean, var, std::sqrt(var)};
}

std::pair<double, double> welford(const std::vector<double>& s) {
    int n = 0; double mean = 0, m2 = 0;
    for (double x : s) { n++; double d = x - mean; mean += d / n; m2 += d * (x - mean); }
    return {mean, n ? m2 / n : 0.0};
}

int main() {
    double p = 1.0 / 6;
    auto mv = meanVariance({1, 2, 3, 4, 5, 6}, {p, p, p, p, p, p});
    std::printf("%.4f %.4f %.4f\n", mv[0], mv[1], mv[2]);   // 3.5 2.9167 1.7078
    auto w = welford({2, 4, 4, 4, 5, 5, 7, 9});
    std::printf("%.1f %.1f\n", w.first, w.second);          // 5.0 4.0
    return 0;
}
```
