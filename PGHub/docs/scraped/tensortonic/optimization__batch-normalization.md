---
source_url: https://tensortonic.com/ml-math/optimization/batch-normalization
title: Batch Normalization: Training Deep Networks | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

07/09

Optimization

### Contents

IntroductionThe Problem: ICSInteractive: Covariate ShiftThe AlgorithmInteractive: DistributionTraining vs InferenceWhy It WorksVariants & ExtensionsPractical ConsiderationsLimitations

## Introduction

Batch Normalization (BN), introduced by [Ioffe and Szegedy (2015)](https://arxiv.org/abs/1502.03167), revolutionized deep learning training. Before BN, training very deep networks was notoriously difficult: gradients would vanish or explode during [backpropagation](https://www.tensortonic.com/ml-math/calculus/backpropagation), requiring careful initialization and low [learning rates](https://www.tensortonic.com/ml-math/optimization/adaptive-rates).

BN solves this by normalizing the inputs to each layer, making training faster, more stable, and less sensitive to initialization. It's now a standard component in most modern architectures.

### The Impact

With BatchNorm, you can use much higher learning rates (10-100x), train deeper networks (100+ layers), and often remove [dropout](https://www.tensortonic.com/ml-math/optimization/regularization) completely. It's not an exaggeration to say BN enabled the deep learning revolution of 2015-2020.

## The Problem: Internal Covariate Shift

Consider a deep network. Each layer transforms its input:

h(l)=f(W(l)h(l−1)+b(l))h^{(l)} = f(W^{(l)} h^{(l-1)} + b^{(l)})h(l)=f(W(l)h(l−1)+b(l))

During training, as we update weights W(l-1) in earlier layers, the distribution of h(l-1) changes. This means layer l constantly receives inputs from a **shifting distribution**, a phenomenon called _Internal Covariate Shift_ (ICS).

#### Problem 1: Vanishing/Exploding Gradients

If activations grow unbounded, gradients explode. If they shrink, gradients vanish. Without normalization, you're forced to use tiny [learning rates](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) and careful initialization.

#### Problem 2: Saturated Activations

Activations like sigmoid/tanh saturate (gradient ≈ 0) when inputs get too large. Without BN, activations drift into saturation zones, killing learning.

#### Problem 3: Slow [Convergence](https://www.tensortonic.com/ml-math/optimization/convex-optimization)

Each layer must continuously adapt to changing input distributions. This slows down learning significantly, especially in deep networks.

### Interactive: See Covariate Shift in Action

### Internal Covariate Shift

Watch how activation distributions shift during training

BatchNorm

Simulate Training

Input

L1

L2

L3

L4

Output

Layer 1 Activations

μ: 0.00σ: 1.00

Layer 2 Activations

μ: 0.00σ: 1.00

Layer 3 Activations

μ: 0.00σ: 1.00

Layer 4 Activations

μ: 0.00σ: 1.00

Covariate Shift Detected

Step: 0

Without BatchNorm, earlier layer weight updates cause later layer distributions to shift. This is Internal Covariate Shift.

#### Without BatchNorm

- • Distributions drift unpredictably
- • Later layers must constantly adapt
- • Gradients vanish/explode
- • Requires low learning rate

#### With BatchNorm

- • Distributions stay normalized
- • Each layer sees consistent inputs
- • Stable gradient flow
- • Can use 10-100x higher LR

## The Algorithm

Batch Normalization normalizes each feature to have zero [mean](https://www.tensortonic.com/ml-math/probability/random-variables) and unit [variance](https://www.tensortonic.com/ml-math/probability/random-variables) across the mini-batch. For a mini-batch of size m with feature vector x:

#### Batch Normalization Transform

Step 1: Compute batch statistics

μB=1m∑i=1mxi\\mu\_B = \\frac{1}{m} \\sum\_{i=1}^m x\_iμB​=m1​∑i=1m​xi​σB2=1m∑i=1m(xi−μB)2\\sigma\_B^2 = \\frac{1}{m} \\sum\_{i=1}^m (x\_i - \\mu\_B)^2σB2​=m1​∑i=1m​(xi​−μB​)2

Step 2: Normalize

x^i=xi−μBσB2+ϵ\\hat{x}\_i = \\frac{x\_i - \\mu\_B}{\\sqrt{\\sigma\_B^2 + \\epsilon}}x^i​=σB2​+ϵ​xi​−μB​​

ε (typically 10-5) prevents division by zero

Step 3: Scale and shift (learnable)

yi=γx^i+βy\_i = \\gamma \\hat{x}\_i + \\betayi​=γx^i​+β

γ and β are learned parameters that restore representational power

#### Why Scale and Shift?

Normalizing to mean 0, variance 1 might be too restrictive. The γ and β parameters let the network learn the optimal scale and shift for each feature. If the network wants the original distribution back, it can learn γ = σB and β = μB.

## Interactive: Distribution Stability

Watch how BatchNorm keeps activation distributions stable during training. Toggle it off to see distributions shift dramatically.

### Batch Normalization Effect

Visualize Internal Covariate Shift and how BN stabilizes layer inputs.

BN EnabledStart Training

Standard Normal (0, 1)Activation ValueDensity

Epoch: 0

#### Distribution Metrics

Mean μ\\muμ0.00

Std Dev σ\\sigmaσ1.00

#### Stable Distribution

Distributions remain centered and scaled. Gradients flow efficiently, and training converges faster.

## Training vs Inference

There's a crucial difference between training and inference:

#### During Training

Use batch statistics:

- Compute μB and σ²B from current mini-batch
- Normalize using these statistics
- Provides regularization (each sample sees slightly different normalization)

#### During Inference

Use population statistics:

- Use running averages computed during training
- Ensures deterministic output for same input
- Works for batch size = 1

#### Running Statistics Update

During training, maintain exponential moving averages:

μrunning←(1−α)μrunning+αμB\\mu\_{\\text{running}} \\leftarrow (1 - \\alpha) \\mu\_{\\text{running}} + \\alpha \\mu\_Bμrunning​←(1−α)μrunning​+αμB​σrunning2←(1−α)σrunning2+ασB2\\sigma^2\_{\\text{running}} \\leftarrow (1 - \\alpha) \\sigma^2\_{\\text{running}} + \\alpha \\sigma^2\_Bσrunning2​←(1−α)σrunning2​+ασB2​

Typical α (momentum) = 0.1

## Why It Works

The original paper claimed BN reduces internal covariate shift, but recent research suggests the real benefits are more nuanced:

#### 1\. Smooths the [Loss Landscape](https://www.tensortonic.com/ml-math/optimization/loss-landscapes)

BN makes the optimization landscape smoother (less Lipschitz constant), enabling larger learning rates. The loss surface becomes more predictable and easier to navigate.

#### 2\. Prevents Gradient Vanishing/Explosion

By keeping activations in a reasonable range, BN prevents gradients from becoming too small or too large as they [backpropagate](https://www.tensortonic.com/ml-math/calculus/backpropagation) through many layers.

#### 3\. Acts as [Regularization](https://www.tensortonic.com/ml-math/optimization/regularization)

Each sample is normalized differently depending on its batch. This noise acts as a regularizer, reducing overfitting (similar to [dropout](https://www.tensortonic.com/ml-math/optimization/regularization)).

#### 4\. Reduces Sensitivity to Initialization

With BN, you can use simpler initialization schemes. The normalization brings activations to a standard scale regardless of initial weights.

#### Practical Impact

With BN, you can typically:

- Use 10-100x larger [learning rates](https://www.tensortonic.com/ml-math/optimization/adaptive-rates)
- Train 2-3x faster with [SGD](https://www.tensortonic.com/ml-math/optimization/sgd-variants)
- Often eliminate [dropout](https://www.tensortonic.com/ml-math/optimization/regularization)
- Train much deeper networks ( [ResNet-152](https://arxiv.org/abs/1512.03385), etc.)

## Variants & Extensions

#### Layer Normalization (LayerNorm)

Normalize across features (not batch). Used in [Transformers](https://arxiv.org/abs/1706.03762) and RNNs where batch size is problematic.

μ=1d∑i=1dxi,σ2=1d∑i=1d(xi−μ)2\\mu = \\frac{1}{d} \\sum\_{i=1}^d x\_i, \\quad \\sigma^2 = \\frac{1}{d} \\sum\_{i=1}^d (x\_i - \\mu)^2μ=d1​∑i=1d​xi​,σ2=d1​∑i=1d​(xi​−μ)2

#### Instance Normalization

Normalize each sample independently. Popular in style transfer and GANs where batch dependencies are undesirable.

Used in: Style transfer, real-time image generation

#### Group Normalization

Divide channels into groups and normalize within each group. Works well with small batch sizes.

Used in: Object detection, video understanding (where batch size is small)

#### Weight Normalization

Normalize weights instead of activations. Decouples magnitude and direction of weight vectors. Related to [weight decay](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) in AdamW.

w=gv∥v∥w = g \\frac{v}{\\\|v\\\|}w=g∥v∥v​

## Practical Considerations

#### Where to Place BN?

**Before or after activation?** Original paper suggested before (after linear transform, before activation). Modern practice often uses after activation. Both work, but before is more common.

#### [Batch Size](https://www.tensortonic.com/ml-math/optimization/sgd-variants) Matters

BN requires reasonably large batches (≥8-16) for good statistics. Very small batches lead to noisy estimates and hurt performance. For small batches, use **Group Norm** or **Layer Norm** instead.

#### Computational Cost

BN adds ~10-15% computation overhead. The trade-off is usually worth it for the training speed improvement, but it can be a bottleneck during inference.

#### Floating Point Precision

With mixed precision training (FP16), BN can be numerically unstable. Keep BN parameters in FP32.

## Limitations & Alternatives

#### Problem 1: Batch Dependency

Training and inference use different statistics, which can cause train/test mismatch. Small batches give poor statistics.

#### Problem 2: RNNs

Applying BN to RNNs is tricky because sequence lengths vary. Layer Normalization works better for sequential models and Transformers.

#### Problem 3: Distributed Training

With very small per-GPU batch sizes in distributed settings, BN statistics become unreliable. Solutions: sync BN across GPUs (slow) or use Group Norm.

#### Modern Alternatives

Recent architectures sometimes replace BN:

- **[Transformers](https://arxiv.org/abs/1706.03762):** Use Layer Normalization (batch-independent)
- **[Vision Transformers](https://arxiv.org/abs/2010.11929):** Sometimes skip normalization entirely with proper initialization
- **[NFNets](https://arxiv.org/abs/2102.06171):** Normalizer-Free Networks use adaptive gradient clipping instead of BN
- **YOLO/Detectron:** Use Group Normalization for small batch object detection

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept