---
source_url: https://tensortonic.com/ml-math/statistics/hypothesis-testing
title: Hypothesis Testing: Complete Guide | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

06/15

Statistics

### Contents

IntroductionThe Courtroom AnalogyCore DefinitionsInteractive: P-Value DemoOne vs Two-TailedChoosing a StatisticType I & II ErrorsInteractive: Error Trade-offsThe 6-Step ProcessExample: Z-TestML ApplicationsCommon Pitfalls

## Introduction

Hypothesis testing is the statistical method for making decisions under uncertainty. It takes two opposing ideas about a population and uses sample data to decide which is more likely true.

### The Core Question

In Data Science, we constantly see patterns. "Model A has 85% accuracy, Model B has 86%." Is Model B actually better? Or was that 1% difference just random luck?

Hypothesis testing gives us a mathematical "Yes" or "No" (with a probability attached) to that question.

For example, if a company claims their website gets 50 visitors a day on average, we use hypothesis testing to analyze past visitor data. We determine if the actual average is indeed 50, or if the deviation we see in our sample is significant enough to prove them wrong.

## The Courtroom Analogy

The logic of hypothesis testing parallels a criminal trial. This analogy helps clarify why we phrase things as "Fail to reject" rather than "Accept."

H0H\_0H0​

#### Null Hypothesis

**"The defendant is innocent."**

We start by assuming the status quo. We assume there is no effect, no difference, or no crime committed.

H1H\_1H1​

#### Alternative Hypothesis

**"The defendant is guilty."**

This is what the prosecutor (or data scientist) attempts to prove. It claims there is a significant effect or difference.

The Verdict

In court, we never declare a defendant "Innocent." We declare them **"Not Guilty"**. This means there was not enough evidence to convict. Similarly, in statistics, we never "Accept the Null Hypothesis." We only **"Fail to Reject the Null Hypothesis."**

## Core Definitions

### 1\. The Hypotheses

Null Hypothesis (H0H\_0H0​)

The starting assumption. Assumes no effect or difference.

H0:μ=50H\_0: \\mu = 50H0​:μ=50

"Average visits are 50"

Alternative Hypothesis (H1H\_1H1​)

The opposite of the null, suggesting a difference exists.

H1:μ≠50H\_1: \\mu \\neq 50H1​:μ=50

"Average visits are NOT 50"

### 2\. Significance Level (α\\alphaα)

How sure we want to be before saying the claim is false. Usually, we choose α=0.05\\alpha = 0.05α=0.05 (5%).

This is the probability of rejecting the null hypothesis when it is actually true (making a [Type I error](https://www.tensortonic.com/ml-math/statistics/type-one-vs-two)). Think of it as setting the bar for "beyond reasonable doubt."

### 3\. The P-Value

The probability of seeing data as extreme (or more) than what we observed, **assuming H0H\_0H0​ is true**.

P-value ≤α\\le \\alpha≤α

**Reject H0H\_0H0​** \- data is unlikely under null.

P-value >α\> \\alpha>α

**Fail to Reject H0H\_0H0​** \- inconclusive.

P-values are widely misunderstood. See the [P-Value chapter](https://www.tensortonic.com/ml-math/statistics/p-value) for common fallacies (ASA Statement) and pitfalls (P-Hacking).

## Interactive Demo: P-Value & Rejection

See how the test statistic, alpha level, and test type affect whether we reject H0H\_0H0​. Drag the test statistic and watch the P-value change.

Hypothesis Type

Left TwoRight

Significance Level (α\\alphaα)

0.010.050.1

z = 1.50

z = -1.50

z∗=±1.96z^\* = \\pm 1.96z∗=±1.96

Decision

Fail to RejectH0H\_0H0​

ppp = 0.1336

>=

α\\alphaα = 0.05

Since p≥αp \\ge \\alphap≥α, we do not have enough evidence to say this is not just random noise.

## One-Tailed vs. Two-Tailed Tests

The direction of your test depends on your Alternative Hypothesis (H1H\_1H1​). Are you checking for _any_ difference, or a difference in a specific direction?

#### Two-Tailed Test

Used when we want to see if there is a difference in **either direction** (higher OR lower).

H1:μ≠50H\_1: \\mu \\neq 50H1​:μ=50

Rejection regions on BOTH tails

_Example:_ Testing if a marketing strategy affects sales (it could increase or decrease them).

#### One-Tailed Test

Used when we expect a change in **only one direction**.

H1:μ>50H\_1: \\mu > 50H1​:μ>50(Right-Tailed)

H1:μ<50H\_1: \\mu < 50H1​:μ<50(Left-Tailed)

Rejection region on ONE tail only

_Example:_ Testing if a new algorithm **improves** accuracy (we only care if it goes up).

## Choosing the Right Test Statistic

The test statistic is a number calculated from sample data that helps us decide whether to reject H0H\_0H0​. Here is a quick reference:

| Test | When to Use |
| --- | --- |
| Z-Test | Population variance known OR large sample (n>30n > 30n>30) |
| T-Test | Population variance unknown AND small sample (n<30n < 30n<30) |
| [Chi-Square](https://www.tensortonic.com/ml-math/probability/distributions) | Categorical data (comparing observed vs expected counts) |
| ANOVA | Comparing means of 3+ groups |

**Z vs T Decision:** The full decision flowchart with formulas is in the [Confidence Intervals chapter](https://www.tensortonic.com/ml-math/statistics/confidence-interval#z-vs-t). For a practical T-test walkthrough, see the [One-Sample T-Test chapter](https://www.tensortonic.com/ml-math/statistics/t-test).

## Type I & Type II Errors

Since we rely on probabilities, there is always a chance we make the wrong decision. These errors are classified into two types:

Type I Error(α\\alphaα)

**False Positive**

Rejecting a TRUE Null Hypothesis.

_Courtroom:_ Convicting an innocent person.

Type II Error(β\\betaβ)

**False Negative**

Failing to reject a FALSE Null Hypothesis.

_Courtroom:_ Letting a guilty person go free.

#### Deep Dive: The Error Trade-off

Understanding when each error matters more (Spam filters vs. Medical tests) and how to balance them is critical for real-world applications.

[Read the full Type I vs Type II chapter](https://www.tensortonic.com/ml-math/statistics/type-one-vs-two)

## Interactive Demo: Error Trade-offs

Visualize the relationship between alpha, beta, and power. See how changing alpha affects beta, and how effect size impacts your ability to detect true differences.

### Type I & Type II Errors Visualized

Two distributions: H0 (null is true) and H1 (alternative is true). See how alpha, beta, and power interact.

Alpha (Type I Error): 0.05

0.010.050.1

Smaller alpha = harder to reject H0

Effect Size (True Difference): 2.0

Larger effect = easier to detect (more power)

H0 (Null True)H1 (Alternative True)Critical Valuealpha (Type I)beta (Type II)Power

Type I Error (alpha)

5.0%

False Positive

Type II Error (beta)

36.1%

False Negative

Power (1-beta)

63.9%

True Positive

Effect Size

2.0

Cohen's d

**Key Trade-off:** Decreasing alpha (stricter threshold) increases beta (miss more true effects). The only way to reduce BOTH errors is to increase sample size or study larger effects.

## The 6-Step Process

A structured approach ensures valid results. Follow this checklist:

1

#### State Hypotheses

Define H0H\_0H0​ and H1H\_1H1​ clearly before collecting data.

`H0H_0H0​: Drug has no effect (μ=0\mu = 0μ=0)`

2

#### Choose Significance Level

Set α\\alphaα (usually 0.05). This sets the bar for 'beyond reasonable doubt.'

`α=0.05\alpha = 0.05α=0.05`

3

#### Collect & Analyze Data

Gather sample data through proper experimental design.

`Measure blood pressure before/after treatment`

4

#### Calculate Test Statistic

Compute Z, T, or Chi-Square based on the data.

`t=xˉ−μ0s/nt = \frac{\bar{x} - \mu_0}{s / \sqrt{n}}t=s/n​xˉ−μ0​​`

5

#### Find P-Value or Critical Value

Compare your statistic to the distribution under H0H\_0H0​.

`P-value = 0.003`

6

#### Make Decision & Interpret

Reject or fail to reject H0H\_0H0​. State practical significance.

`Reject H0H_0H0​; drug significantly lowers BP`

## Practical Example: The Z-Test

The **Z-Test** is the "Hello World" of hypothesis testing. It is used when we know the population standard deviation (σ\\sigmaσ) and want to test if a sample mean belongs to that population.

### The Scenario: IQ Scores

IQ scores are normally distributed with a mean of μ=100\\mu = 100μ=100 and standard deviation σ=15\\sigma = 15σ=15. A school principal claims her students are "significantly smarter" than average. She samples n=36n = 36n=36 students and finds an average IQ of xˉ=106\\bar{x} = 106xˉ=106.

Step 1: Hypotheses

H0:μ=100H\_0: \\mu = 100H0​:μ=100 (Average intelligence)H1:μ>100H\_1: \\mu > 100H1​:μ>100 (Smarter - Right Tailed)

Step 2: Significance Level

Let's use α=0.05\\alpha = 0.05α=0.05. The critical Z-score for top 5% is 1.6451.6451.645.

Step 3: Calculate Z-Statistic

The Z-score measures the distance between the sample mean and population mean in units of **Standard Error**.

Numerator (Signal)

106−100=6106 - 100 = 6106−100=6

Difference observed

Denominator (Noise)

15/36=2.515 / \\sqrt{36} = 2.515/36​=2.5

Standard Error (σ/n\\sigma/\\sqrt{n}σ/n​)

Z=62.5=2.4Z = \\frac{6}{2.5} = 2.4Z=2.56​=2.4

Step 4: Decision

Since our Z-score of 2.42.42.4 is greater than the critical value 1.6451.6451.645 (it falls in the rejection region), we **Reject H0H\_0H0​**.

Conclusion: The students are statistically significantly smarter than the average population.

**Reality Check:** In real life, we rarely know the true σ\\sigmaσ (population std dev). When σ\\sigmaσ is unknown, we must use the sample std dev (sss) and switch to the [T-Test](https://www.tensortonic.com/ml-math/statistics/t-test).

## Applications in Machine Learning

Hypothesis testing is fundamental for making data-driven decisions in ML.

### 1\. Feature Selection

Use hypothesis tests to decide if a feature is relevant to the target.

- **H0H\_0H0​:** Feature X has no correlation with Target Y.
- **Test:** Pearson Correlation or Chi-Square.
- **Result:** If P-value is high, drop the feature to reduce noise.

### 2\. A/B Testing

Comparing two versions of a model, website, or feature.

- **H0H\_0H0​:** Conversion Rate A = Conversion Rate B.
- **Test:** Two-sample Z-test for proportions.
- **Result:** If we reject H0H\_0H0​, the difference is statistically significant.

### 3\. Model Comparison

Determining if one model is statistically better than another. See [confidence intervals](https://www.tensortonic.com/ml-math/statistics/confidence-interval) for reporting uncertainty.

- **H0H\_0H0​:** Model A accuracy = Model B accuracy.
- **Test:** Paired [T-test](https://www.tensortonic.com/ml-math/statistics/t-test) on cross-validation scores.
- **Result:** Avoid overfitting to a single train/test split.

## Limitations & Pitfalls

### The "File Drawer" Effect

Studies with significant results (P<0.05P < 0.05P<0.05) are more likely to be published than those with non-significant results. This leads to a bias in literature where effects seem stronger than they are.

### Statistical vs. Practical Significance

With a massive [sample size](https://www.tensortonic.com/ml-math/statistics/population-sample), even a tiny difference (e.g., 0.001% improvement) can have a small P-value. While "statistically significant," this might be practically useless for the business.

### P-Hacking

Running many tests until you find one with P<0.05P < 0.05P<0.05, or tweaking analysis parameters to achieve significance. This inflates false positive rates. Pre-register your hypotheses to avoid this.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept