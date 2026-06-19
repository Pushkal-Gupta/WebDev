---
source_url: https://tensortonic.com/ml-math/optimization/sgd-variants
title: SGD, Mini-Batch & Learning Rate Schedules | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

02/09

Optimization

### Contents

IntroductionBatch Gradient DescentStochastic Gradient DescentMini-Batch SGDInteractive: Batch Size EffectInteractive: Gradient NoiseBatch Size TradeoffsLearning Rate SchedulesInteractive: LR SchedulesLinear WarmupPractical Tuning Guide

## Introduction

All the optimizers we've discussed ( [Momentum](https://www.tensortonic.com/ml-math/optimization/momentum-nesterov), [Adam](https://www.tensortonic.com/ml-math/optimization/adaptive-rates), etc.) are variations on one core algorithm: **Gradient Descent**.

But there's a fundamental choice that comes before everything else: _How much data do you use to compute each gradient?_

### The Batch Size Choice

This choice, the **batch size**, affects everything: convergence speed, generalization, memory usage, and whether training works at all. It's one of the most important hyperparameters in deep learning.

## Batch Gradient Descent

In classical (Batch) Gradient Descent, we compute the gradient using the **entire dataset**:

θt+1=θt−η⋅1N∑i=1N∇L(θt;xi,yi)\\theta\_{t+1} = \\theta\_t - \\eta \\cdot \\frac{1}{N} \\sum\_{i=1}^{N} \\nabla L(\\theta\_t; x\_i, y\_i)θt+1​=θt​−η⋅N1​∑i=1N​∇L(θt​;xi​,yi​)

#### Advantages

- Gradient is accurate (no sampling noise)
- Stable, predictable convergence
- Easy to analyze theoretically

#### Disadvantages

- Extremely slow (one step = full dataset pass)
- Requires all data in memory
- Can't escape local minima

### Batch GD Failure Case

Deterministic gradients get trapped in local minima

LeftRight

Run

LocalGlobal

Descending...

Following steepest descent...

Gradient-5.4720

Loss2.8265

Position-1.800

Iteration0

Key Insight

Left of saddle leads to local min. No escape!

Batch GD is impractical for modern deep learning. Training GPT on the full internet for one gradient update would take years.

## Stochastic Gradient Descent (SGD)

At the opposite extreme, **Stochastic** GD uses a single random sample:

θt+1=θt−η⋅∇L(θt;xi,yi)\\theta\_{t+1} = \\theta\_t - \\eta \\cdot \\nabla L(\\theta\_t; x\_i, y\_i)θt+1​=θt​−η⋅∇L(θt​;xi​,yi​)

where (x\_i, y\_i) is a single randomly chosen sample

#### Why Stochasticity Helps

The gradient from one sample is a noisy approximation of the true gradient. But this noise is not always bad:

- Acts like **exploration** in the [loss landscape](https://www.tensortonic.com/ml-math/optimization/loss-landscapes)
- Helps escape shallow local minima and saddle points
- Serves as implicit [regularization](https://www.tensortonic.com/ml-math/optimization/regularization)

## Mini-Batch SGD: The Sweet Spot

In practice, we use **mini-batches**: small random subsets of the data.

θt+1=θt−η⋅1B∑i∈B∇L(θt;xi,yi)\\theta\_{t+1} = \\theta\_t - \\eta \\cdot \\frac{1}{B} \\sum\_{i \\in \\mathcal{B}} \\nabla L(\\theta\_t; x\_i, y\_i)θt+1​=θt​−η⋅B1​∑i∈B​∇L(θt​;xi​,yi​)

where B is a mini-batch of size 32, 64, 128, 256, etc.

#### Variance Reduction

Averaging over B samples reduces gradient noise by factor of 1/B1/\\sqrt{B}1/B​.

#### Hardware Efficiency

GPUs are optimized for matrix ops. A batch of 64 is nearly as fast as a batch of 1.

#### Memory Constraint

Batch must fit in GPU memory. Larger batches = more memory usage.

## Interactive: Batch Size Effect

Watch how batch size affects the optimization path. Smaller batches = more noise = more exploration.

### Batch Size Impact

How sample size determines the "smoothness" of the optimization path.

Batch Size (B):132256

High NoiseLow Noise

Batch Size: 32

Current Loss

49.0000

Steps Taken0

#### Balanced

Medium batches offer a trade-off: enough noise to explore, but stable enough to converge efficiently.

Gradient Update Rule

θt+1=θt−η(∇L+N(0,σ/B))\\theta\_{t+1} = \\theta\_t - \\eta(\\nabla L + \\mathcal{N}(0, \\sigma/\\sqrt{B}))θt+1​=θt​−η(∇L+N(0,σ/B​))

## Interactive: Gradient Noise

See how batch size reduces gradient variance. The [Central Limit Theorem](https://www.tensortonic.com/ml-math/statistics/central-limit-theorem) in action!

### Batch Size vs. Gradient Noise

Visualize how averaging over a batch reduces estimation variance.

Batch Size:

-

32

+

True Gradient (1.0)

StochasticBatch SizeStable

Theoretical Noise (σ\\sigmaσ)

0.354∝1/B\\propto 1/\\sqrt{B}∝1/B​

Current Deviation

0.140

Balanced noise.

#### Key Insight

Increasing batch size B reduces gradient noise by B\\sqrt{B}B​.

To use large batches effectively, you often need to increase the Learning Rate linearly or by square root to compensate for the reduced noise/variance distribution.

## Batch Size Tradeoffs

| Aspect | Small Batch (32) | Large Batch (2048+) |
| --- | --- | --- |
| Gradient Noise | High | Low |
| Exploration | Good (escapes local minima) | Poor (gets stuck) |
| Generalization | Often better | Can be worse |
| Training Speed | Slower (more steps) | Faster (fewer steps) |
| GPU Utilization | Under-utilized | Fully utilized |
| Memory | Low | High |

#### The Large Batch Problem

Keskar et al. (2017) showed that large batch training finds [sharp minima](https://www.tensortonic.com/ml-math/optimization/loss-landscapes) that generalize poorly. The noise in small batches acts as implicit regularization, pushing toward flat minima with better generalization.

## Learning Rate Schedules

The optimal learning rate changes during training. Start high for fast progress, then decrease to refine the solution. Common schedules:

#### Step Decay

Reduce LR by a factor (e.g., 10×) at fixed epochs.

epochs \[30, 60, 90\]: LR = 0.1 → 0.01 → 0.001

#### Cosine Annealing

Smoothly decay LR following a cosine curve.

ηt=ηmin+12(ηmax−ηmin)(1+cos⁡(tTπ))\\eta\_t = \\eta\_{min} + \\frac{1}{2}(\\eta\_{max} - \\eta\_{min})(1 + \\cos(\\frac{t}{T}\\pi))ηt​=ηmin​+21​(ηmax​−ηmin​)(1+cos(Tt​π))

#### One Cycle Policy

LR increases from small to max, then decreases. Popularized by fast.ai. Often achieves same accuracy in fewer epochs.

## Interactive: Learning Rate Schedules

Compare different LR schedules. Each has different convergence characteristics.

### Learning Rate Planner

Visualize how LR schedules impact convergence dynamics.

constantstepcosineOne Cycle

Learning Rate (η\\etaη)2.47e-5

Validation Loss0.239

#### cosine Schedule

Smooth decay. Often reaches better optima by spending more time at high LR initially, then fine-tuning. One hyperparameter (epochs).

ηt=0.5ηmax(1+cos⁡(tπ/T))\\eta\_t = 0.5\\eta\_{max}(1 + \\cos(t\\pi/T))ηt​=0.5ηmax​(1+cos(tπ/T))

## Linear Warmup

Starting with a large learning rate can destabilize training. **Warmup** gradually increases the LR over the first few epochs.

#### At Initialization

Weights are random. Gradients are unreliable. Large steps cause divergence.

#### After Warmup

Model has learned structure. Gradients are meaningful. Can use full learning rate.

#### Warmup for Large Batch Training

When using large batches (to fill GPU memory), warmup becomes essential. The rule of thumb: warmup steps = 5-10% of total training steps. This lets [Adam's](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) moment estimates stabilize.

## Practical Tuning Guide

#### Step 1: Start with Defaults

- Optimizer: [Adam or AdamW](https://www.tensortonic.com/ml-math/optimization/adaptive-rates)
- Learning rate: 3e-4 (the "Karpathy constant")
- Batch size: As large as GPU memory allows (64-256 typical)
- Warmup: 5% of total steps

#### Step 2: Learning Rate Search

Run a learning rate range test (Leslie Smith, 2017):

1. Start with tiny LR (1e-7)
2. Increase exponentially each step
3. Plot loss vs LR
4. Use LR where loss decreases fastest

#### Step 3: Tune Batch Size

- If training is unstable: Reduce batch size or add warmup
- If validation loss plateaus early: Reduce batch size (more noise helps generalization)
- If training is too slow: Increase batch size (if memory allows)

#### Common Failure Modes

- **Loss explodes:** LR too high. Reduce by 10×.
- **Loss stuck:** LR too low, or bad initialization. Try larger LR.
- **Train good, val bad:** Overfitting. Add [regularization](https://www.tensortonic.com/ml-math/optimization/regularization), reduce model size, or use smaller batch.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept