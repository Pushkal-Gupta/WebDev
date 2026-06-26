---
slug: ps-random-variables
module: prob-stats
title: Random Variables, PMF, PDF, and CDF
subtitle: Turning messy outcomes into numbers you can add, average, and reason about.
difficulty: Beginner
position: 1
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Khan Academy — Random variables (probability)"
    url: "https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library"
    type: course
  - title: "Seeing Theory — Chapter 3: Probability Distributions"
    url: "https://seeing-theory.brown.edu/probability-distributions/index.html"
    type: interactive
  - title: "StatQuest — The Main Ideas behind Probability Distributions"
    url: "https://www.youtube.com/watch?v=oI3hZJqXJuc"
    type: video
status: published
---

## intro
A coin flip is "heads" or "tails," a poker hand is some pile of cards, a wait at the bus stop is a span of minutes — these are raw outcomes, and you cannot average a "heads." A **random variable** is the bridge: a rule that attaches a number to every outcome of an experiment. Once outcomes are numbers, the full machinery of arithmetic opens up — you can sum them, average them, measure how far they spread. The random variable does not add randomness; it merely *measures* the randomness already there. Define the right measurement and a tangle of possible outcomes collapses into a clean distribution of numbers you can compute with.

## whyItMatters
Almost everything quantitative downstream of probability is really a statement about random variables. An A/B test's conversion count, a model's prediction error, the latency of a web request, the return on a portfolio — each is a random variable, and the question you actually care about ("is version B better?", "how risky is this trade?") is a question about its distribution. The three descriptions in this lesson are the universal vocabulary for that distribution: the **PMF** (for things you count), the **PDF** (for things you measure on a continuum), and the **CDF** (which works for both and answers "what's the chance of *at most* x?"). Simulation engines sample from these objects, statistical tests compare them, machine-learning losses are expectations taken over them, and risk models live or die on the tails the CDF exposes. Learn to read a PMF/PDF/CDF and you can read the language every later topic is written in.

## intuition
Start with the **sample space** \(\Omega\): the set of every possible outcome of one run of the experiment. Roll two dice and \(\Omega\) has 36 elements, each pair \((d_1, d_2)\) equally likely. An **event** is any subset of \(\Omega\) — "the sum is 7" is the event \(\{(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)\}\), and its probability is just the fraction of outcomes it contains, here \(6/36\). So far there are no numbers attached to outcomes, only to events.

A **random variable** \(X\) is a function \(X:\Omega \to \mathbb{R}\) — feed it an outcome, it returns a number. For two dice, "the sum" is the random variable \(X(d_1,d_2) = d_1 + d_2\). It takes values \(2\) through \(12\). The crucial move: each *value* of \(X\) corresponds to a whole event in \(\Omega\). The value \(X=7\) is shorthand for that six-outcome event, so \(P(X=7) = 6/36\). The random variable repackages the sample space into a tidy list of numbers and their probabilities, and that repackaging is the **distribution** of \(X\).

When \(X\) takes a finite or countable set of values, it is **discrete**, and its distribution is described by a **probability mass function** \(p(x) = P(X=x)\): the probability piled on each value. A PMF is non-negative and its values sum to 1, \(\sum_x p(x) = 1\) — all the probability has to land somewhere. For the dice sum, \(p(2)=1/36\), rising to a peak \(p(7)=6/36\), then falling symmetrically — the familiar triangular shape.

When \(X\) ranges over a continuum (a waiting time, a height, a measurement), a single exact value has probability *zero* — there are uncountably many possibilities, so no individual one can carry positive mass. Here we use a **probability density function** \(f(x)\), where probability is **area under the curve**: \(P(a \le X \le b) = \int_a^b f(x)\,dx\), and the whole curve integrates to 1, \(\int_{-\infty}^{\infty} f(x)\,dx = 1\). A density value \(f(x)\) is not a probability — it can exceed 1 — it is probability *per unit length*. Only intervals have probability, and you get it by integrating.

Tying both worlds together is the **cumulative distribution function** \(F(x) = P(X \le x)\). It answers "what's the probability of landing at or below \(x\)?" The CDF always climbs from 0 to 1, never decreasing. For discrete \(X\) it is a staircase that jumps by \(p(x)\) at each value; for continuous \(X\) it is the smooth running integral of the density, so \(F'(x) = f(x)\). Because it accumulates, the CDF makes interval questions trivial: \(P(a < X \le b) = F(b) - F(a)\). The CDF is the one description that exists for *every* random variable, which is why simulators invert it to generate samples and statisticians lean on it for tests.

## visualization
```
sample space (two dice, 36 equally-likely cells)      random variable  X = d1 + d2
   d2 1 2 3 4 5 6                                       value:  2  3  4  5  6  7  8  9 10 11 12
 d1 +-------------                                      count:  1  2  3  4  5  6  5  4  3  2  1
  1 | 2 3 4 5 6 7                                       ----------------------------------------
  2 | 3 4 5 6 7 8     PMF  p(x)=count/36               6/36 |              ##
  3 | 4 5 6 7 8 9                                       5/36 |           ## ## ##
  4 | 5 6 7 8 9 10                                      4/36 |        ## ## ## ## ##
  5 | 6 7 8 9 10 11                                     3/36 |     ## ## ## ## ## ## ##
  6 | 7 8 9 10 11 12                                    1/36 |  ## ## ## ## ## ## ## ## ## ## ##
                                                              +  2  3  4  5  6  7  8  9 10 11 12

CDF F(x)=P(X<=x): a staircase 0 -> 1, jumping by p(x) at each value, flat between.
```

## bruteForce
The most direct way to get a distribution is to **enumerate the sample space and count**. List every outcome, apply the random variable to each, and tally how many outcomes map to each value; divide by the total to get the PMF. For two dice this is a 36-row table you can build by hand, and it is genuinely the right tool for small, finite, equally-likely spaces — it is exact and leaves nothing to interpretation. The trouble is scale: the sample space explodes combinatorially. Ten dice already have \(6^{10} \approx 60\) million outcomes; a deck of cards has \(52!\) orderings. Enumeration also assumes you can list outcomes at all, which fails outright for continuous experiments where \(\Omega\) is uncountable. So full enumeration is a perfect teaching tool and a dead end as a general method — past tiny spaces you need closed-form distributions or sampling.

## optimal
Two routes scale past enumeration. The first is to **recognize the closed-form distribution** the experiment produces and use its formula. A sum of independent dice, a count of successes, a waiting time — each matches a named distribution (covered in the next lesson) whose PMF/PDF/CDF is a formula you evaluate in constant time per value, no enumeration required. The second route, when no clean form exists, is **Monte Carlo sampling**: draw many random outcomes, compute \(X\) for each, and build an empirical PMF (a normalized histogram) or empirical CDF (the fraction of samples \(\le x\)). The empirical CDF converges uniformly to the true CDF as samples grow (Glivenko–Cantelli), so with enough draws the histogram is as good as the formula and works for any experiment you can simulate.

For continuous variables, the key relationships make everything computable: density is the derivative of the CDF, \(f(x)=F'(x)\); probability of an interval is the integral of the density or the difference of the CDF, \(P(a\le X\le b)=F(b)-F(a)\); and **inverse-transform sampling** turns a uniform random number \(u \in [0,1)\) into a sample of \(X\) via \(X = F^{-1}(u)\), which is exactly how simulators generate non-uniform randomness. Knowing which description you have and how to convert between them — mass vs. density, density vs. CDF — is the whole skill.

```python
from collections import Counter
from fractions import Fraction

# Exact PMF of the sum of two dice by enumerating the 36-outcome sample space.
outcomes = [(a, b) for a in range(1, 7) for b in range(1, 7)]
counts = Counter(a + b for a, b in outcomes)
n = len(outcomes)
pmf = {x: Fraction(c, n) for x, c in sorted(counts.items())}
print(pmf[7])                              # 1/6  -- the peak
print(sum(pmf.values()))                   # 1    -- mass sums to one

# CDF: running total of the PMF.
cdf, run = {}, Fraction(0)
for x in sorted(pmf):
    run += pmf[x]
    cdf[x] = run
print(cdf[7])                              # P(X <= 7) = 7/12
```

## complexity
time: O(|Omega|) to build a PMF by enumeration; O(k) to evaluate a closed-form PMF/PDF/CDF over k values; O(m log m) to build an empirical CDF from m samples (the log is the sort)
space: O(number of distinct values) to store a discrete PMF/CDF; O(1) extra for a closed-form density beyond its parameters; O(m) to hold m samples for an empirical estimate
notes: Enumeration is exact but blows up combinatorially and cannot touch continuous spaces. Closed-form distributions evaluate in constant time per value. Monte Carlo error in an empirical estimate shrinks like 1/sqrt(m), so cutting it in half costs 4x the samples.

## pitfalls
- Treating a density value \(f(x)\) as a probability. For continuous \(X\), \(f(x)\) is probability *per unit length* and can be greater than 1; only \(\int_a^b f(x)\,dx\) (an area) is a probability, and \(P(X=x)=0\) for any single point.
- Forgetting normalization. A PMF must satisfy \(\sum_x p(x)=1\) and a PDF must satisfy \(\int f = 1\); a function that does not integrate/sum to 1 is not a valid distribution, no matter how nice its shape.
- Confusing the random variable with its value. \(X\) is the function on the sample space; \(X=7\) names an *event* (a subset of \(\Omega\)). Mixing the two is how people miscount probabilities.
- Mishandling discrete CDF endpoints. \(F(x)=P(X\le x)\) includes \(x\); \(P(X<x)\) excludes it, and the two differ by exactly \(p(x)\) at jump points. Off-by-one endpoint errors are the classic discrete-CDF bug.
- Assuming "uniform sample space" when it is not. The count-and-divide rule \(P=\text{favorable}/\text{total}\) only holds when every outcome is equally likely; weighting must be applied explicitly otherwise.

## interviewTips
- Define a random variable as a *function from the sample space to the reals* first, then give the dice-sum example — this shows you understand it maps outcomes to numbers rather than "being random" itself.
- Be crisp about discrete vs. continuous: PMF gives mass at points and sums to 1; PDF gives density whose *area* is probability and integrates to 1; the CDF \(P(X\le x)\) is the unifying object that exists for both and is monotone from 0 to 1.
- When asked to compute an interval probability, reach for the CDF: \(P(a<X\le b)=F(b)-F(a)\). It avoids re-integrating and sidesteps endpoint mistakes.

## keyTakeaways
- A random variable is a function \(X:\Omega\to\mathbb{R}\) that turns outcomes into numbers; each value of \(X\) corresponds to an event, and the collection of value-probabilities is its distribution.
- Discrete variables are described by a PMF \(p(x)=P(X=x)\) (sums to 1); continuous variables by a PDF \(f(x)\) where probability is area, \(P(a\le X\le b)=\int_a^b f\) (integrates to 1); a single point has probability 0 in the continuous case.
- The CDF \(F(x)=P(X\le x)\) works for every random variable, climbs monotonically from 0 to 1, satisfies \(F'=f\) in the continuous case, and makes interval probabilities a simple subtraction \(F(b)-F(a)\).

## code.python
```python
import math
from collections import Counter

def empirical_distribution(samples):
    """Build an empirical PMF and CDF from a list of observed values."""
    n = len(samples)
    counts = Counter(samples)
    pmf = {x: c / n for x, c in sorted(counts.items())}
    cdf, run = {}, 0.0
    for x in sorted(pmf):
        run += pmf[x]
        cdf[x] = run
    return pmf, cdf

def normal_pdf(x, mu=0.0, sigma=1.0):
    z = (x - mu) / sigma
    return math.exp(-0.5 * z * z) / (sigma * math.sqrt(2 * math.pi))

dice = [a + b for a in range(1, 7) for b in range(1, 7)]
pmf, cdf = empirical_distribution(dice)
print(round(pmf[7], 4), round(cdf[7], 4))   # 0.1667  0.5833
print(round(normal_pdf(0.0), 4))            # 0.3989 -- a density value, not a probability
```

## code.javascript
```javascript
// Empirical PMF + CDF from observed values, plus a normal density.
function empiricalDistribution(samples) {
  const n = samples.length;
  const counts = new Map();
  for (const x of samples) counts.set(x, (counts.get(x) || 0) + 1);
  const keys = [...counts.keys()].sort((a, b) => a - b);
  const pmf = new Map(keys.map((x) => [x, counts.get(x) / n]));
  const cdf = new Map();
  let run = 0;
  for (const x of keys) { run += pmf.get(x); cdf.set(x, run); }
  return { pmf, cdf };
}

function normalPdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

const dice = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) dice.push(a + b);
const { pmf, cdf } = empiricalDistribution(dice);
console.log(pmf.get(7).toFixed(4), cdf.get(7).toFixed(4)); // 0.1667 0.5833
console.log(normalPdf(0).toFixed(4));                       // 0.3989
```

## code.java
```java
import java.util.*;

public class RandomVariables {
    static double normalPdf(double x, double mu, double sigma) {
        double z = (x - mu) / sigma;
        return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }

    public static void main(String[] args) {
        TreeMap<Integer, Integer> counts = new TreeMap<>();
        int n = 0;
        for (int a = 1; a <= 6; a++)
            for (int b = 1; b <= 6; b++) {
                counts.merge(a + b, 1, Integer::sum);
                n++;
            }
        double run = 0;
        TreeMap<Integer, Double> cdf = new TreeMap<>();
        for (var e : counts.entrySet()) {
            run += e.getValue() / (double) n;
            cdf.put(e.getKey(), run);
        }
        System.out.printf("%.4f %.4f%n", counts.get(7) / (double) n, cdf.get(7)); // 0.1667 0.5833
        System.out.printf("%.4f%n", normalPdf(0, 0, 1));                          // 0.3989
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <map>

double normalPdf(double x, double mu, double sigma) {
    double z = (x - mu) / sigma;
    return std::exp(-0.5 * z * z) / (sigma * std::sqrt(2 * M_PI));
}

int main() {
    std::map<int, int> counts;
    int n = 0;
    for (int a = 1; a <= 6; ++a)
        for (int b = 1; b <= 6; ++b) { counts[a + b]++; n++; }

    double run = 0, cdf7 = 0;
    for (auto& [val, c] : counts) {
        run += c / (double)n;
        if (val == 7) cdf7 = run;
    }
    std::printf("%.4f %.4f\n", counts[7] / (double)n, cdf7);  // 0.1667 0.5833
    std::printf("%.4f\n", normalPdf(0, 0, 1));                // 0.3989
    return 0;
}
```
