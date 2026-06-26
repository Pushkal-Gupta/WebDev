---
slug: ps-distributions
module: prob-stats
title: The Distributions You Actually Meet
subtitle: Bernoulli, Binomial, Poisson, Normal — what each one models and the shape that gives it away.
difficulty: Beginner
position: 2
estimatedReadMinutes: 13
prereqs: [ps-random-variables]
relatedProblems: []
references:
  - title: "Khan Academy — Binomial random variables & the normal distribution"
    url: "https://www.khanacademy.org/math/statistics-probability/random-variables-stats-library/binomial-random-variables"
    type: course
  - title: "3Blue1Brown — Binomial distributions | Probabilities of probabilities, part 1"
    url: "https://www.youtube.com/watch?v=8idr1WZ1A7Q"
    type: video
  - title: "StatQuest — The Normal Distribution, Clearly Explained"
    url: "https://www.youtube.com/watch?v=rzFX5NWojp0"
    type: video
status: published
---

## intro
You do not invent a new distribution for every problem. A handful of named distributions show up again and again because they each capture one clean mechanism: a single yes/no trial, a count of successes, a count of rare events in a window, a measurement nudged by countless tiny influences. Learn the *mechanism* behind each — not just its formula — and you can look at a real situation and say "that's Binomial" or "that's Poisson" before touching any math. The shape on the page is a fingerprint: a spike, a hump, a long right tail, a perfect bell. This lesson is about matching mechanism to shape so the right distribution becomes obvious.

## whyItMatters
Picking the correct distribution is the modeling decision that everything else rests on. Count clicks per user with the wrong model and your confidence intervals lie; assume normal errors when the data has a heavy tail and your risk estimates are dangerously optimistic. The four distributions here cover an enormous fraction of practice: **Bernoulli/Binomial** for anything you can phrase as repeated yes/no trials (conversion rates, defect counts, A/B tests, click-through), **Poisson** for counts of independent events in a fixed window (requests per second, typos per page, arrivals per minute, mutations per genome), and the **Normal** for measurement noise, aggregate quantities, and — via the Central Limit Theorem — the sampling distribution of almost any average. Hypothesis tests, control charts, queueing models, and the loss functions of many ML models are all built directly on these shapes. Knowing them is knowing the working vocabulary of applied probability.

## intuition
**Bernoulli** is the atom: one trial with two outcomes, success (1) with probability \(p\) and failure (0) with probability \(1-p\). Its PMF is simply \(P(X=1)=p,\ P(X=0)=1-p\), and its mean is \(p\) with variance \(p(1-p)\). The variance is largest at \(p=0.5\) — a fair coin is maximally uncertain — and vanishes as \(p\) approaches 0 or 1, where the outcome is nearly certain. Every other distribution here can be built from or related to this atom.

**Binomial** counts successes in \(n\) *independent* Bernoulli trials with the same \(p\). Its PMF is
\[
P(X=k)=\binom{n}{k}p^k(1-p)^{n-k},
\]
read as: choose which \(k\) of the \(n\) trials succeed \(\binom{n}{k}\), each chosen success contributes \(p\), each of the remaining \(n-k\) failures contributes \(1-p\). The mean is \(np\) and the variance \(np(1-p)\) — just \(n\) times the Bernoulli moments, because the trials add independently. The shape is a hump centered near \(np\): symmetric when \(p=0.5\), skewed toward the edge it is pinned against when \(p\) is small or large. Toss 10 fair coins and the count of heads is Binomial(10, 0.5), peaking at 5.

**Poisson** is what the Binomial becomes when you have *many* trials each with a *tiny* success probability — the law of rare events. Hold the expected count \(\lambda = np\) fixed while \(n\to\infty\) and \(p\to 0\), and the Binomial PMF converges to
\[
P(X=k)=\frac{\lambda^k e^{-\lambda}}{k!}.
\]
Poisson models counts of independent events in a fixed interval of time or space: emails per hour, defects per square meter, goals per match. Its signature is that **mean equals variance**, both \(\lambda\) — a property you can check empirically to decide whether Poisson is even plausible (real count data is often *over*dispersed, variance larger than mean, which is a red flag). For small \(\lambda\) it is a right-skewed spike near zero; as \(\lambda\) grows it broadens and becomes nearly symmetric, foreshadowing the Normal.

**Normal** (Gaussian) is the smooth bell, the continuous distribution of measurements pushed around by many small, independent, additive effects — height, measurement error, aggregated noise. Its PDF is
\[
f(x)=\frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right),
\]
with mean \(\mu\) setting the center and standard deviation \(\sigma\) setting the width. It is perfectly symmetric, and the famous **empirical rule** says about 68% of mass lies within \(\mu\pm\sigma\), 95% within \(\mu\pm 2\sigma\), and 99.7% within \(\mu\pm 3\sigma\) — handy for sanity-checking. The Normal is special because of the Central Limit Theorem: sums and averages of *almost anything* drift toward it, which is why both the Binomial (for large \(np\)) and the Poisson (for large \(\lambda\)) start to look Gaussian. It is the attractor that aggregation pulls everything toward.

The through-line: Bernoulli is one trial; sum independent Bernoullis and you get Binomial; let the trials become numerous and rare and Binomial becomes Poisson; let any of these counts grow large and the bell of the Normal emerges. Four shapes, one family tree.

## visualization
```
Bernoulli(p=0.3)        Binomial(n=10, p=0.5)        Poisson(lambda=3)         Normal(mu, sigma)
  P(1)=0.3                symmetric hump near 5         right-skew spike            smooth bell
  P(0)=0.7                                                                          .--.
  ###                          ##                       ###                       .'    '.
  ###    #                  ## ## ##                    ### ##                   /        \
  ###    #                ## ## ## ## ##                ### ## ##              _/          \_
  --------                0 1 2 3 4 5 6 7 8 9 10        0 1 2 3 4 5 6 ...    -3s -2s -1s  mu +1s +2s +3s
   0   1                                                                       |<-- 68% -->|
                                                                              |<------- 95% ------->|
mean=p var=p(1-p)       mean=np  var=np(1-p)          mean=var=lambda         mean=mu  var=sigma^2
```

## bruteForce
The naive way to get any of these distributions is to **simulate the underlying mechanism and count**. Want Binomial(n, p)? Flip n biased coins, tally the successes, repeat a million times, and build a histogram. Want Poisson(\(\lambda\))? Simulate a Binomial with huge n and tiny p, or count events from a simulated arrival process. This always works and builds real intuition for *why* the shape comes out as it does — you watch the hump form. But it is wasteful and imprecise: you pay for millions of trials to approximate a probability that has an exact closed form, and the Monte Carlo error only shrinks like \(1/\sqrt{m}\), so squeezing out one more decimal place costs a hundredfold more samples. Simulation is the right tool for understanding and for distributions with no formula, but a poor one when an exact formula sits right there.

## optimal
Use the **closed-form PMF/PDF** — each evaluates in essentially constant time per value and is exact. The only real care needed is **numerical**: the Binomial coefficient \(\binom{n}{k}\) and the factorials \(k!\) in Poisson overflow fast (20! already exceeds a 64-bit integer), so compute in **log-space** and exponentiate at the end. For the Binomial, \(\log P(X=k)=\log\binom{n}{k}+k\log p+(n-k)\log(1-p)\), using \(\log\binom{n}{k}=\log\Gamma(n+1)-\log\Gamma(k+1)-\log\Gamma(n-k+1)\) with the log-gamma function. For Poisson, \(\log P(X=k)=k\log\lambda-\lambda-\log\Gamma(k+1)\). The Normal needs no special handling beyond evaluating the exponential. To answer interval and tail questions you accumulate the PMF (discrete) or integrate the PDF (continuous); the Normal's CDF has no elementary form but is computed from the error function \(\operatorname{erf}\), available in every numerical library. Choosing the *right* distribution remains the human's job; once chosen, the formulas make every probability a direct computation.

```python
import math

def binomial_pmf(k, n, p):
    log_choose = (math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1))
    return math.exp(log_choose + k * math.log(p) + (n - k) * math.log(1 - p))

def poisson_pmf(k, lam):
    return math.exp(k * math.log(lam) - lam - math.lgamma(k + 1))

print(round(binomial_pmf(5, 10, 0.5), 4))   # 0.2461  -- the peak of 10 fair coins
print(round(poisson_pmf(3, 3), 4))          # 0.2240  -- mode of Poisson(3)
print(round(sum(binomial_pmf(k, 10, 0.5) for k in range(11)), 6))  # 1.0
```

## complexity
time: O(1) per value with log-gamma helpers for Bernoulli/Binomial/Poisson PMFs and the Normal PDF; O(n) to build a full Binomial PMF over all n+1 values; CDFs are O(k) running sums (discrete) or one erf evaluation (Normal)
space: O(1) beyond the distribution parameters for a single PMF/PDF evaluation; O(n) to store a full discrete PMF table
notes: Always compute binomial coefficients and factorials in log-space (lgamma) and exponentiate at the end -- direct n!/(k!(n-k)!) overflows by n=21. Poisson's mean=variance identity is a quick diagnostic: if sample variance far exceeds the mean, the data is overdispersed and Poisson is the wrong model.

## pitfalls
- Using the Binomial when trials are not independent or \(p\) is not constant. Sampling without replacement, or a success probability that drifts over trials, breaks the Binomial assumptions — that situation is hypergeometric or something else, not Binomial.
- Computing \(\binom{n}{k}\) or \(k!\) directly in fixed-width integers. They overflow almost immediately; use log-gamma and exponentiate. A "probability" of \(10^{18}\) is an overflow bug, not a result.
- Forcing Poisson onto overdispersed data. Poisson demands variance \(=\) mean; real count data (web traffic, insurance claims) is frequently overdispersed, where a negative-binomial model fits far better. Check before assuming.
- Treating the Normal PDF value as a probability. \(f(x)\) is a density; \(f(\mu)=1/(\sigma\sqrt{2\pi})\) exceeds 1 for small \(\sigma\). Only the *area* under the curve over an interval is a probability.
- Assuming everything is Normal. Heavy-tailed phenomena (financial returns, file sizes, network delays) have far more extreme outliers than a Normal predicts; modeling them as Gaussian badly underestimates tail risk.

## interviewTips
- Anchor each distribution to its mechanism: Bernoulli = one yes/no trial; Binomial = count of successes in \(n\) independent identical trials; Poisson = count of rare independent events in a fixed window; Normal = continuous measurement shaped by many small additive effects.
- Quote the moments cold — Bernoulli \((p,\,p(1-p))\), Binomial \((np,\,np(1-p))\), Poisson \((\lambda,\,\lambda)\), Normal \((\mu,\,\sigma^2)\) — and call out Poisson's mean-equals-variance as its diagnostic signature.
- Explain the limits that connect them: Binomial \(\to\) Poisson as \(n\to\infty,\ p\to 0\) with \(np=\lambda\) fixed (law of rare events), and Binomial/Poisson \(\to\) Normal for large counts via the CLT. Showing the family tree signals depth.

## keyTakeaways
- Bernoulli is one yes/no trial \((p)\); summing \(n\) independent Bernoullis gives Binomial with PMF \(\binom{n}{k}p^k(1-p)^{n-k}\), mean \(np\), variance \(np(1-p)\).
- Poisson models counts of rare independent events with PMF \(\lambda^k e^{-\lambda}/k!\) and the signature property mean \(=\) variance \(=\lambda\); it is the limit of the Binomial when trials are many and successes rare.
- The Normal is the continuous bell \(f(x)=\frac{1}{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/2\sigma^2}\) with the 68–95–99.7 rule, and it is the attractor the Central Limit Theorem pulls sums and averages toward — which is why large Binomials and Poissons start to look Gaussian.

## code.python
```python
import math

def bernoulli_pmf(x, p):
    return p if x == 1 else (1 - p)

def binomial_pmf(k, n, p):
    log_c = math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)
    return math.exp(log_c + k * math.log(p) + (n - k) * math.log(1 - p))

def poisson_pmf(k, lam):
    return math.exp(k * math.log(lam) - lam - math.lgamma(k + 1))

def normal_pdf(x, mu=0.0, sigma=1.0):
    z = (x - mu) / sigma
    return math.exp(-0.5 * z * z) / (sigma * math.sqrt(2 * math.pi))

print(round(bernoulli_pmf(1, 0.3), 4))      # 0.3
print(round(binomial_pmf(5, 10, 0.5), 4))   # 0.2461
print(round(poisson_pmf(3, 3), 4))          # 0.2240
print(round(normal_pdf(0.0), 4))            # 0.3989
```

## code.javascript
```javascript
function logGamma(z) {
  // Lanczos approximation for ln(Gamma(z)).
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function binomialPmf(k, n, p) {
  const logC = logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function poissonPmf(k, lam) {
  return Math.exp(k * Math.log(lam) - lam - logGamma(k + 1));
}
function normalPdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

console.log(binomialPmf(5, 10, 0.5).toFixed(4)); // 0.2461
console.log(poissonPmf(3, 3).toFixed(4));        // 0.2240
console.log(normalPdf(0).toFixed(4));            // 0.3989
```

## code.java
```java
public class Distributions {
    static double binomialPmf(int k, int n, double p) {
        double logC = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
        return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
    }
    static double poissonPmf(int k, double lam) {
        return Math.exp(k * Math.log(lam) - lam - lgamma(k + 1));
    }
    static double normalPdf(double x, double mu, double sigma) {
        double z = (x - mu) / sigma;
        return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }
    static double lgamma(double x) {
        double[] g = {76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5};
        double y = x, tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        double ser = 1.000000000190015;
        for (int j = 0; j < 6; j++) ser += g[j] / ++y;
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    }
    public static void main(String[] args) {
        System.out.printf("%.4f%n", binomialPmf(5, 10, 0.5)); // 0.2461
        System.out.printf("%.4f%n", poissonPmf(3, 3));        // 0.2240
        System.out.printf("%.4f%n", normalPdf(0, 0, 1));      // 0.3989
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double binomialPmf(int k, int n, double p) {
    double logC = std::lgamma(n + 1) - std::lgamma(k + 1) - std::lgamma(n - k + 1);
    return std::exp(logC + k * std::log(p) + (n - k) * std::log(1 - p));
}
double poissonPmf(int k, double lam) {
    return std::exp(k * std::log(lam) - lam - std::lgamma(k + 1));
}
double normalPdf(double x, double mu, double sigma) {
    double z = (x - mu) / sigma;
    return std::exp(-0.5 * z * z) / (sigma * std::sqrt(2 * M_PI));
}

int main() {
    std::printf("%.4f\n", binomialPmf(5, 10, 0.5)); // 0.2461
    std::printf("%.4f\n", poissonPmf(3, 3));        // 0.2240
    std::printf("%.4f\n", normalPdf(0, 0, 1));      // 0.3989
    return 0;
}
```
