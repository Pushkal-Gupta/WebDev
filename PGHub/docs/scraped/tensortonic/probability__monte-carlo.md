---
source_url: https://tensortonic.com/ml-math/probability/monte-carlo
title: Monte Carlo Methods: Simulation for the Unsolvable | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

09/10

Probability

### Contents

IntroductionHistory: Manhattan ProjectThe Dartboard MethodInteractive: Estimate PiMonte Carlo IntegrationCurse of DimensionalityMCMCInteractive: MCMCML Applications

## Introduction

Many problems are theoretically solvable but computationally impossible. Calculating portfolio risk requires integrating over thousands of correlated assets. Finding the optimal Go move requires searching a tree with more states than atoms in the universe.

The Monte Carlo Philosophy

If you cannot calculate the answer, **simulate** it millions of times and average.

"If you cannot calculate the area of a lake, throw a million rocks at it. Count how many splash vs. hit ground. That ratio gives you the area."

## History: The Manhattan Project

#### The Problem

1940s Los Alamos. Stanislaw Ulam needed to calculate the probability of neutron chain reactions. The differential equations were too complex.

#### The Solution

Instead of solving equations, simulate individual neutrons moving randomly and observe outcomes. Named after the Monaco casino because it relies on chance ( [LLN](https://www.tensortonic.com/ml-math/probability/lln)).

## The Dartboard Method (Estimating Pi)

How do you calculate pi without geometry? Throw darts randomly.

#### Setup

- Square with side 2r2r2r. Area = 4r24r^24r2
- Circle inscribed with radius rrr. Area = πr2\\pi r^2πr2
- Ratio = πr24r2=π4\\frac{\\pi r^2}{4r^2} = \\frac{\\pi}{4}4r2πr2​=4π​

#### Simulation

- Throw NNN darts randomly at square
- Count how many land inside circle
- Ratio = NinsideN=π4\\frac{N\_{\\text{inside}}}{N} = \\frac{\\pi}{4}NNinside​​=4π​
- **π=4×NinsideN\\pi = 4 \\times \\frac{N\_{\\text{inside}}}{N}π=4×NNinside​​**

More darts = better estimate. This is the [Law of Large Numbers](https://www.tensortonic.com/ml-math/probability/lln) in action.

## Interactive: Estimate Pi

Throw virtual darts at a square. Watch the estimate converge to 3.14159... as you add more darts.

Estimated π0.00000Acc: 0.00%

Total Darts0Inside: 0

Paused

#### Convergence

π

0500010000 Darts

## Monte Carlo Integration

For complex functions in high dimensions, standard numerical integration fails. Monte Carlo converts integrals into expectations.

I=∫Vf(x)dx≈V⋅1N∑i=1Nf(xi)I = \\int\_V f(x) dx \\approx V \\cdot \\frac{1}{N} \\sum\_{i=1}^N f(x\_i)I=∫V​f(x)dx≈V⋅N1​∑i=1N​f(xi​)

Replace integral with sample average. VVV = volume of domain, xix\_ixi​ = random samples.

#### Convergence Rate

Error∝1N\\text{Error} \\propto \\frac{1}{\\sqrt{N}}Error∝N​1​

To halve error: need 4×4 \\times4× samples. Slow convergence, but **independent of dimension**!

## Beating the Curse of Dimensionality

Grid-based methods suffer exponentially as dimensions increase. Monte Carlo does not.

| Dimension | Grid Points (10/axis) | Monte Carlo |
| --- | --- | --- |
| 1D (Line) | 10 | ~100 |
| 3D (Cube) | 1,000 | ~100 |
| 10D | 10 billion | ~1,000 |
| 100D | 10^100 (impossible) | ~10,000 |

This is why Monte Carlo is the ONLY way to solve high-dimensional physics and Bayesian inference problems.

## Markov Chain Monte Carlo (MCMC)

What if we cannot sample uniformly? MCMC generates samples from complex distributions using a [Markov Chain](https://www.tensortonic.com/ml-math/probability/markov-chains) that explores high-probability regions.

#### Metropolis-Hastings Algorithm

1. Start at random point x0x\_0x0​
2. Propose new point x′x'x′ nearby (x′=x0+noisex' = x\_0 + \\text{noise}x′=x0​+noise)
3. Calculate acceptance ratio:
α=P(x′)P(x0)\\alpha = \\frac{P(x')}{P(x\_0)}α=P(x0​)P(x′)​

4. If α≥1\\alpha \\geq 1α≥1: always move to x′x'x′
5. If α<1\\alpha < 1α<1: move with probability α\\alphaα, else stay
6. Repeat thousands of times

#### Why it works

The chain spends more time in high-probability regions. After "burn-in," samples are from the target distribution.

#### Key parameter

Step size matters! Too small: slow exploration. Too large: many rejections. Target 20-50% acceptance.

## Interactive: MCMC Visualization

Watch Metropolis-Hastings explore a bimodal distribution (two peaks). Adjust step size to see how it affects exploration.

Status

Paused

Proposal Step Size0.80

Cautious (High Accept)Bold (Low Accept)

#### Chain Statistics

Acceptance Ratio0.0%

**Goldilocks Principle:**

Too high (>80%): Steps are too small, exploring slowly.

Too low (<20%): Steps are too big, constantly rejected.

Target: ~20-50% for optimal mixing.

#### Why Bimodal?

Notice how the chain gets "stuck" in one peak for a while, then eventually makes a lucky jump across the valley to the other peak. This 'mode hopping' is the hardest challenge in MCMC.

## ML Applications

#### Reinforcement Learning (MC Prediction)

Estimate state value V(s)V(s)V(s) by playing many episodes and averaging returns:

V(s)≈1N∑i=1NGi(s)V(s) \\approx \\frac{1}{N} \\sum\_{i=1}^N G\_i^{(s)}V(s)≈N1​∑i=1N​Gi(s)​

Used in AlphaGo (MCTS), policy gradient methods.

#### [Bayesian Inference](https://www.tensortonic.com/ml-math/probability/bayes-theorm)

Sample from posterior P(θ∣D)P(\\theta\|D)P(θ∣D) when the integral P(D)P(D)P(D) is intractable:

P(θ∣D)∝P(D∣θ)P(θ)P(\\theta\|D) \\propto P(D\|\\theta)P(\\theta)P(θ∣D)∝P(D∣θ)P(θ)

MCMC, Hamiltonian MC, Variational Inference.

#### [Dropout](https://www.tensortonic.com/ml-math/optimization/regularization) as Monte Carlo

Running inference with dropout multiple times and averaging is equivalent to approximate Bayesian inference. Each forward pass samples a different sub-network.

#### Finance: Value at Risk (VaR)

Simulate thousands of market scenarios to estimate worst-case losses at a given [confidence level](https://www.tensortonic.com/ml-math/statistics/confidence-interval).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept