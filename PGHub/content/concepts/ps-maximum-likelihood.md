---
slug: ps-maximum-likelihood
module: prob-stats
title: Maximum Likelihood Estimation
subtitle: Pick the parameter that makes the data you actually saw the least surprising — the workhorse behind fitting almost every model.
difficulty: Advanced
position: 9
estimatedReadMinutes: 15
prereqs: [ps-distributions, ps-expectation-variance]
relatedProblems: []
references:
  - title: "StatQuest — Maximum Likelihood, clearly explained!!!"
    url: "https://www.youtube.com/watch?v=XepXtl9YKwc"
    type: video
  - title: "StatQuest — Probability is not Likelihood"
    url: "https://www.youtube.com/watch?v=pYxNSUDSFH4"
    type: video
  - title: "Khan Academy — Random variables & probability distributions"
    url: "https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library"
    type: course
  - title: "Seeing Theory — Chapter 5: Bayesian Inference (likelihood, priors)"
    url: "https://seeing-theory.brown.edu/bayesian-inference/index.html"
    type: interactive
status: published
---

## intro
You flipped a coin ten times and saw seven heads. What is the coin's bias? The honest answer is that you cannot *know* it, but you can ask a sharper question: of all the possible biases the coin might have, which one makes the seven-heads-in-ten outcome you actually observed the most probable? That single idea — turn the data into a fixed fact and hunt for the parameter that best explains it — is **maximum likelihood estimation**. It is the engine that fits coins, Gaussians, logistic regressions, and most of the models you will ever train.

## whyItMatters
Maximum likelihood is the default recipe for turning data into model parameters across nearly all of statistics and machine learning. Fitting a normal distribution, a Poisson rate, a logistic-regression boundary, the weights of a neural network under cross-entropy loss — all of these are maximum-likelihood (or equivalently, negative-log-likelihood-minimizing) problems wearing different clothes. It gives a principled, automatic answer to "which parameters fit best" instead of eyeballing, and the estimates it produces come with desirable large-sample guarantees: under mild conditions the MLE is *consistent* (it homes in on the truth as data grows) and *asymptotically efficient* (no unbiased estimator beats its variance in the limit). Recognizing a loss function as a disguised log-likelihood is one of the most useful pattern-matches in applied modeling.

## intuition
Start by untangling two words that sound identical but point in opposite directions. **Probability** fixes the parameter and asks how likely the data is: given a fair coin \(p=0.5\), how probable is seven heads in ten? **Likelihood** fixes the data and asks how well each parameter explains it: given that we saw seven heads, how plausible is each candidate \(p\)? Same formula, read backwards. The likelihood function \(L(\theta)\) is exactly the probability of the observed data, but now viewed as a function of the unknown parameter \(\theta\) with the data held constant.

For \(n\) independent observations the likelihood is a **product**, because independent events multiply:
\[
L(\theta)=\prod_{i=1}^{n} P(x_i\mid\theta).
\]
For our coin with \(k\) heads in \(n\) flips this is \(L(p)=p^{k}(1-p)^{n-k}\). Sweep \(p\) from 0 to 1 and you trace a curve: near \(p=0\) it is crushed (you cannot get heads from a coin that never shows heads), near \(p=1\) it is crushed too (you cannot get tails from a coin that is always heads), and somewhere in between it peaks. The location of that peak is the **maximum likelihood estimate**, written \(\hat{\theta}_{MLE}\) — the single parameter value that makes the observed data least surprising.

Products of many small probabilities underflow to zero fast, so we almost always work with the **log-likelihood**:
\[
\ell(\theta)=\log L(\theta)=\sum_{i=1}^{n}\log P(x_i\mid\theta).
\]
The logarithm turns the product into a sum and, being monotonic, does not move the peak — the \(\theta\) that maximizes \(\ell\) also maximizes \(L\). Now finding the peak is ordinary calculus: take the derivative, set \(\frac{d\ell}{d\theta}=0\), and solve. For the coin, \(\ell(p)=k\log p+(n-k)\log(1-p)\), and the derivative vanishes exactly at \(\hat{p}=k/n\) — the sample proportion. Seven heads in ten gives \(\hat{p}=0.7\), precisely the intuitive answer. The same machinery on a Gaussian yields the sample mean as the MLE of \(\mu\): the most-likely center is just the average of your data.

There is one more thing the picture tells you. With only a handful of flips the likelihood curve is broad and gentle — many values of \(p\) explain the data almost equally well, so you should not trust any single estimate much. As you collect more data the curve **sharpens**: the peak grows taller and narrower, concentrating around the true parameter, and the estimate becomes both more confident and more accurate. More data does not just shift the peak; it squeezes the whole curve around the truth, which is the geometric meaning of the MLE being consistent.

## visualization
```
log-likelihood  ell(p) = k log p + (n-k) log(1-p)        peak = MLE = k/n

  ell(p)
    |                       . - .              n = 10   (broad, gentle peak:
    |                    .'   ^   '.            many p explain the data)
    |                  .'     |     '.
    |                .'   p_hat=0.7    '.
    |              .'        |           '.
    +-------------'----------|------------'------> p
    0           0.3         0.7          1.0

  more data sharpens the curve around the truth p* = 0.7 :

    n = 10        n = 50         n = 200
      .-.          .-.            .|.
     /   \        / | \          / | \           taller + narrower
    /     \      /  |  \         | | |           => MLE concentrates
   '-------'    '---|---'        '-|-'              on p* = 0.7
       ^            ^              ^
      0.7          0.7            0.7
```

## bruteForce
The most direct way to find the MLE makes no use of calculus: lay down a fine **grid** of candidate parameter values, evaluate the log-likelihood at each, and keep the argmax. For the coin, scan \(p\) over \(\{0.01, 0.02, \dots, 0.99\}\), compute \(\ell(p)=k\log p+(n-k)\log(1-p)\) at every grid point, and report the \(p\) that scored highest. This always works, needs no derivation, and extends trivially to messy likelihoods with no closed form — which is exactly why it is the fallback when the math gets ugly. Its weaknesses are equally plain: the answer is only as precise as the grid is fine, the cost explodes as \(O(g^{d})\) for \(g\) grid points in \(d\) dimensions, and a coarse grid can stride right past a narrow peak.

## optimal
When the likelihood is differentiable, skip the grid and find the peak analytically. Write the log-likelihood, differentiate with respect to the parameter, set the derivative to zero, and solve the resulting *score equation* for \(\hat{\theta}\). For the Bernoulli coin, \(\ell(p)=k\log p+(n-k)\log(1-p)\) gives \(\frac{d\ell}{dp}=\frac{k}{p}-\frac{n-k}{1-p}\); setting this to zero and solving yields the clean closed form
\[
\hat{p}=\frac{k}{n},
\]
the sample proportion, computed in one pass over the data with no search at all. The same setting-the-derivative-to-zero recipe delivers the sample mean as the MLE of a Gaussian's \(\mu\), and \(\frac{1}{n}\sum(x_i-\bar{x})^2\) as the MLE of its variance. When the score equation has no closed-form solution — logistic regression, most neural networks — you do not abandon the principle; you maximize the log-likelihood numerically with **gradient ascent** (equivalently, minimize the negative log-likelihood with gradient descent), often via Newton's method using the second derivative for faster convergence. Either way the structure is identical: define the likelihood, take logs, climb to the peak. The closed form is just the lucky case where the climb finishes in a single algebraic step. Always confirm the critical point is a maximum (second derivative negative) and lies inside the valid parameter range, not on a boundary.

```python
import math

def mle_coin(flips):
    """Closed-form MLE of a coin's heads-probability: p_hat = k / n."""
    n = len(flips)
    k = sum(flips)          # number of heads (1 = head, 0 = tail)
    return k / n

flips = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1]   # 7 heads in 10
print(mle_coin(flips))                     # 0.7
```

## complexity
time: O(n) to compute the closed-form MLE (one pass to count heads / sum data); O(g * n) for grid search with g candidate parameter values; O(iters * n) for gradient-based maximization when no closed form exists
space: O(1) extra for the closed-form and gradient routes beyond the data; O(g) only if you store the full likelihood-over-grid for plotting
notes: The log-likelihood replaces a product of n probabilities with a sum of n logs -- the same maximizer but no floating-point underflow. Grid search precision is bounded by grid spacing and cost grows as O(g^d) in d dimensions. The MLE is consistent and asymptotically efficient under mild regularity conditions, but can be biased in small samples.

## pitfalls
- Treating the likelihood as a probability distribution over \(\theta\). \(L(\theta)\) is the probability of the *data*, read as a function of \(\theta\); it does **not** integrate to 1 over \(\theta\) and is not a density on the parameter. Normalizing it into a posterior requires a prior — that is Bayesian inference, a different object.
- Multiplying raw probabilities instead of summing logs. A product of hundreds or thousands of factors below 1 underflows to exactly 0.0 in floating point, and the optimizer then sees a flat zero everywhere. Always maximize \(\ell(\theta)=\sum\log P(x_i\mid\theta)\), never the raw product.
- Forgetting that the MLE can be biased. The maximum-likelihood estimate of a Gaussian's variance divides by \(n\), not \(n-1\), and systematically *underestimates* the true variance in small samples. Consistency (right in the limit) does not imply unbiasedness (right on average at finite \(n\)).
- Assuming the peak is unique and interior. Flat or multimodal likelihoods (mixture models, near-degenerate parameters) have several local optima, so gradient ascent can converge to the wrong one depending on initialization. Restart from several seeds and compare the achieved log-likelihood.
- Letting a zero count produce a degenerate estimate. Zero heads in \(n\) flips gives \(\hat{p}=0\), which then assigns probability 0 to any future head and makes the log-likelihood of a single head \(-\infty\). Smoothing (add-one / Laplace) or a prior keeps estimates off the hard boundary.

## interviewTips
- Lead with the probability-vs-likelihood distinction: probability fixes \(\theta\) and scores the data; likelihood fixes the data and scores \(\theta\). They share the formula \(L(\theta)=\prod_i P(x_i\mid\theta)\) but answer opposite questions — interviewers probe this constantly.
- Derive the coin MLE on the spot: \(\ell(p)=k\log p+(n-k)\log(1-p)\), set \(\frac{d\ell}{dp}=0\), get \(\hat{p}=k/n\). Being able to go from likelihood to log-likelihood to derivative to closed form fluently signals you understand the mechanism, not just the result.
- Connect MLE to machine learning: minimizing cross-entropy / negative log-likelihood loss *is* maximum likelihood, and least-squares regression is the MLE under Gaussian noise. Naming that equivalence shows you see the unifying principle behind the loss functions you train against.

## keyTakeaways
- The likelihood \(L(\theta)=\prod_i P(x_i\mid\theta)\) is the probability of the observed data read as a function of the parameter; the MLE \(\hat{\theta}_{MLE}\) is the \(\theta\) that maximizes it — the value making the data you actually saw most probable.
- Work in log space, \(\ell(\theta)=\sum_i\log P(x_i\mid\theta)\), to avoid underflow and turn the product into a sum; the peak (where \(\frac{d\ell}{d\theta}=0\)) is unchanged, and for a coin it lands at the clean closed form \(\hat{p}=k/n\).
- More data sharpens the likelihood curve, concentrating the peak around the true parameter — the MLE is consistent and efficient asymptotically, though it can be biased (e.g. variance divided by \(n\)) and degenerate at boundaries in small samples.

## code.python
```python
import math

def log_likelihood(p, k, n):
    if p <= 0.0 or p >= 1.0:
        return -math.inf
    return k * math.log(p) + (n - k) * math.log(1.0 - p)

def mle_grid(flips, steps=999):
    n = len(flips)
    k = sum(flips)                       # heads count
    best_p, best_ll = 0.0, -math.inf
    for i in range(1, steps + 1):
        p = i / (steps + 1)              # grid over (0, 1)
        ll = log_likelihood(p, k, n)
        if ll > best_ll:
            best_ll, best_p = ll, p
    return best_p, k / n                  # grid-argmax, closed form

flips = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1]   # 7 heads in 10
grid_p, closed_p = mle_grid(flips)
print(round(grid_p, 3), closed_p)         # 0.7 0.7
assert abs(grid_p - closed_p) < 1e-2
```

## code.javascript
```javascript
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function logLikelihood(p, k, n) {
  if (p <= 0 || p >= 1) return -Infinity;
  return k * Math.log(p) + (n - k) * Math.log(1 - p);
}

function mleGrid(flips, steps = 999) {
  const n = flips.length;
  const k = flips.reduce((a, b) => a + b, 0);
  let bestP = 0, bestLL = -Infinity;
  for (let i = 1; i <= steps; i++) {
    const p = i / (steps + 1);
    const ll = logLikelihood(p, k, n);
    if (ll > bestLL) { bestLL = ll; bestP = p; }
  }
  return { gridP: bestP, closedP: k / n };
}

const rng = mulberry32(7);
const trueP = 0.7;
const flips = Array.from({ length: 200 }, () => (rng() < trueP ? 1 : 0));
const { gridP, closedP } = mleGrid(flips);
console.log(gridP.toFixed(3), closedP.toFixed(3));
```

## code.java
```java
public class MLE {
    static double logLikelihood(double p, int k, int n) {
        if (p <= 0.0 || p >= 1.0) return Double.NEGATIVE_INFINITY;
        return k * Math.log(p) + (n - k) * Math.log(1.0 - p);
    }

    public static void main(String[] args) {
        int[] flips = {1, 1, 0, 1, 1, 0, 1, 0, 1, 1};   // 7 heads in 10
        int n = flips.length, k = 0;
        for (int f : flips) k += f;

        int steps = 999;
        double bestP = 0.0, bestLL = Double.NEGATIVE_INFINITY;
        for (int i = 1; i <= steps; i++) {
            double p = (double) i / (steps + 1);
            double ll = logLikelihood(p, k, n);
            if (ll > bestLL) { bestLL = ll; bestP = p; }
        }
        double closed = (double) k / n;
        System.out.printf("grid=%.3f closed=%.3f%n", bestP, closed);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
#include <limits>

double logLikelihood(double p, int k, int n) {
    if (p <= 0.0 || p >= 1.0) return -std::numeric_limits<double>::infinity();
    return k * std::log(p) + (n - k) * std::log(1.0 - p);
}

int main() {
    std::vector<int> flips = {1, 1, 0, 1, 1, 0, 1, 0, 1, 1};   // 7 heads in 10
    int n = flips.size(), k = 0;
    for (int f : flips) k += f;

    int steps = 999;
    double bestP = 0.0, bestLL = -std::numeric_limits<double>::infinity();
    for (int i = 1; i <= steps; i++) {
        double p = (double) i / (steps + 1);
        double ll = logLikelihood(p, k, n);
        if (ll > bestLL) { bestLL = ll; bestP = p; }
    }
    double closed = (double) k / n;
    std::printf("grid=%.3f closed=%.3f\n", bestP, closed);
    return 0;
}
```
