---
source_url: https://tensortonic.com/ml-math/probability/distributions
title: Probability Distributions: Complete Guide | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

02/10

Probability

### Contents

IntroductionPMF, PDF, and CDFInteractive ExplorerDiscrete DistributionsContinuous DistributionsBayesian PriorsFamily RelationshipsML Applications

## Introduction

A **[Random Variable](https://www.tensortonic.com/ml-math/probability/random-variables)** is a variable whose value depends on the outcome of a random event. A **Probability Distribution** describes the likelihood of each possible value.

**Core Question:** If I sample from this process, what values am I likely to see, and how often?

#### Discrete

Countable outcomes: coin flips, dice rolls, number of emails.

**Function:** PMF (Probability Mass Function)

**Rule:** ∑P(x)=1\\sum P(x) = 1∑P(x)=1

#### Continuous

Infinite outcomes in a range: height, time, temperature.

**Function:** PDF (Probability Density Function)

**Rule:** ∫f(x)dx=1\\int f(x) dx = 1∫f(x)dx=1

## PMF, PDF, and CDF

These three functions fully describe any probability distribution.

#### PMF: Probability Mass Function (Discrete)

Gives the probability of _exactly_ each value: P(X=k)P(X = k)P(X=k)

Example: For a fair die, PMF(3)=1/6\\text{PMF}(3) = 1/6PMF(3)=1/6

#### PDF: Probability Density Function (Continuous)

Gives probability _density_, not probability itself. P(X=x)=0P(X = x) = 0P(X=x)=0 for any single point!

The probability of a range is the **area under the curve**: P(a<X<b)=∫abf(x)dxP(a < X < b) = \\int\_a^b f(x) dxP(a<X<b)=∫ab​f(x)dx

#### CDF: Cumulative Distribution Function (Both)

Gives the probability of being _at or below_ a value: F(x)=P(X≤x)F(x) = P(X \\leq x)F(x)=P(X≤x)

Always starts at 0, ends at 1, and never decreases.

Discrete (PMF)Continuous (PDF)

PDF f(x)

P(X=0.0) = 0

Curve shows density. Any single point has P=0! Only areas have probability.

Integrate / Sum

CDF F(x) = P(X ≤ x)

0.51.00F(0.0) = 50.0%

CDF always starts at 0, ends at 1, and never decreases. (Smooth curve for continuous)

Adjust x valuex = 0.00

F(x)=P(X≤x)=∫−∞xf(t)dtF(x) = P(X \\leq x) = \\int\_{-\\infty}^x f(t) dtF(x)=P(X≤x)=∫−∞x​f(t)dt•The CDF height equals the shaded area in the PDF/PMF above it.

## Interactive: Distribution Explorer

Select different distributions and adjust their parameters to build intuition for how they behave.

NormalBinomialPoissonExponentialBeta

### Probability Density Function

f(x)=12π1.02e−(x−0.0)22(1.0)2f(x) = \\frac{1}{\\sqrt{2\\pi1.0^2}} e^{-\\frac{(x-0.0)^2}{2(1.0)^2}}f(x)=2π1.02​1​e−2(1.0)2(x−0.0)2​

Click sample to generate data

Sample Data

#### Parameters

Mean (μ)0.0

Std Dev (σ)1.0

#### Theoretical Moments

Expected (Mean)0.00

Variance1.00

## Discrete Distributions

### Bernoulli

Single trial

One trial with two outcomes: Success (1) with probability p, Failure (0) with probability 1-p.

Mean: ppp

Variance: p(1−p)p(1-p)p(1−p)

**ML:** Logistic Regression output. [Binary Cross-Entropy](https://www.tensortonic.com/ml-math/information-theory/cross-entropy) is derived from Bernoulli likelihood.

### Binomial

n trials

Number of successes k in n independent Bernoulli trials.

P(k)=(nk)pk(1−p)n−kP(k) = \\binom{n}{k} p^k (1-p)^{n-k}P(k)=(kn​)pk(1−p)n−k

Mean: npnpnp

Variance: np(1−p)np(1-p)np(1−p)

**ML:** [A/B testing](https://www.tensortonic.com/ml-math/statistics/ab-testing) (how many users convert out of 1000?).

### Poisson

Rare events

Number of events in a fixed interval, given average rate lambda.

P(k)=λke−λk!P(k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}P(k)=k!λke−λ​

Mean: λ\\lambdaλ

Variance: λ\\lambdaλ

**ML:** Website traffic spikes, call center volume, Poisson Regression.

## Continuous Distributions

### Normal (Gaussian)

The King

The bell curve. Defined by mean μ\\muμ and variance σ2\\sigma^2σ2. Due to the [Central Limit Theorem](https://www.tensortonic.com/ml-math/statistics/central-limit-theorem), sums of random variables converge to this.

f(x)=1σ2πe−(x−μ)22σ2f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}f(x)=σ2π​1​e−2σ2(x−μ)2​

**ML:** Weight initialization (Xavier/He), [L2 regularization](https://www.tensortonic.com/ml-math/optimization/regularization) = Gaussian prior, VAEs.

### Exponential

Waiting time

Models time _between_ Poisson events. Has the memoryless property: P(wait 5 more min) is independent of how long you have waited.

f(x)=λe−λx,x≥0f(x) = \\lambda e^{-\\lambda x}, \\quad x \\geq 0f(x)=λe−λx,x≥0

Mean: 1/λ1/\\lambda1/λ

Variance: 1/λ21/\\lambda^21/λ2

**ML:** Survival analysis, time-to-failure predictions.

### Log-Normal

Heavy tail

If ln(X) is Normal, then X is Log-Normal. Models data that is positive with a heavy right tail.

**ML:** House prices, incomes, stock prices. This is why we log-transform targets in regression!

## Bayesian Prior Distributions

These distributions describe **probabilities of probabilities**. They are used as priors in Bayesian inference.

#### Beta Distribution

Defined on \[0, 1\]. Represents uncertainty about a probability (like a coin's bias).

"I think the coin lands heads 60% of the time, but I'm not sure."

**Conjugate prior** for Binomial likelihood.

#### Dirichlet Distribution

Multivariate Beta. Distribution over probability vectors that sum to 1.

Used in **Latent Dirichlet Allocation (LDA)** for topic modeling.

For more on Bayesian inference, see [Bayesian vs. Frequentist](https://www.tensortonic.com/ml-math/statistics/bayesian-frequentist).

## The Distribution Family Tree

Distributions are not isolated. They are connected through limiting relationships.

**Bernoulli →\\rightarrow→ Binomial:** Sum n Bernoullis and you get Binomial(n, p).

**Binomial →\\rightarrow→ Normal:** As no∞n \ o \\inftyno∞, Binomial looks Gaussian (CLT).

**Binomial →\\rightarrow→ Poisson:** As no∞n \ o \\inftyno∞ and po0p \ o 0po0 (with np=λnp = \\lambdanp=λ constant), Binomial becomes Poisson.

**Exponential →\\rightarrow→ Gamma:** Sum k Exponentials and you get extGamma(k,λ)\ ext{Gamma}(k, \\lambda)extGamma(k,λ).

**Normal2^22→\\rightarrow→ Chi-Square:** Sum of squared standard normals gives Chi-Square.

## ML Applications: Loss Functions

Deep learning loss functions are **negative log-likelihoods** of specific distributions. Choosing a loss function implicitly assumes a distribution on your target variable.

#### MSE Loss ↔\\leftrightarrow↔ Gaussian

Minimizing MSE assumes the target y follows a Gaussian distribution around the prediction.

MSE=−log⁡P(y∣y^,σ)+const\\text{MSE} = -\\log P(y \| \\hat{y}, \\sigma) + \\text{const}MSE=−logP(y∣y^​,σ)+const

#### BCE Loss ↔\\leftrightarrow↔ Bernoulli

Binary Cross-Entropy assumes the target follows a Bernoulli distribution.

BCE=−\[ylog⁡(p)+(1−y)log⁡(1−p)\]\\text{BCE} = -\[y \\log(p) + (1-y)\\log(1-p)\]BCE=−\[ylog(p)+(1−y)log(1−p)\]

#### Categorical CE ↔\\leftrightarrow↔ Multinomial

Categorical Cross-Entropy assumes the target follows a Multinomial (Categorical) distribution.

#### [Regularization](https://www.tensortonic.com/ml-math/optimization/regularization) ↔\\leftrightarrow↔ Prior

L2 regularization = Gaussian prior on weights. L1 regularization = Laplace prior on weights.

**Key insight:** Understanding probability distributions helps you choose the right loss function for your problem. Predicting counts? Consider Poisson loss. Predicting positive values with heavy tails? Consider log-transforming the target (Log-Normal assumption).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept