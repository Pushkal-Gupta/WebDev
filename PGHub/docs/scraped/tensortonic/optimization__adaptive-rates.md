---
source_url: https://tensortonic.com/ml-math/optimization/adaptive-rates
title: Adam, AdaGrad, RMSprop: Adaptive Learning Rates | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

04/09

Optimization

### Contents

IntroductionThe Problem with Global LRAdaGradInteractive: LR AdaptationAdaGrad Fatal FlawRMSpropAdamInteractive: Optimizer RaceBias Correction Deep-DiveInteractive: Bias CorrectionAdamWThe Adam ControversyComparison Table

## Introduction

In [momentum-based methods](https://www.tensortonic.com/ml-math/optimization/momentum-nesterov), we use a single learning rate η\\etaη for all parameters. But neural networks have millions of parameters, and they're not created equal:

- Parameters connected to **frequent features** (common words, bright pixels) get big, stable gradients.
- Parameters connected to **rare features** (unusual words, edge cases) get small, noisy gradients.

### The Core Insight

**Adaptive optimizers** give each parameter its own learning rate, automatically tuned based on gradient history. This normalizes the optimization landscape and lets rare features catch up.

## The Problem with Global Learning Rate

Consider training a word embedding model. The word "the" appears millions of times; its gradient is massive and stable. The word "serendipity" appears twice; its gradient is tiny and unreliable.

#### If LR is Large

"the" overshoots and oscillates. "serendipity" finally learns something.

#### If LR is Small

"the" converges nicely. "serendipity" barely moves in a lifetime of training.

#### The Solution

Divide the learning rate by the "magnitude" of recent gradients. Big gradients get small effective LR. Small gradients get large effective LR. The playing field is leveled.

## AdaGrad (Adaptive Gradient, 2011)

[AdaGrad (Duchi et al., 2011)](https://jmlr.org/papers/v12/duchi11a.html) was the first breakthrough for sparse data problems. It maintains a sum of squared gradients for each parameter:

Accumulator

Gt=Gt−1+gt2G\_t = G\_{t-1} + g\_t^2Gt​=Gt−1​+gt2​

Parameter Update

θt+1=θt−ηGt+ϵ⋅gt\\theta\_{t+1} = \\theta\_t - \\frac{\\eta}{\\sqrt{G\_t + \\epsilon}} \\cdot g\_tθt+1​=θt​−Gt​+ϵ​η​⋅gt​

#### How It Works

- **Frequent features:** Large GtG\_tGt​, so effective LR = η/Gt\\eta / \\sqrt{G\_t}η/Gt​​ is small.
- **Rare features:** Small GtG\_tGt​, so effective LR stays large.
- ϵ\\epsilonϵ (typically 10−810^{-8}10−8) prevents division by zero.

#### AdaGrad's Strength

Excellent for sparse data (NLP, click-through prediction). Rare events get aggressive updates when they finally appear, compensating for their infrequency.

## Interactive: Learning Rate Adaptation

See how AdaGrad adapts the learning rate differently for frequent vs rare features. Watch the accumulator grow and the effective learning rate change.

### Adaptive Learning Rate

Visualizing AdaGrad's decay based on feature frequency.

Frequent "The"Rare "Serendipity"

High0Training Time →

Accumulated Gradient (G)

114.30

Sum of squared gradients. Grows rapidly due to frequent updates.

Effective Learning Rate

0.0468

ηeff=η/Gt\\eta\_{eff} = \\eta / \\sqrt{G\_t}ηeff​=η/Gt​​

Decays quickly to prevent oscillation.

"The word "the" appears constantly. AdaGrad brakes hard to stop it from exploding."

## AdaGrad's Fatal Flaw

AdaGrad has a critical problem: the accumulator GtG\_tGt​ is a sum of positive numbers. It only grows, never shrinks.

#### The Learning Rate Death Spiral

As training progresses:

Gt→∞⟹ηGt→0G\_t \\to \\infty \\implies \\frac{\\eta}{\\sqrt{G\_t}} \\to 0Gt​→∞⟹Gt​​η​→0

The effective learning rate decays to zero. The model freezes before reaching the optimum. Training simply stops making progress.

This is acceptable for convex problems (you're near the optimum anyway). But for deep learning's [non-convex landscapes](https://www.tensortonic.com/ml-math/optimization/loss-landscapes), you need to keep exploring. AdaGrad gives up too early.

## RMSprop (Root Mean Square Propagation)

RMSprop was proposed by Geoff Hinton in a [Coursera lecture (Lecture 6e)](https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf). It's never been formally published, yet it powers much of modern AI.

The fix is simple: instead of a cumulative sum, use an **exponential moving average (EMA)** of squared gradients. The accumulator "forgets" ancient history.

Leaky Accumulator

E\[g2\]t=βE\[g2\]t−1+(1−β)gt2E\[g^2\]\_t = \\beta E\[g^2\]\_{t-1} + (1-\\beta) g\_t^2E\[g2\]t​=βE\[g2\]t−1​+(1−β)gt2​

Parameter Update

θt+1=θt−ηE\[g2\]t+ϵ⋅gt\\theta\_{t+1} = \\theta\_t - \\frac{\\eta}{\\sqrt{E\[g^2\]\_t + \\epsilon}} \\cdot g\_tθt+1​=θt​−E\[g2\]t​+ϵ​η​⋅gt​

#### Why EMA Works

With β=0.9\\beta = 0.9β=0.9, the accumulator averages roughly the last 10 squared gradients. It doesn't grow to infinity; it stabilizes around the recent average magnitude. Learning continues indefinitely.

## Adam (Adaptive Moment Estimation)

[Adam (Kingma & Ba, 2015)](https://arxiv.org/abs/1412.6980) combines the best of [Momentum](https://www.tensortonic.com/ml-math/optimization/momentum-nesterov) and RMSprop:

#### First Moment (Mean)

Like Momentum: smooths the gradient direction.

mt=β1mt−1+(1−β1)gtm\_t = \\beta\_1 m\_{t-1} + (1-\\beta\_1)g\_tmt​=β1​mt−1​+(1−β1​)gt​

#### Second Moment (Variance)

Like RMSprop: scales the learning rate.

vt=β2vt−1+(1−β2)gt2v\_t = \\beta\_2 v\_{t-1} + (1-\\beta\_2)g\_t^2vt​=β2​vt−1​+(1−β2​)gt2​

Adam Update

θt+1=θt−ηv^t+ϵ⋅m^t\\theta\_{t+1} = \\theta\_t - \\frac{\\eta}{\\sqrt{\\hat{v}\_t} + \\epsilon} \\cdot \\hat{m}\_tθt+1​=θt​−v^t​​+ϵη​⋅m^t​

where m^t\\hat{m}\_tm^t​ and v^t\\hat{v}\_tv^t​ are bias-corrected moments

#### Default Hyperparameters

Learning Rate

η=0.001\\eta = 0.001η=0.001

First Moment Decay

β1=0.9\\beta\_1 = 0.9β1​=0.9

Second Moment Decay

β2=0.999\\beta\_2 = 0.999β2​=0.999

## Interactive: Optimizer Race

Watch all four optimizers race through a ravine. Notice how AdaGrad slows down over time while RMSprop and Adam maintain speed.

### Adaptive Optimizers Race

Comparing trajectories in a high-curvature landscape.

Start RaceReset

Steps: 0

#### Live Performance

SGD

Loss:25.74000

AdaGrad

Stops early (LR→0)

Loss:25.74000

RMSprop

Leaky accumulator

Loss:25.74000

Adam

Adaptive + Momentum

Loss:25.74000

## Bias Correction Deep-Dive

Adam initializes m0=0m\_0 = 0m0​=0 and v0=0v\_0 = 0v0​=0. This creates a problem in early training.

#### The Initialization Bias

At step 1, with β2=0.999\\beta\_2 = 0.999β2​=0.999:

v1=0.999(0)+0.001⋅g12=0.001g12v\_1 = 0.999(0) + 0.001 \\cdot g\_1^2 = 0.001 g\_1^2v1​=0.999(0)+0.001⋅g12​=0.001g12​

The estimate is **1000× smaller** than the true squared gradient! Without correction, the learning rate would explode.

#### The Fix

Divide by (1−βt)(1 - \\beta^t)(1−βt) to scale up early estimates:

m^t=mt1−β1t\\hat{m}\_t = \\frac{m\_t}{1 - \\beta\_1^t}m^t​=1−β1t​mt​​

v^t=vt1−β2t\\hat{v}\_t = \\frac{v\_t}{1 - \\beta\_2^t}v^t​=1−β2t​vt​​

At t=1: 1−0.9991=0.0011 - 0.999^1 = 0.0011−0.9991=0.001. Dividing by 0.001 multiplies by 1000, exactly compensating for the bias.

## Interactive: Bias Correction

See the bias correction in action. Toggle it on/off to understand why it's necessary in early training.

### Bias Correction

Addressing the zero-initialization problem in Moving Averages.

Correction ON

True: 1.00.0Training Steps (t)

Time Step (t)

60

Correction Factor

1.00×

11−βt\\frac{1}{1 - \\beta^t}1−βt1​ (where β=0.9\\beta=0.9β=0.9)

Uncorrected

0.998

Biased towards 0

Corrected

1.000

Matches True (1.0)

"Without correction, Adam starts too slow. The factor boosts early estimates to match reality."

## AdamW: Decoupled Weight Decay

For years, researchers noticed that Adam generalized worse than SGD+Momentum on vision tasks. [Loshchilov & Hutter (2017)](https://arxiv.org/abs/1711.05101) discovered the culprit: incorrect implementation of L2 [regularization](https://www.tensortonic.com/ml-math/optimization/regularization).

### The Problem: L2 Regularization vs Weight Decay

In SGD, L2 regularization and weight decay are mathematically equivalent. Adding λ2∥w∥2\\frac{\\lambda}{2}\\\|w\\\|^22λ​∥w∥2 to the loss produces gradient ∇L+λw\\nabla L + \\lambda w∇L+λw, which after the update gives:

wt+1=wt−η(∇L+λwt)=(1−ηλ)wt−η∇Lw\_{t+1} = w\_t - \\eta(\\nabla L + \\lambda w\_t) = (1 - \\eta\\lambda)w\_t - \\eta\\nabla Lwt+1​=wt​−η(∇L+λwt​)=(1−ηλ)wt​−η∇L

The term (1−ηλ)wt(1 - \\eta\\lambda)w\_t(1−ηλ)wt​ is weight decay. For SGD, adding L2 to the loss and applying weight decay directly produce the same result. But for Adam, they diverge.

#### Standard Adam + L2

Adds λw\\lambda wλw to the gradient before adaptive scaling:

mt=β1mt−1+(1−β1)(gt+λwt)m\_t = \\beta\_1 m\_{t-1} + (1-\\beta\_1)(g\_t + \\lambda w\_t)mt​=β1​mt−1​+(1−β1​)(gt​+λwt​)

vt=β2vt−1+(1−β2)(gt+λwt)2v\_t = \\beta\_2 v\_{t-1} + (1-\\beta\_2)(g\_t + \\lambda w\_t)^2vt​=β2​vt−1​+(1−β2​)(gt​+λwt​)2

Problem: The weight decay term λw\\lambda wλw gets scaled by 1/vt1/\\sqrt{v\_t}1/vt​​. Parameters with large gradients receive _less_ regularization.

#### AdamW (Decoupled)

Applies weight decay _after_ the Adam update, not through the gradient:

mt=β1mt−1+(1−β1)gtm\_t = \\beta\_1 m\_{t-1} + (1-\\beta\_1)g\_tmt​=β1​mt−1​+(1−β1​)gt​

vt=β2vt−1+(1−β2)gt2v\_t = \\beta\_2 v\_{t-1} + (1-\\beta\_2)g\_t^2vt​=β2​vt−1​+(1−β2​)gt2​

wt+1=wt−ηm^tv^t+ϵ−ηλwtw\_{t+1} = w\_t - \\eta\\frac{\\hat{m}\_t}{\\sqrt{\\hat{v}\_t}+\\epsilon} - \\eta\\lambda w\_twt+1​=wt​−ηv^t​​+ϵm^t​​−ηλwt​

### Why Decoupling Matters

#### Uniform Regularization

In AdamW, every parameter receives the same relative weight decay ηλ\\eta\\lambdaηλ, regardless of gradient magnitude. This matches the intended behavior of L2 regularization.

#### Hyperparameter Independence

The optimal weight decay λ\\lambdaλ becomes independent of the learning rate η\\etaη. In standard Adam+L2, you need to retune λ\\lambdaλ whenever you change η\\etaη.

#### Better Generalization

AdamW achieves generalization comparable to SGD+Momentum while retaining Adam's fast convergence. This closed the gap that made practitioners prefer SGD for vision tasks.

#### AdamW for Transformers

AdamW is the default optimizer for BERT, GPT, ViT, and virtually all modern transformers. Typical settings: η=1e-4\\eta = 1e\\text{-}4η=1e-4 to 3e-43e\\text{-}43e-4, λ=0.01\\lambda = 0.01λ=0.01 to 0.10.10.1, β1=0.9\\beta\_1 = 0.9β1​=0.9, β2=0.999\\beta\_2 = 0.999β2​=0.999. If you're training a transformer, use AdamW.

### Adam vs AdamW

X has 20x steeper gradients. Watch how regularization differs.

Run

Steps: 0

Step: 0

Adam + L2

Loss:66.240

Effective λx\\lambda\_xλx​:0.3000

Effective λy\\lambda\_yλy​:0.3000

λx<λy\\lambda\_x < \\lambda\_yλx​<λy​ : steep direction gets less regularization

AdamW

Loss:66.240

λx\\lambda\_xλx​:0.3000

λy\\lambda\_yλy​:0.3000

λx=λy\\lambda\_x = \\lambda\_yλx​=λy​ : uniform decay, better generalization

The Problem

Adam+L2 divides weight decay by v\\sqrt{v}v​. Steep directions (large vvv) get weaker regularization. AdamW keeps decay uniform.

## The Adam Controversy

Adam is not universally loved. There's an ongoing debate about when to use it.

#### Adam Wins: Fast Convergence

Adam converges faster in early training. Great for prototyping, NLP, and when compute is limited. It's forgiving of learning rate choice.

#### SGD+Momentum Wins: Better Generalization

Many vision papers report that [SGD+Momentum](https://www.tensortonic.com/ml-math/optimization/momentum-nesterov) finds [flatter minima](https://www.tensortonic.com/ml-math/optimization/loss-landscapes) that generalize better to test data. The noise in SGD acts as implicit regularization.

#### The Practical Compromise

Many practitioners use Adam for early training (reach a good region fast), then switch to SGD for fine-tuning (find a flat minimum). Some use learning rate warmup to help Adam's early instability.

## Comparison Table

| Optimizer | Key Feature | Best For |
| --- | --- | --- |
| SGD | No memory | Simple convex problems |
| Momentum | Velocity accumulation | Vision (often beats Adam) |
| AdaGrad | Sum of squared gradients | Sparse NLP data |
| RMSprop | Leaky average of squares | RNNs, RL |
| Adam | Momentum + RMSprop + Bias Correction | Default choice for most tasks |
| AdamW | Adam + Correct Weight Decay | Transformers (BERT, GPT, ViT) |

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept