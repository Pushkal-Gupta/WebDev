---
slug: ps-ab-testing
module: prob-stats
title: A/B Testing and the Two-Proportion z-Test
subtitle: Deciding whether a new button, headline, or checkout flow really converts better — or whether the difference you see is just noise.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 15
prereqs: [ps-hypothesis-testing, ps-clt-sampling]
relatedProblems: []
references:
  - title: "Khan Academy — Inference comparing two groups (two-sample inference)"
    url: "https://www.khanacademy.org/math/statistics-probability/significance-tests-confidence-intervals-two-samples"
    type: course
  - title: "StatQuest — Hypothesis Testing and the Null Hypothesis, Clearly Explained!!!"
    url: "https://www.youtube.com/watch?v=0oc49DyA3hU"
    type: video
  - title: "Seeing Theory — Chapter 4: Frequentist Inference"
    url: "https://seeing-theory.brown.edu/frequentist-inference/index.html"
    type: interactive
---

## intro
Ship the green button to half your users, the blue button to the other half, and watch which converts better. That is an **A/B test**: a randomized experiment comparing a control group A against a variant B on a single outcome, usually a conversion — clicked, signed up, purchased. The trap is that B will *almost always* show a different rate than A purely by chance, even when the two are truly identical. The job of the statistics is to separate a real improvement from the random flicker of finite samples. The workhorse for a binary conversion outcome is the **two-proportion z-test**, and getting it right is the difference between shipping a winner and chasing noise.

## whyItMatters
A/B testing is how modern product, marketing, and growth decisions are actually made — every headline, pricing page, onboarding flow, and recommendation tweak at scale is validated this way rather than by opinion. The cost of getting the statistics wrong is concrete: ship a "winner" that was really noise and you bank a phantom lift that evaporates, or kill a genuine improvement because the test was underpowered. The same two-sample machinery powers clinical trials (treatment vs placebo), public-policy evaluation, and quality control. Understanding the two-proportion z-test, what a p-value and confidence interval on the difference actually claim, and the ways a test silently lies (peeking, multiple variants, sample-ratio mismatch) is core literacy for anyone who makes data-driven calls. It is also one of the most common applied-statistics interview topics in tech.

## intuition
Start with what you measure. Group A had \(n_A\) visitors and \(x_A\) conversions, giving an observed rate \(\hat{p}_A = x_A/n_A\); group B gives \(\hat{p}_B = x_B/n_B\). The **observed lift** is the difference \(\hat{p}_B - \hat{p}_A\). The entire question is: is that gap big enough to be real, or is it the kind of wobble two identical coins would produce?

To answer, imagine the **null hypothesis** \(H_0\): A and B convert at the *same* true rate. Under \(H_0\), the difference \(\hat{p}_B - \hat{p}_A\) is a random quantity centered at zero. The Central Limit Theorem tells us each \(\hat{p}\) is approximately normal, so their difference is too. Its spread — the **standard error of the difference** — measures how far apart two sample rates typically land *when nothing is really different*. Because under the null both groups share one true rate, we estimate that common rate by pooling all the data together, \(\hat{p} = (x_A + x_B)/(n_A + n_B)\), and plug it into

\[
SE = \sqrt{\hat{p}(1-\hat{p})\left(\tfrac{1}{n_A}+\tfrac{1}{n_B}\right)}.
\]

Now the **test statistic** simply asks how many standard errors the observed gap sits away from zero:

\[
z = \frac{\hat{p}_B - \hat{p}_A}{SE}.
\]

A \(z\) of 0.5 means the gap is well within everyday noise; a \(z\) of 3 means a gap this large would almost never happen if A and B were truly equal. We convert \(z\) into a **p-value** — the probability, under the null, of seeing a gap at least this extreme in either direction — and reject the null when it falls below a chosen threshold \(\alpha\) (typically 0.05). Equivalently, build a **confidence interval** on the true difference, \((\hat{p}_B-\hat{p}_A)\pm z_{\alpha/2}\,SE\): if that interval excludes zero, the difference is statistically significant. The CI is the more honest summary because it shows not just *whether* B differs but *by how much*, error bars included.

## visualization
```
       difference distribution under H0  (true gap = 0)
       ........... what noise alone produces ...........

                       .--""--.
                     .'        '.
                    /            \         observed gap p_B - p_A
                  .'              '.              v
        _________/                  \____________ * ________
        |        |        0         |            |         |
       -2SE    -1SE       ^        +1SE        +2SE      +3SE
                          null
        |<----------- 95% CI on the difference ----------->|
        [   lo .................................. hi  ]
   significant  <=>  this bracket does NOT straddle 0
```

## bruteForce
The "brute force" route is **simulation under the null**. Assume A and B share the pooled rate \(\hat{p}\), then repeatedly simulate two fresh groups of sizes \(n_A\) and \(n_B\) by flipping that many biased coins, recompute the difference \(\hat{p}_B-\hat{p}_A\) for each replicate, and accumulate thousands of those differences into a histogram. That histogram *is* the null distribution of the gap. Read the p-value off directly: the fraction of simulated gaps at least as extreme as the one you actually observed. This is a permutation/Monte-Carlo test — it needs no normal approximation and works even for tiny samples where the bell shape is shaky. The cost is compute and a Monte-Carlo error of \(1/\sqrt{m}\) in the number of replicates, and you must reshuffle correctly, but it is conceptually bulletproof and a great sanity check on the closed-form answer.

## optimal
For the common case — two reasonably sized groups and a binary outcome — skip the simulation and use the **closed-form two-proportion z-test**. Compute the two rates \(\hat{p}_A,\hat{p}_B\), the pooled rate \(\hat{p}=(x_A+x_B)/(n_A+n_B)\), the pooled standard error \(SE=\sqrt{\hat{p}(1-\hat{p})(1/n_A+1/n_B)}\), then the statistic \(z=(\hat{p}_B-\hat{p}_A)/SE\). Turn \(z\) into a two-tailed p-value via the standard normal CDF, \(p = 2(1-\Phi(|z|))\), and reject \(H_0\) when \(p<\alpha\). This is two passes of counting and a constant-time formula — no resampling. Report alongside it the **confidence interval on the difference**, \((\hat{p}_B-\hat{p}_A)\pm z_{\alpha/2}\,SE_{\text{unpooled}}\), using the unpooled \(SE=\sqrt{\hat{p}_A(1-\hat{p}_A)/n_A+\hat{p}_B(1-\hat{p}_B)/n_B}\) for the interval (the pooled SE is correct for the *test* under the null; the unpooled SE is correct for *estimating* the actual difference). Before running, fix \(\alpha\), the direction, and the **sample size** in advance: the detectable lift at a given power scales like the noise, so smaller true effects demand quadratically more traffic. Decide once, at the planned sample size — not by watching the dashboard and stopping when it first looks good.

```python
import math

def two_prop_z(xA, nA, xB, nB, alpha=0.05):
    pA, pB = xA / nA, xB / nB
    p = (xA + xB) / (nA + nB)                      # pooled rate (null assumes equal)
    se = math.sqrt(p * (1 - p) * (1 / nA + 1 / nB))
    z = (pB - pA) / se
    pval = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))
    return pA, pB, z, pval, pval < alpha

print(two_prop_z(200, 5000, 250, 5000))   # control 4.0% vs variant 5.0%
```

## complexity
time: O(1) for the closed-form two-proportion z-test once the conversion counts are tallied (the tally itself is O(n_A + n_B) over the raw events); O(m * (n_A + n_B)) for a Monte-Carlo / permutation test with m replicates
space: O(1) extra for the z-test and confidence interval beyond the counts; O(m) to store m simulated differences if you build the null histogram empirically
notes: The detectable effect at fixed power scales with the standard error, so halving the minimum detectable lift roughly QUADRUPLES the required traffic. Use the POOLED SE for the hypothesis test (it assumes the null) and the UNPOOLED SE for the confidence interval on the true difference. The normal approximation needs enough conversions per arm (rule of thumb: at least ~5-10 successes and failures each); for tiny counts use Fisher's exact test or the simulation route.

## pitfalls
- **Peeking and early stopping.** Repeatedly checking the test and stopping the moment \(p<0.05\) massively inflates the false-positive rate — with continuous monitoring the chance of a spurious "win" can exceed 30%, not 5%. Fix the sample size (or use a proper sequential / always-valid method) before you start, and only decide at that point.
- **Multiple variants = multiple comparisons.** Testing A vs B, C, D, E at \(\alpha=0.05\) each means roughly a \(1-(0.95)^4\approx 19\%\) chance at least one fires by luck. Apply a Bonferroni or Benjamini-Hochberg correction, or you will "find" a winner that isn't one.
- **Sample-ratio mismatch.** A 50/50 split that arrives as 52/48 is a red flag: a bug in randomization, logging, or bot filtering is corrupting the assignment, and *every* downstream number is suspect. Check the split with its own chi-square test before trusting the result.
- **Confusing statistical with practical significance.** With millions of users a 0.01% lift can be highly significant yet worthless. Always read the *confidence interval on the lift*, not just the p-value, and weigh whether the effect size clears a business-meaningful threshold.
- **Underpowered tests / ignoring the base rate.** Running a test on too little traffic for the true effect means you will usually fail to detect a real improvement (high Type II error) and the wins you do find are exaggerated. Compute the required sample size from the base conversion rate and the minimum lift worth detecting before launching.

## interviewTips
- Write the pipeline cleanly: define \(H_0\) (equal rates), compute \(\hat{p}_A,\hat{p}_B\), the pooled \(\hat{p}\), the pooled \(SE=\sqrt{\hat{p}(1-\hat{p})(1/n_A+1/n_B)}\), then \(z=(\hat{p}_B-\hat{p}_A)/SE\), a two-tailed p-value, and the decision at \(\alpha\). Mention you'd report the confidence interval on the lift alongside the p-value.
- Be ready for "the dashboard hit significance on day 2 — ship it?" The answer is no: peeking inflates false positives, so you commit to a pre-computed sample size (or a sequential test) and decide only then. This is the single most common A/B follow-up.
- Distinguish the pooled SE (for the test, which assumes the null) from the unpooled SE (for the CI on the actual difference), and separate statistical from practical significance — a tiny but significant lift on huge traffic may not be worth shipping.

## keyTakeaways
- An A/B test compares two conversion rates with the two-proportion z-test: pool the data to estimate the shared null rate, form \(SE=\sqrt{\hat{p}(1-\hat{p})(1/n_A+1/n_B)}\), and judge the gap via \(z=(\hat{p}_B-\hat{p}_A)/SE\) and its two-tailed p-value.
- The confidence interval on the difference is the honest summary: if it excludes zero the lift is significant, and its width tells you the effect size with error bars — read it, not just the p-value, and separate statistical from practical significance.
- The integrity of the test lives or dies on discipline: fix the sample size in advance (no peeking), correct for multiple variants, check the split ratio, and power the test for the smallest lift worth detecting — halving that detectable lift roughly quadruples the traffic needed.

## code.python
```python
import math

def normal_cdf(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def ab_test(xA, nA, xB, nB, alpha=0.05):
    pA, pB = xA / nA, xB / nB
    pooled = (xA + xB) / (nA + nB)
    se_test = math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB))
    z = (pB - pA) / se_test
    pval = 2 * (1 - normal_cdf(abs(z)))
    se_ci = math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)
    diff = pB - pA
    lo, hi = diff - 1.96 * se_ci, diff + 1.96 * se_ci
    return pA, pB, z, pval, (lo, hi), pval < alpha

pA, pB, z, pval, ci, sig = ab_test(200, 5000, 250, 5000)
print(f"pA={pA:.4f} pB={pB:.4f} lift={pB - pA:+.4f}")
print(f"z={z:.3f} p={pval:.4f} CI=({ci[0]:+.4f}, {ci[1]:+.4f})")
print("significant" if sig else "not significant")
```

## code.javascript
```javascript
function normalCdf(z) {
  // Abramowitz-Stegun erf approximation
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-((z / Math.SQRT2) * (z / Math.SQRT2)));
  const erf = z < 0 ? -y : y;
  return 0.5 * (1 + erf);
}

function abTest(xA, nA, xB, nB, alpha = 0.05) {
  const pA = xA / nA;
  const pB = xB / nB;
  const pooled = (xA + xB) / (nA + nB);
  const seTest = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
  const z = (pB - pA) / seTest;
  const pval = 2 * (1 - normalCdf(Math.abs(z)));
  const seCi = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  const diff = pB - pA;
  return { pA, pB, z, pval, lo: diff - 1.96 * seCi, hi: diff + 1.96 * seCi, sig: pval < alpha };
}

const r = abTest(200, 5000, 250, 5000);
console.log(`pA=${r.pA.toFixed(4)} pB=${r.pB.toFixed(4)} lift=${(r.pB - r.pA).toFixed(4)}`);
console.log(`z=${r.z.toFixed(3)} p=${r.pval.toFixed(4)} CI=(${r.lo.toFixed(4)}, ${r.hi.toFixed(4)})`);
console.log(r.sig ? 'significant' : 'not significant');
```

## code.java
```java
public class ABTest {
    static double normalCdf(double z) {
        // erf via Abramowitz-Stegun 7.1.26
        double az = Math.abs(z) / Math.sqrt(2);
        double t = 1 / (1 + 0.3275911 * az);
        double y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
                - 0.284496736) * t + 0.254829592) * t * Math.exp(-az * az);
        double erf = z < 0 ? -y : y;
        return 0.5 * (1 + erf);
    }

    public static void main(String[] args) {
        double xA = 200, nA = 5000, xB = 250, nB = 5000, alpha = 0.05;
        double pA = xA / nA, pB = xB / nB;
        double pooled = (xA + xB) / (nA + nB);
        double seTest = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
        double z = (pB - pA) / seTest;
        double pval = 2 * (1 - normalCdf(Math.abs(z)));
        double seCi = Math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB);
        double diff = pB - pA;
        System.out.printf("pA=%.4f pB=%.4f lift=%+.4f%n", pA, pB, diff);
        System.out.printf("z=%.3f p=%.4f CI=(%+.4f, %+.4f)%n",
                z, pval, diff - 1.96 * seCi, diff + 1.96 * seCi);
        System.out.println(pval < alpha ? "significant" : "not significant");
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double normalCdf(double z) {
    return 0.5 * (1 + std::erf(z / std::sqrt(2.0)));
}

int main() {
    double xA = 200, nA = 5000, xB = 250, nB = 5000, alpha = 0.05;
    double pA = xA / nA, pB = xB / nB;
    double pooled = (xA + xB) / (nA + nB);
    double seTest = std::sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));
    double z = (pB - pA) / seTest;
    double pval = 2 * (1 - normalCdf(std::fabs(z)));
    double seCi = std::sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB);
    double diff = pB - pA;
    std::printf("pA=%.4f pB=%.4f lift=%+.4f\n", pA, pB, diff);
    std::printf("z=%.3f p=%.4f CI=(%+.4f, %+.4f)\n",
                z, pval, diff - 1.96 * seCi, diff + 1.96 * seCi);
    std::printf("%s\n", pval < alpha ? "significant" : "not significant");
    return 0;
}
```
