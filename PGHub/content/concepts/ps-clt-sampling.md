---
slug: ps-clt-sampling
module: prob-stats
title: Sampling Distributions and the Central Limit Theorem
subtitle: Why the average of almost anything turns into a bell curve — and how that lets you put error bars on an estimate.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 14
prereqs: [ps-expectation-variance, ps-distributions]
relatedProblems: []
references:
  - title: "Khan Academy — Sampling distributions & the central limit theorem"
    url: "https://www.khanacademy.org/math/statistics-probability/sampling-distributions-library"
    type: course
  - title: "StatQuest — The Central Limit Theorem, Clearly Explained!!!"
    url: "https://www.youtube.com/watch?v=YAlJCEDH2uY"
    type: video
  - title: "Seeing Theory — Chapter 4: Frequentist Inference (the CLT, sampling)"
    url: "https://seeing-theory.brown.edu/frequentist-inference/index.html"
    type: interactive
status: published
---

## intro
You can never measure a whole population — every voter, every user, every widget off the line. You measure a *sample* and hope it speaks for the whole. The bridge between the sample you have and the population you care about is the **sampling distribution**: not the spread of the raw data, but the spread of a *statistic* (usually the mean) across all the samples you might have drawn. And here a near-miraculous regularity appears. Whatever lumpy, skewed, two-humped shape the underlying data has, the distribution of its sample mean settles into a clean bell curve as the sample grows. That is the **Central Limit Theorem**, and it is the reason you can attach a confidence interval to almost any estimate without knowing the population's true shape.

## whyItMatters
The Central Limit Theorem is what makes statistics *work* in practice. Every poll's margin of error, every A/B test's significance, every quality-control chart, every "average response time is 240ms ± 8ms" is a direct application: the statistic is approximately normal, so its uncertainty is quantifiable with a single formula. Without the CLT you would need to know the exact distribution of your data to say anything about your estimate; with it, you need only the sample mean and standard deviation. It underpins t-tests, z-tests, regression standard errors, and the bootstrap. It also explains a deep empirical fact about the world — why so many natural quantities (measurement error, biological traits, aggregate noise) are bell-shaped: they are sums of many small independent effects, and the CLT says such sums are inevitably normal. For anyone estimating a quantity from data and needing to say *how sure* they are, the CLT is the foundation.

## intuition
First, separate two distributions that are easy to conflate. The **population distribution** is the spread of individual values — incomes, heights, dice rolls — and it can be any shape. A **sampling distribution** is the spread of a *summary statistic* computed from a sample, imagined over all possible samples of a fixed size \(n\). If you drew sample after sample, each of size \(n\), and recorded only the mean of each, the histogram of those means is the sampling distribution of the mean. It is a distribution *of an estimate*, not of raw data.

Two facts about the sampling distribution of the mean hold for *any* population with finite mean \(\mu\) and standard deviation \(\sigma\). First, the sample mean is **unbiased**: its expected value is the population mean, \(E[\bar{X}]=\mu\) — on average the estimate is right. Second, and crucially, its spread shrinks with sample size:
\[
\operatorname{SD}(\bar{X})=\frac{\sigma}{\sqrt{n}}.
\]
This quantity is the **standard error** — the typical distance between a sample mean and the true mean. The \(\sqrt{n}\) is the heartbeat of all of statistics: to halve your error you must *quadruple* your sample, a brutal diminishing return that explains why precise estimates are expensive. It comes straight from the variance rule for sums of independent variables: averaging \(n\) independent observations divides the variance by \(n\), hence the standard deviation by \(\sqrt{n}\).

Now the **Central Limit Theorem** itself: for large \(n\), the sampling distribution of the mean is approximately **normal**, regardless of the population's shape,
\[
\bar{X}\approx \mathcal{N}\!\left(\mu,\ \frac{\sigma^2}{n}\right).
\]
Start with a wildly non-normal population — a coin flip (two spikes), an exponential (heavy right tail), a bimodal mess — and the distribution of its sample mean still converges to the same symmetric bell. The lumps average out. With \(n\) as small as 30 the approximation is already good for mildly skewed data; very skewed or heavy-tailed populations need larger \(n\), and the theorem requires finite variance (it fails for pathological heavy-tailed distributions like the Cauchy, whose mean has no stabilizing variance). The intuition: each sample mean is a sum of many small independent contributions, no single one dominating, and such sums are drawn inexorably toward the Gaussian — the universal shape of "many small things added up."

The payoff is **confidence intervals**. Because \(\bar{X}\) is approximately \(\mathcal{N}(\mu, \sigma^2/n)\), about 95% of sample means land within \(1.96\) standard errors of \(\mu\). Invert that and an interval \(\bar{X}\pm 1.96\,\sigma/\sqrt{n}\) captures the true \(\mu\) about 95% of the time. In practice \(\sigma\) is unknown, so we plug in the sample standard deviation \(s\) and, for small \(n\), widen the interval using the t-distribution to account for that extra uncertainty. The correct reading of "95% confidence" is subtle and worth getting right: it is a statement about the *procedure* — 95% of intervals built this way contain the true mean — not a probability that this particular interval does. The CLT is what licenses the whole construction.

## visualization
```
source population (NOT bell-shaped)        sampling distribution of the mean Xbar
                                            as n grows, it tightens into a bell at mu

 exponential / skewed:                      n = 1   (just the raw data, skewed)
   #                                          # # # #
   ##                                         # # # # # #
   ###                                          (wide, skewed)
   ####____                                  ----------------------------------
                                            n = 5    narrower, less skewed
 bimodal (two peaks):                          .-##-.
   ##      ##                                 (still a hump)
   ##      ##                                ----------------------------------
   ##      ##                                n = 30+   a clean bell, centered at mu
   ##      ##                                       .--.
                                                  .'    '.
 mean = mu, std = sigma                          /  N(mu,  \
                                               _/  sigma^2/n)\_
                                                   |<- SE = sigma/sqrt(n) ->|
```

## bruteForce
The conceptual "brute force" is to **build the sampling distribution by simulation**: repeatedly draw a sample of size \(n\) from the population (or from your data), compute its mean, and accumulate thousands of those means into a histogram. This is genuinely illuminating — you literally watch the bell emerge as you crank \(n\) up — and it requires no theorem, just a random-number generator and patience. When the statistic is not a simple mean (a median, a ratio, a 90th percentile) and has no clean formula for its standard error, this *resampling* idea is not just pedagogy but the real method: the **bootstrap** resamples your data *with replacement* and recomputes the statistic each time to estimate its sampling distribution empirically. The cost is compute and the Monte Carlo error of \(1/\sqrt{m}\) in the number of resamples; the limitation of naive simulation from the population is that you usually do not *have* the population to draw from — which is exactly why the closed-form CLT result is so valuable.

## optimal
When the statistic is the mean (or any near-linear function of the data), skip the simulation and use the **CLT closed form**: the sample mean is approximately \(\mathcal{N}(\mu,\sigma^2/n)\), so the standard error is \(\sigma/\sqrt{n}\) and a \((1-\alpha)\) confidence interval is \(\bar{X}\pm z_{\alpha/2}\,s/\sqrt{n}\) (use the t-quantile instead of \(z\) when \(n\) is small and \(\sigma\) is estimated). This is one pass over the data to get \(\bar{X}\) and \(s\), then a constant-time interval — no resampling, no distributional assumptions beyond finite variance and large-enough \(n\). For complicated statistics where no standard-error formula exists, fall back to the **bootstrap**: resample with replacement \(m\) times, recompute the statistic each time, and read the confidence interval off the percentiles of those \(m\) values (the 2.5th and 97.5th percentiles give a 95% interval). The bootstrap is the general-purpose tool — it makes the sampling-distribution idea operational for *any* statistic — while the CLT formula is the fast exact route for the common case of a mean. Both rest on the same insight: inference is reasoning about the variability of a statistic across the samples you might have drawn.

```python
import math, random

def confidence_interval_clt(sample, z=1.96):
    """95% CI for the mean via the CLT (standard error = s / sqrt(n))."""
    n = len(sample)
    mean = sum(sample) / n
    var = sum((x - mean) ** 2 for x in sample) / (n - 1)   # sample variance
    se = math.sqrt(var) / math.sqrt(n)
    return mean, (mean - z * se, mean + z * se)

random.seed(7)
data = [random.expovariate(1.0) for _ in range(400)]       # heavy-skew population
mean, ci = confidence_interval_clt(data)
print(round(mean, 3), tuple(round(c, 3) for c in ci))       # ~1.0 with a tight CI around it
```

## complexity
time: O(n) to compute the sample mean and standard error and form a CLT confidence interval; O(m * n) for a bootstrap with m resamples of size n; simulation of the sampling distribution is O(samples * n)
space: O(1) extra for the CLT interval beyond the data; O(m) to store m bootstrap statistics for percentile intervals
notes: Standard error scales as sigma/sqrt(n) -- halving the error costs 4x the data. The CLT needs finite variance and "large enough" n (~30 for mild skew, more for heavy tails); it FAILS for infinite-variance distributions like the Cauchy. Use the t-distribution, not z, when sigma is estimated and n is small.

## pitfalls
- Confusing the population's spread with the sampling distribution's spread. The standard *deviation* describes individual data points; the standard *error* \(\sigma/\sqrt{n}\) describes the sample mean. Reporting one when you mean the other badly mis-sizes your uncertainty.
- Believing the CLT makes your *data* normal. It does not — the raw data keeps its original lumpy shape; only the distribution of the *mean* (or other aggregate statistic) becomes normal. Many people wrongly conclude their measurements are Gaussian.
- Applying the CLT with too-small \(n\) for the skew at hand. \(n=30\) suffices for mild skew but not for very skewed or heavy-tailed data, where the sampling distribution is still visibly non-normal; check, or bootstrap.
- Assuming the CLT always applies. It requires finite variance and independent observations. Heavy-tailed distributions without finite variance (Cauchy) never converge to a normal, and correlated samples (time series, clustered data) break the \(\sigma/\sqrt{n}\) scaling.
- Misreading "95% confidence" as a probability about the specific interval. The 95% refers to the long-run success rate of the *method*; a given computed interval either contains \(\mu\) or it does not. Stating "there's a 95% chance \(\mu\) is in *this* interval" is the classic misinterpretation.

## interviewTips
- State the CLT precisely: for i.i.d. data with finite mean \(\mu\) and variance \(\sigma^2\), the sample mean is approximately \(\mathcal{N}(\mu,\sigma^2/n)\) for large \(n\), *regardless of the population's shape* — that last clause is the whole point.
- Emphasize the \(\sqrt{n}\) law for the standard error \(\sigma/\sqrt{n}\) and its practical sting: quadrupling the sample only halves the error. Interviewers love this because it explains why precision is expensive.
- Distinguish the sampling distribution from the data distribution, and give the correct frequentist reading of a confidence interval (a statement about the procedure's long-run coverage, not a probability about the one interval). Mention the bootstrap as the general tool when no closed-form standard error exists.

## keyTakeaways
- A sampling distribution is the distribution of a *statistic* (usually the mean) over all possible samples of size \(n\); the sample mean is unbiased \((E[\bar{X}]=\mu)\) with standard error \(\sigma/\sqrt{n}\).
- The Central Limit Theorem says \(\bar{X}\) is approximately \(\mathcal{N}(\mu,\sigma^2/n)\) for large \(n\) regardless of the population's shape (given finite variance) — which is why averages of almost anything are bell-shaped and why error bars are universally applicable.
- A confidence interval \(\bar{X}\pm z\,s/\sqrt{n}\) (or the bootstrap for complex statistics) quantifies estimation uncertainty; "95% confidence" describes the long-run coverage of the procedure, not a probability about a single interval, and halving the error costs four times the data.

## code.python
```python
import math, random

def clt_interval(sample, z=1.96):
    n = len(sample)
    mean = sum(sample) / n
    var = sum((x - mean) ** 2 for x in sample) / (n - 1)
    se = math.sqrt(var / n)
    return mean, (mean - z * se, mean + z * se)

def bootstrap_interval(sample, stat=lambda s: sum(s) / len(s), reps=2000, seed=0):
    rng = random.Random(seed)
    n = len(sample)
    stats = sorted(stat([sample[rng.randrange(n)] for _ in range(n)]) for _ in range(reps))
    lo = stats[int(0.025 * reps)]
    hi = stats[int(0.975 * reps)]
    return lo, hi

random.seed(7)
data = [random.expovariate(1.0) for _ in range(400)]
print(tuple(round(v, 3) if not isinstance(v, tuple) else tuple(round(c, 3) for c in v)
            for v in clt_interval(data)))
print(tuple(round(c, 3) for c in bootstrap_interval(data)))
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

function cltInterval(sample, z = 1.96) {
  const n = sample.length;
  const mean = sample.reduce((a, b) => a + b, 0) / n;
  const variance = sample.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  return { mean, lo: mean - z * se, hi: mean + z * se };
}

function bootstrapInterval(sample, reps = 2000, seed = 0) {
  const rng = mulberry32(seed);
  const n = sample.length;
  const stats = [];
  for (let r = 0; r < reps; r++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += sample[Math.floor(rng() * n)];
    stats.push(s / n);
  }
  stats.sort((a, b) => a - b);
  return { lo: stats[Math.floor(0.025 * reps)], hi: stats[Math.floor(0.975 * reps)] };
}

const rng = mulberry32(7);
const data = Array.from({ length: 400 }, () => -Math.log(1 - rng())); // exponential(1)
console.log(cltInterval(data));
console.log(bootstrapInterval(data));
```

## code.java
```java
public class CLT {
    static double[] cltInterval(double[] sample, double z) {
        int n = sample.length;
        double mean = 0;
        for (double x : sample) mean += x;
        mean /= n;
        double var = 0;
        for (double x : sample) var += (x - mean) * (x - mean);
        var /= (n - 1);
        double se = Math.sqrt(var / n);
        return new double[]{mean, mean - z * se, mean + z * se};
    }
    public static void main(String[] args) {
        // Deterministic exponential(1) data via inverse transform on a fixed grid.
        double[] data = new double[400];
        long s = 7;
        for (int i = 0; i < data.length; i++) {
            s = (s * 6364136223846793005L + 1442695040888963407L);
            double u = ((s >>> 11) & ((1L << 53) - 1)) / (double) (1L << 53);
            data[i] = -Math.log(1 - u);
        }
        double[] ci = cltInterval(data, 1.96);
        System.out.printf("mean=%.3f CI=(%.3f, %.3f)%n", ci[0], ci[1], ci[2]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
#include <cstdint>

std::vector<double> cltInterval(const std::vector<double>& sample, double z) {
    int n = sample.size();
    double mean = 0;
    for (double x : sample) mean += x;
    mean /= n;
    double var = 0;
    for (double x : sample) var += (x - mean) * (x - mean);
    var /= (n - 1);
    double se = std::sqrt(var / n);
    return {mean, mean - z * se, mean + z * se};
}

int main() {
    std::vector<double> data(400);
    uint64_t s = 7;
    for (auto& d : data) {
        s = s * 6364136223846793005ULL + 1442695040888963407ULL;
        double u = ((s >> 11) & ((1ULL << 53) - 1)) / (double)(1ULL << 53);
        d = -std::log(1 - u);                       // exponential(1) via inverse transform
    }
    auto ci = cltInterval(data, 1.96);
    std::printf("mean=%.3f CI=(%.3f, %.3f)\n", ci[0], ci[1], ci[2]);
    return 0;
}
```
