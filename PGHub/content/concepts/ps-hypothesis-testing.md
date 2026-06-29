---
slug: ps-hypothesis-testing
module: prob-stats
title: Hypothesis Testing and the z-Test
subtitle: How to decide whether a result is real or just noise — null vs alternative, p-values, significance, and the two ways you can be wrong.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 15
prereqs: [ps-clt-sampling, ps-distributions]
relatedProblems: []
references:
  - title: "Khan Academy — Significance tests (hypothesis testing) for a single sample"
    url: "https://www.khanacademy.org/math/statistics-probability/significance-tests-one-sample"
    type: course
  - title: "StatQuest — p-values: What they are and how to interpret them"
    url: "https://www.youtube.com/watch?v=vemZtEM63GY"
    type: video
  - title: "Seeing Theory — Chapter 4: Frequentist Inference"
    url: "https://seeing-theory.brown.edu/frequentist-inference/index.html"
    type: interactive
status: published
---

## intro
You ran an A/B test and the new button got a 3% higher click rate. Real improvement, or just the luck of which users showed up that week? You measured a coin that landed heads 60 times in 100 flips. Bent, or boring? **Hypothesis testing** is the formal procedure for answering exactly this kind of question: it gives you a disciplined way to decide whether an observed effect is large enough to be taken seriously, or small enough to be dismissed as the random wobble any finite sample will produce. The whole machinery rests on one move — assume nothing interesting is happening, then ask how surprised that assumption should be by your data.

## whyItMatters
Every experiment, every clinical trial, every quality-control alarm, every "statistically significant" headline runs on this logic. Without it, you have no principled line between a signal and the noise that always accompanies sampling — you would chase every random uptick and ignore every real one. Hypothesis testing converts a fuzzy "does this look different?" into a number, the **p-value**, and a yes/no decision against a pre-committed threshold. It is the backbone of the scientific method's empirical half, the gate every drug passes before approval, and the engine behind product experimentation at scale. Understanding it also inoculates you against its abuse: p-hacking, multiple-comparison fishing, and the rampant misreading of "significant" as "important" all stem from people who learned the recipe but not the meaning.

## intuition
Start with the courtroom analogy, because it captures the asymmetry exactly. The **null hypothesis** \(H_0\) is the defendant assumed innocent: "nothing is going on — the coin is fair, the drug does nothing, the two groups are the same." The **alternative hypothesis** \(H_1\) is the prosecution's claim: "there is a real effect." You do not set out to prove \(H_1\) directly. Instead you ask: *if the null were true, how unlikely would data this extreme be?* If extremely unlikely, you reject the null — the evidence is too strong to keep believing in innocence. If not, you fail to reject — not because innocence is proven, but because the evidence didn't clear the bar.

The number that quantifies "how unlikely" is the **p-value**: the probability, *assuming \(H_0\) is true*, of seeing a test statistic at least as extreme as the one you observed. A tiny p-value means your data would be a freak event under the null, so the null looks wrong. Read this carefully — the p-value is computed in a world where the null holds, so it can never be the probability that the null is true. It is \(P(\text{data this extreme} \mid H_0)\), not \(P(H_0 \mid \text{data})\).

Before peeking at the data you pick a **significance level** \(\alpha\), the threshold of surprise you'll accept — conventionally \(0.05\). If \(p < \alpha\), reject \(H_0\); otherwise fail to reject. Choosing \(\alpha\) is choosing how often you're willing to cry wolf: a **Type I error** is rejecting a true null (a false positive — declaring an effect that isn't real), and by construction it happens with probability \(\alpha\). The mirror mistake is a **Type II error**: failing to reject a false null (a false negative — missing a real effect), with probability \(\beta\). The **power** of a test, \(1-\beta\), is its ability to catch a real effect when one exists; it grows with sample size, effect size, and a larger \(\alpha\). There is a tension you can't escape: shrinking \(\alpha\) to avoid false positives makes \(\beta\) rise, costing you power. The only way to lower both at once is to gather more data.

Finally, **one- vs two-tailed**. A two-tailed test asks "is the parameter different in *either* direction?" and splits \(\alpha\) across both tails of the null distribution. A one-tailed test asks a directional question ("is it *larger*?") and puts all of \(\alpha\) in one tail, giving more power for that direction at the price of being blind to the other. The concrete workhorse is the **z-test**: standardize your statistic into \(z=(\bar{x}-\mu_0)/(\sigma/\sqrt{n})\), then read the tail probability off the standard normal.

## visualization
```
        null distribution H0:  N(0, 1) of the z-statistic
                          .-"""""-.
                       .'           '.
                      /               \        <- bulk: typical values if H0 true
                     /                 \
        ----------.-'                   '-.----------------
   reject region |                         |  reject region
   (alpha/2)     |        fail to reject   |  (alpha/2)
        #########|                         |#########
   -z*=-1.96     |                         |  +1.96=z*    obs z -> | (here)
                 |<------ keep H0 here ---->|             p = shaded tail beyond obs
   shaded tails past +/-1.96 sum to alpha = 0.05
   if observed z lands in a shaded reject region  =>  p < alpha  =>  Reject H0
```

## bruteForce
The conceptual "brute force" is a **permutation / simulation test** that needs no formula at all. To test whether two groups differ, pool all the observations, then repeatedly reshuffle the group labels at random and recompute the difference in means each time. This builds, by direct Monte Carlo, the distribution of the statistic *under the null* that the labels carry no information. The p-value is simply the fraction of shuffles whose statistic is at least as extreme as the one you actually observed. It assumes nothing about normality, makes the meaning of "p-value" almost tangible (you literally count how often pure chance beats your result), and is the honest fallback whenever the sampling distribution has no closed form. Its cost is compute: thousands of reshuffles, each an \(O(n)\) recomputation, with a Monte Carlo error of \(1/\sqrt{m}\) in the number of permutations.

## optimal
When the statistic is a sample mean and \(n\) is reasonably large, skip the simulation: the Central Limit Theorem hands you the null distribution in closed form. Under \(H_0:\mu=\mu_0\), the sample mean is approximately \(\mathcal{N}(\mu_0,\sigma^2/n)\), so the standardized statistic
\[
z=\frac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}
\]
is approximately standard normal. The two-tailed p-value is then \(p = 2\,\big(1-\Phi(|z|)\big)\) where \(\Phi\) is the standard-normal CDF; a one-tailed test uses a single tail. Compare \(p\) to \(\alpha\), or equivalently compare \(|z|\) to the **critical value** \(z^*\) (for \(\alpha=0.05\) two-tailed, \(z^*=1.96\)): reject when \(|z|>z^*\). This is a single pass over the data to get \(\bar{x}\), then constant-time arithmetic — no resampling. When \(\sigma\) is unknown and estimated by the sample standard deviation \(s\), and especially when \(n\) is small, swap the normal for the **t-distribution** with \(n-1\) degrees of freedom (the t-test) to account for the extra uncertainty in estimating \(\sigma\); for large \(n\) the t-distribution converges to the normal and the two agree. The same standardize-then-read-the-tail recipe generalizes to proportions (z-test for a proportion), differences of means (two-sample z/t), and beyond — the test statistic changes, the logic does not.

```python
import math

def z_test(xbar, mu0, sigma, n, alpha=0.05):
    z = (xbar - mu0) / (sigma / math.sqrt(n))
    p = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))   # two-tailed
    return z, p, ("reject H0" if p < alpha else "fail to reject H0")

print(z_test(xbar=104.5, mu0=100.0, sigma=15.0, n=36))   # z, p, decision
```

## complexity
time: O(n) to compute the sample mean and the z-statistic, then O(1) to evaluate the normal CDF and decide; O(m * n) for a permutation/simulation test with m reshuffles
space: O(1) extra beyond the sample for the z-test; O(m) to store m permutation statistics if you want their full distribution
notes: The z-test assumes the sampling distribution of the mean is approximately normal -- true by the CLT for large n, or exactly when the data are normal with known sigma. Use the t-distribution (df = n-1) when sigma is estimated and n is small. Power grows with n, effect size, and alpha; lowering alpha to cut Type I error raises Type II error unless you add data.

## pitfalls
- The p-value is **not** the probability that the null hypothesis is true. It is \(P(\text{data this extreme}\mid H_0)\), computed *assuming* the null — the reverse conditional \(P(H_0\mid\text{data})\) requires a prior and Bayes' theorem, which the p-value never uses.
- **Failing to reject \(H_0\) is not accepting it.** A large p-value means the evidence was insufficient, not that the null is proven true. Absence of evidence (often just low power from a small sample) is not evidence of absence.
- **Multiple comparisons inflate Type I error.** Run 20 independent tests at \(\alpha=0.05\) and you expect one false positive even if every null is true. Correct for it (Bonferroni, Benjamini–Hochberg) or you'll "discover" noise.
- **p-hacking.** Trying many analyses, peeking at the data and stopping when \(p<0.05\), or quietly dropping inconvenient cases all break the guarantee — the reported p-value is only valid if \(\alpha\), the test, and the stopping rule were fixed *before* seeing the data.
- **Statistical significance is not practical significance.** With a huge \(n\), a trivially small effect can clear \(p<0.05\) while being meaningless in the real world. Always report the effect size and a confidence interval alongside the p-value.

## interviewTips
- Define the p-value precisely and resist the trap: it is the probability, *under \(H_0\)*, of data at least as extreme as observed — never the probability that \(H_0\) is true, and never the probability your result is due to chance in the loose sense people mean.
- Draw the Type I / Type II table on demand: Type I = false positive = reject a true null (rate \(\alpha\)); Type II = false negative = keep a false null (rate \(\beta\)); power \(=1-\beta\). Explain the trade-off — shrinking \(\alpha\) raises \(\beta\), and only more data lowers both.
- Walk through a z-test end to end: state \(H_0\) and \(H_1\), pick \(\alpha\) and one- vs two-tailed, compute \(z=(\bar{x}-\mu_0)/(\sigma/\sqrt{n})\), get the p-value from \(\Phi\), compare to \(\alpha\), and state the decision in plain words.

## keyTakeaways
- Hypothesis testing assumes the null \(H_0\) ("no effect"), then rejects it only when the data would be too extreme to plausibly arise under it; the p-value \(=P(\text{data this extreme}\mid H_0)\) measures that surprise and is compared to a pre-chosen \(\alpha\).
- Two errors are unavoidable: Type I (false positive, rate \(\alpha\)) and Type II (false negative, rate \(\beta\)); power \(1-\beta\) is the chance of catching a real effect, and you buy lower error rates mainly with more data.
- The z-test standardizes a mean into \(z=(\bar{x}-\mu_0)/(\sigma/\sqrt{n})\) and reads the tail off the normal; switch to the t-distribution when \(\sigma\) is estimated and \(n\) is small, and always report effect size since significant never means important.

## code.python
```python
import math

def normal_cdf(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def z_test(xbar, mu0, sigma, n, alpha=0.05, two_tailed=True):
    z = (xbar - mu0) / (sigma / math.sqrt(n))
    if two_tailed:
        p = 2 * (1 - normal_cdf(abs(z)))
    else:
        p = 1 - normal_cdf(z)            # tests H1: mu > mu0
    decision = "reject H0" if p < alpha else "fail to reject H0"
    return z, p, decision

# A factory claims mean weight mu0 = 100g, known sigma = 15g.
# A sample of 36 has mean 104.5g. Is the mean really 100?
z, p, decision = z_test(xbar=104.5, mu0=100.0, sigma=15.0, n=36)
print(f"z = {z:.3f}")
print(f"p = {p:.4f} (two-tailed)")
print(f"decision at alpha=0.05: {decision}")
```

## code.javascript
```javascript
function erf(x) {
  // Abramowitz & Stegun 7.1.26 approximation
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function zTest(xbar, mu0, sigma, n, alpha = 0.05, twoTailed = true) {
  const z = (xbar - mu0) / (sigma / Math.sqrt(n));
  const p = twoTailed ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z);
  const decision = p < alpha ? "reject H0" : "fail to reject H0";
  return { z, p, decision };
}

const { z, p, decision } = zTest(104.5, 100.0, 15.0, 36);
console.log(`z = ${z.toFixed(3)}`);
console.log(`p = ${p.toFixed(4)} (two-tailed)`);
console.log(`decision at alpha=0.05: ${decision}`);
```

## code.java
```java
public class ZTest {
    static double erf(double x) {
        int s = x < 0 ? -1 : 1;
        x = Math.abs(x);
        double t = 1 / (1 + 0.3275911 * x);
        double y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
                - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
        return s * y;
    }

    static double normalCdf(double z) {
        return 0.5 * (1 + erf(z / Math.sqrt(2)));
    }

    static double[] zTest(double xbar, double mu0, double sigma, int n, boolean twoTailed) {
        double z = (xbar - mu0) / (sigma / Math.sqrt(n));
        double p = twoTailed ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z);
        return new double[]{z, p};
    }

    public static void main(String[] args) {
        double alpha = 0.05;
        double[] r = zTest(104.5, 100.0, 15.0, 36, true);
        String decision = r[1] < alpha ? "reject H0" : "fail to reject H0";
        System.out.printf("z = %.3f%n", r[0]);
        System.out.printf("p = %.4f (two-tailed)%n", r[1]);
        System.out.printf("decision at alpha=0.05: %s%n", decision);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double normalCdf(double z) {
    return 0.5 * (1 + std::erf(z / std::sqrt(2.0)));   // std::erf is exact enough
}

void zTest(double xbar, double mu0, double sigma, int n,
           bool twoTailed, double& z, double& p) {
    z = (xbar - mu0) / (sigma / std::sqrt((double)n));
    p = twoTailed ? 2 * (1 - normalCdf(std::fabs(z))) : 1 - normalCdf(z);
}

int main() {
    double alpha = 0.05, z, p;
    zTest(104.5, 100.0, 15.0, 36, true, z, p);
    const char* decision = p < alpha ? "reject H0" : "fail to reject H0";
    std::printf("z = %.3f\n", z);
    std::printf("p = %.4f (two-tailed)\n", p);
    std::printf("decision at alpha=0.05: %s\n", decision);
    return 0;
}
```
