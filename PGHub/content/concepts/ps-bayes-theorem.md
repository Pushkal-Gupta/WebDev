---
slug: ps-bayes-theorem
module: prob-stats
title: Conditional Probability and Bayes' Theorem
subtitle: How a single piece of evidence should move your belief — and why a positive test can still mean you're probably fine.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 13
prereqs: [ps-random-variables]
relatedProblems: []
references:
  - title: "Khan Academy — Conditional probability & Bayes' theorem"
    url: "https://www.khanacademy.org/math/statistics-probability/probability-library/conditional-probability-independence/v/bayes-theorem-visualized"
    type: course
  - title: "3Blue1Brown — Bayes theorem, the geometry of changing beliefs"
    url: "https://www.youtube.com/watch?v=HZGCoVF3YvM"
    type: video
  - title: "Seeing Theory — Chapter 1: Bayes' Theorem"
    url: "https://seeing-theory.brown.edu/bayesian-inference/index.html"
    type: interactive
status: published
---

## intro
You have a belief, then evidence arrives, and the belief should change — but by how much? Most people's gut wildly overreacts to evidence and ignores how rare a thing was to begin with. A test that is "99% accurate" comes back positive for a rare disease and everyone panics, when in fact the person is most likely fine. Bayes' theorem is the exact arithmetic of updating a belief in light of evidence: it takes your **prior** (how likely before), multiplies in how well the evidence discriminates, and hands back the **posterior** (how likely now). It is at once the simplest formula in probability and the one whose answer most reliably defies intuition.

## whyItMatters
Bayes' theorem is the engine of inference wherever conclusions must be drawn from incomplete, noisy evidence. Medical diagnosis combines a test result with disease prevalence; spam filters combine the words in an email with how often spam uses them; search-and-rescue updates a probability map of a missing vessel's location after each cleared sector. In machine learning it is foundational: naive Bayes classifiers, Bayesian networks, Kalman filters, A/B testing under a Bayesian framework, and the entire field of Bayesian deep learning all *are* repeated Bayes updates. Legal reasoning, scientific hypothesis testing, and even how a well-calibrated forecaster revises odds are Bayesian at heart. Crucially, understanding Bayes inoculates you against the **base-rate fallacy** — the systematic, expensive error of judging evidence while ignoring how rare the hypothesis was to start with, which leads to over-diagnosis, false accusations, and bad bets.

## intuition
**Conditional probability** is the probability of \(A\) given that \(B\) has happened, written \(P(A\mid B)\). It shrinks the universe to just the outcomes where \(B\) is true and asks what fraction of *those* also have \(A\):
\[
P(A\mid B)=\frac{P(A\cap B)}{P(B)}.
\]
Rearranging gives the multiplication rule \(P(A\cap B)=P(A\mid B)\,P(B)\), and because \(A\cap B\) is the same set as \(B\cap A\), we also have \(P(A\cap B)=P(B\mid A)\,P(A)\). Setting these equal and solving for \(P(A\mid B)\) is the entire derivation of **Bayes' theorem**:
\[
P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B)}.
\]
Read it as belief-updating. \(P(A)\) is the **prior** — your belief in hypothesis \(A\) before the evidence. \(P(B\mid A)\) is the **likelihood** — how probable the evidence \(B\) is if \(A\) were true. \(P(B)\) is the total probability of seeing the evidence at all. The output \(P(A\mid B)\) is the **posterior** — your updated belief. The likelihood-to-evidence ratio \(P(B\mid A)/P(B)\) is the factor by which the evidence scales your prior up or down. The denominator is expanded by the **law of total probability**: \(P(B)=P(B\mid A)P(A)+P(B\mid \neg A)P(\neg A)\) — sum the ways the evidence can occur across all hypotheses.

The classic shock: a disease affects 1 in 1000 people. A test catches 99% of true cases (sensitivity \(=0.99\)) and falsely flags only 5% of healthy people (false-positive rate \(=0.05\), specificity \(=0.95\)). You test positive. What is the chance you have the disease? Intuition screams "99%." Bayes says otherwise. Imagine 100{,}000 people. About 100 have the disease, and the test flags 99 of them (true positives). But 99{,}900 are healthy, and 5% of *those* — about 4995 — get false positives. So among everyone who tests positive, \(99+4995=5094\) people, only 99 actually have the disease: \(P(\text{disease}\mid +)=99/5094\approx 1.9\%\). The test is "99% accurate," yet a positive result means under a 2% chance of disease. The culprit is the **base rate**: the disease is so rare that the rare false positives drawn from the enormous healthy population swamp the true positives. This is not a quirk of the numbers; it is the dominant force whenever the prior is small, and it is why a single test for a rare condition should rarely cause panic — and why doctors confirm with a second, independent test.

That second test is Bayes again: the posterior from the first test becomes the prior for the next. Bayesian updating is sequential and self-consistent — each new independent piece of evidence multiplies the odds by its likelihood ratio, so two independent positives compound into strong evidence even when one alone was weak. Thinking in **odds form** makes this vivid: posterior odds \(=\) prior odds \(\times\) likelihood ratio, and likelihood ratios just multiply across independent evidence.

## visualization
```
population of 100,000;  disease prevalence 0.1%;  sensitivity 99%;  false-positive rate 5%

                 has disease (100)         healthy (99,900)
                +------------------+   +-------------------------------------------+
   test  +      |  TP = 99         |   |  FP = 4995                                |   <- everyone who tests +
                +------------------+   +-------------------------------------------+
   test  -      |  FN = 1          |   |  TN = 94,905                              |
                +------------------+   +-------------------------------------------+

   among all "+" results (99 + 4995 = 5094), only 99 are truly sick
   P(disease | +) = TP / (TP + FP) = 99 / 5094  ~  1.9%      <- the base-rate fallacy in one picture

   tiny disease box, huge healthy box; even a small slice of the huge box dwarfs the tiny one.
```

## bruteForce
The most reliable way to *get the right answer* is the **natural-frequency table**: pick a large round population, walk it through the tree, and count people in each of the four cells (true positive, false positive, false negative, true negative). Then the posterior is just one count divided by a sum of counts — no formula, no confusion about which conditional is which. This is "brute force" only in that it does not use the compact equation; it is actually the *recommended* way to reason and to explain Bayes to others, because human intuition handles "99 out of 5094 people" far better than "0.99 × 0.001 / 0.0509." Its limitation is purely mechanical: it does not generalize cleanly to continuous evidence (a numeric biomarker rather than a yes/no test), to many competing hypotheses, or to repeated updates, where you want the algebra. So use the frequency table to build and check intuition, then trust the formula for computation at scale.

## optimal
Compute directly with **Bayes' theorem**, expanding the denominator by the **law of total probability** so you never need \(P(B)\) handed to you:
\[
P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B\mid A)P(A)+P(B\mid \neg A)P(\neg A)}.
\]
For sequential evidence, work in **odds and log-odds**: posterior odds equal prior odds times the likelihood ratio, and taking logs turns the product into a sum, which is both numerically stable and the form used inside naive Bayes classifiers and logistic models. With many hypotheses \(H_1,\dots,H_k\), the rule generalizes to \(P(H_i\mid B)=P(B\mid H_i)P(H_i)/\sum_j P(B\mid H_j)P(H_j)\) — compute each numerator and normalize, which is exactly the softmax-like normalization at the heart of probabilistic classifiers. For continuous evidence, replace the likelihood with a density and the sum with an integral. The single discipline that prevents almost every Bayes error: always anchor on the prior (the base rate) before letting the likelihood move you, and accumulate evidence multiplicatively in odds form rather than trying to recombine raw probabilities.

```python
def bayes_posterior(prior, sensitivity, false_positive_rate):
    """P(disease | positive) via Bayes' theorem with total-probability denominator."""
    p_pos_given_disease = sensitivity
    p_pos_given_healthy = false_positive_rate
    numerator = p_pos_given_disease * prior
    evidence = numerator + p_pos_given_healthy * (1 - prior)   # law of total probability
    return numerator / evidence

post1 = bayes_posterior(prior=0.001, sensitivity=0.99, false_positive_rate=0.05)
print(round(post1, 4))                                   # 0.0194  -- ~1.9%, not 99%!
post2 = bayes_posterior(prior=post1, sensitivity=0.99, false_positive_rate=0.05)
print(round(post2, 4))                                   # 0.2814  -- a second independent positive
```

## complexity
time: O(1) for a two-hypothesis Bayes update; O(k) for k competing hypotheses (compute each numerator, normalize); O(m) to fold in m independent pieces of evidence sequentially in odds/log-odds form
space: O(1) for the binary case; O(k) to hold a posterior distribution over k hypotheses
notes: Always expand P(B) via the law of total probability so you don't need the marginal handed to you. Use log-odds for chained updates to avoid underflow and to turn products of likelihood ratios into stable sums -- this is precisely how naive Bayes and logistic regression operate internally.

## pitfalls
- The base-rate fallacy: judging a positive result by the test's accuracy while ignoring how rare the condition is. With a small prior, false positives from the huge negative population dominate, so a positive can still mean low probability — the single most important and most-violated Bayes lesson.
- Confusing \(P(A\mid B)\) with \(P(B\mid A)\) (the "prosecutor's fallacy"). \(P(\text{evidence}\mid \text{innocent})\) is not \(P(\text{innocent}\mid \text{evidence})\); swapping them, ignoring the base rate, has put innocent people in prison.
- Forgetting the denominator. \(P(B)\) must include *all* ways the evidence can occur; using only \(P(B\mid A)P(A)\) and skipping the false-positive branch overstates the posterior badly.
- Assuming independence when chaining evidence. Two correlated tests (same underlying mechanism) do not multiply likelihood ratios as if independent; treating them as independent double-counts the evidence and produces an overconfident posterior.
- Ignoring the prior entirely (treating the likelihood as the answer). A high \(P(B\mid A)\) means the evidence is *consistent* with \(A\), not that \(A\) is *probable* — without the prior you have only half the picture.

## interviewTips
- Derive Bayes from the definition of conditional probability live: \(P(A\mid B)P(B)=P(A\cap B)=P(B\mid A)P(A)\), then solve for \(P(A\mid B)\). Deriving it (rather than reciting it) signals real understanding.
- For the medical-test question, answer with the natural-frequency table out of 100{,}000 people, not the bare formula — interviewers want to see you surface the base-rate fallacy and explain *why* a 99%-accurate test yields a ~2% posterior.
- Mention the odds/log-odds form for sequential updating (posterior odds = prior odds × likelihood ratio) and note that this is exactly the machinery behind naive Bayes and logistic regression — it connects the toy problem to real systems.

## keyTakeaways
- Conditional probability \(P(A\mid B)=P(A\cap B)/P(B)\) restricts the universe to outcomes where \(B\) holds; rearranging it both ways yields Bayes' theorem \(P(A\mid B)=P(B\mid A)P(A)/P(B)\).
- Read Bayes as prior × likelihood ÷ evidence: the prior is your belief before, the likelihood is how well the evidence fits, and the posterior is your updated belief; expand \(P(B)\) by the law of total probability.
- The base rate dominates when the prior is small — a "99% accurate" test for a 1-in-1000 disease yields under a 2% posterior — so always anchor on the prior, never confuse \(P(A\mid B)\) with \(P(B\mid A)\), and chain independent evidence multiplicatively via likelihood ratios.

## code.python
```python
def bayes_posterior(prior, likelihood_if_true, likelihood_if_false):
    num = likelihood_if_true * prior
    evidence = num + likelihood_if_false * (1 - prior)
    return num / evidence

def sequential_update(prior, evidence_list):
    """Fold in a list of (likelihood_if_true, likelihood_if_false) observations."""
    belief = prior
    for lt, lf in evidence_list:
        belief = bayes_posterior(belief, lt, lf)
    return belief

print(round(bayes_posterior(0.001, 0.99, 0.05), 4))  # 0.0194
print(round(sequential_update(0.001, [(0.99, 0.05)] * 2), 4))  # 0.2814
```

## code.javascript
```javascript
function bayesPosterior(prior, likelihoodIfTrue, likelihoodIfFalse) {
  const num = likelihoodIfTrue * prior;
  const evidence = num + likelihoodIfFalse * (1 - prior);
  return num / evidence;
}

function sequentialUpdate(prior, evidenceList) {
  let belief = prior;
  for (const [lt, lf] of evidenceList) belief = bayesPosterior(belief, lt, lf);
  return belief;
}

console.log(bayesPosterior(0.001, 0.99, 0.05).toFixed(4));        // 0.0194
console.log(sequentialUpdate(0.001, [[0.99, 0.05], [0.99, 0.05]]).toFixed(4)); // 0.2814
```

## code.java
```java
public class Bayes {
    static double posterior(double prior, double likeTrue, double likeFalse) {
        double num = likeTrue * prior;
        double evidence = num + likeFalse * (1 - prior);
        return num / evidence;
    }
    static double sequentialUpdate(double prior, double[][] evidence) {
        double belief = prior;
        for (double[] e : evidence) belief = posterior(belief, e[0], e[1]);
        return belief;
    }
    public static void main(String[] args) {
        System.out.printf("%.4f%n", posterior(0.001, 0.99, 0.05));               // 0.0194
        System.out.printf("%.4f%n", sequentialUpdate(0.001,
            new double[][]{{0.99, 0.05}, {0.99, 0.05}}));                          // 0.2814
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
#include <utility>

double posterior(double prior, double likeTrue, double likeFalse) {
    double num = likeTrue * prior;
    double evidence = num + likeFalse * (1 - prior);
    return num / evidence;
}

double sequentialUpdate(double prior, const std::vector<std::pair<double, double>>& ev) {
    double belief = prior;
    for (auto& [lt, lf] : ev) belief = posterior(belief, lt, lf);
    return belief;
}

int main() {
    std::printf("%.4f\n", posterior(0.001, 0.99, 0.05));                          // 0.0194
    std::printf("%.4f\n", sequentialUpdate(0.001, {{0.99, 0.05}, {0.99, 0.05}})); // 0.2814
    return 0;
}
```
