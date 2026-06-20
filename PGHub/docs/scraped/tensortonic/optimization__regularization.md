---
source_url: https://tensortonic.com/ml-math/optimization/regularization
title: Regularization: L1, L2, Dropout & Elastic Net | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

06/09

Optimization

### Contents

IntroductionBias-Variance TradeoffL2 Regularization (Ridge)L1 Regularization (Lasso)Geometric IntuitionInteractive: L1 vs L2Elastic NetBayesian InterpretationDropoutInverted Dropout & ScalingDropout as EnsembleComparison Table

## Introduction

A deep neural network with millions of parameters is a "universal function approximator." It can memorize every single pixel of your training data. With a powerful enough model and [cross-entropy loss](https://www.tensortonic.com/ml-math/information-theory/cross-entropy), the model fits the training set perfectly.

This is a problem. When a model memorizes training data instead of learning general patterns, it fails catastrophically on new, unseen data. This is **overfitting**, and understanding [loss landscapes](https://www.tensortonic.com/ml-math/optimization/loss-landscapes) helps explain why it happens.

**Regularization** intentionally constrains the model's capacity. We force it to be "simpler," which paradoxically makes it generalize better. It's like training with handicaps so you perform better in the real competition.

## Bias-Variance Tradeoff

Every ML model's error can be decomposed into three parts:

Error=Bias2+Variance+Irreducible Noise\\text{Error} = \\text{Bias}^2 + \\text{Variance} + \\text{Irreducible Noise}Error=Bias2+Variance+Irreducible Noise

#### High Bias (Underfitting)

Model is too simple. Can't capture the true pattern.

Example: Fitting a line to parabolic data.

#### High Variance (Overfitting)

Model is too complex. Fits noise in training data.

Example: 20-degree polynomial through 10 points.

Regularization increases bias slightly but dramatically reduces variance. The tradeoff is usually worth it.

## L2 Regularization (Ridge)

L2 regularization adds the sum of squared weights to the loss function. During [gradient descent](https://www.tensortonic.com/ml-math/optimization/sgd-variants), this penalizes large weights:

Ltotal=Ldata+λ∑iwi2\\mathcal{L}\_{\\text{total}} = \\mathcal{L}\_{\\text{data}} + \\lambda \\sum\_i w\_i^2Ltotal​=Ldata​+λ∑i​wi2​

#### Gradient Update with L2

The gradient of the penalty is 2λw2\\lambda w2λw:

wnew=w−η(∇L+2λw)w\_{new} = w - \\eta(\\nabla L + 2\\lambda w)wnew​=w−η(∇L+2λw)

wnew=w(1−2ηλ)−η∇Lw\_{new} = w(1 - 2\\eta\\lambda) - \\eta \\nabla Lwnew​=w(1−2ηλ)−η∇L

This is called **Weight Decay**. Every step, weights are multiplied by a factor slightly less than 1. See [AdamW](https://www.tensortonic.com/ml-math/optimization/adaptive-rates) for why decoupling weight decay matters.

#### L2's Effect

L2 penalizes large weights quadratically. A weight of 10 is penalized 100x more than a weight of 1. Result: Weights are pushed toward zero but **rarely reach exactly zero**. All features contribute, just with smaller coefficients. The L2 penalty is also [convex](https://www.tensortonic.com/ml-math/optimization/convex-optimization), making optimization tractable.

## L1 Regularization (Lasso)

L1 regularization adds the sum of absolute weights:

Ltotal=Ldata+λ∑i∣wi∣\\mathcal{L}\_{\\text{total}} = \\mathcal{L}\_{\\text{data}} + \\lambda \\sum\_i \|w\_i\|Ltotal​=Ldata​+λ∑i​∣wi​∣

#### Gradient Update with L1

The gradient of ∣w∣\|w\|∣w∣ is sign(w)\\text{sign}(w)sign(w) (either +1 or -1):

wnew=w−η(∇L+λ⋅sign(w))w\_{new} = w - \\eta(\\nabla L + \\lambda \\cdot \\text{sign}(w))wnew​=w−η(∇L+λ⋅sign(w))

The penalty subtracts a **constant** from the weight magnitude at each step, regardless of the weight's current value.

#### L1's Effect: Sparsity

Unlike L2, L1 pushes weights all the way to **exactly zero**. This produces sparse models where many features are completely ignored. L1 effectively performs **feature selection**, similar in spirit to how [Information Gain](https://www.tensortonic.com/ml-math/information-theory/information-gain) selects features in decision trees.

## Geometric Intuition

The magic of L1 sparsity comes from geometry. Think of regularization as constraining weights to lie within a region. This is closely related to [constrained optimization](https://www.tensortonic.com/ml-math/optimization/lagrange-multipliers).

#### L1: The Diamond

∣w1∣+∣w2∣≤C\|w\_1\| + \|w\_2\| \\le C∣w1​∣+∣w2​∣≤C

Sharp corners on the axes. Loss contours likely hit a corner first, zeroing one weight.

#### L2: The Circle

w12+w22≤Cw\_1^2 + w\_2^2 \\le Cw12​+w22​≤C

No corners. Loss contours hit a smooth edge. Both weights stay non-zero.

## Interactive: L1 vs L2 Geometry

Watch how the loss contours intersect the constraint regions. L1's corners naturally produce zeros.

### L1 (Diamond) vs L2 (Circle) Geometry

The constraint region shape determines where the loss contours first touch.

L1 (Lasso)L2 (Ridge)

Constraint budget: 1.2

Unconstrained Minw1w2

L2: Circle = Distributed Weights

The loss contours (orange/green ellipses) hit the circle at an arbitrary point on the edge. Both weights are small but **non-zero**. L2 shrinks weights uniformly without zeroing them out.

w1

1.157

w2

0.320

## Elastic Net

Why choose? Elastic Net combines both:

L=Ldata+λ1∑∣wi∣+λ2∑wi2\\mathcal{L} = \\mathcal{L}\_{data} + \\lambda\_1 \\sum \|w\_i\| + \\lambda\_2 \\sum w\_i^2L=Ldata​+λ1​∑∣wi​∣+λ2​∑wi2​

Elastic Net gets L1's feature selection while avoiding its instability when features are correlated. It's the default in many scikit-learn models.

#### The Grouping Effect

L1 regularization has a known weakness: if a group of features are highly correlated (e.g., "height in cm" and "height in inches"), L1 tends to select just one at random and zero out the others. This is unstable and arbitrary.

Elastic Net's L2 term encourages the **grouping effect**: correlated features are retained together and assigned similar weights. This makes the model more robust and interpretable when features are redundant.

## Bayesian Interpretation

Regularization has a beautiful [Bayesian interpretation](https://www.tensortonic.com/ml-math/statistics/bayesian-frequentist). Adding a penalty is equivalent to placing a prior belief on the weights.

#### L2 = [Gaussian](https://www.tensortonic.com/ml-math/probability/distributions) Prior

"I believe weights are normally distributed around 0."

P(w)∝e−w2P(w) \\propto e^{-w^2}P(w)∝e−w2

#### L1 = [Laplace](https://www.tensortonic.com/ml-math/probability/distributions) Prior

"I believe most weights should be exactly zero."

P(w)∝e−∣w∣P(w) \\propto e^{-\|w\|}P(w)∝e−∣w∣

#### MAP Estimation

Regularized loss is equivalent to **Maximum A Posteriori (MAP)** estimation, closely related to [MLE](https://www.tensortonic.com/ml-math/statistics/maximum-likelihood-estimation). We're finding the most probable weights given both the data AND our prior beliefs. [Bayes' theorem](https://www.tensortonic.com/ml-math/probability/bayes-theorm) in action.

## Dropout

[Dropout (Srivastava et al., 2014)](https://jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf) is a radical regularization technique for neural networks. During training, we randomly "kill" neurons by setting their outputs to zero. It works differently from L1/L2 and complements [batch normalization](https://www.tensortonic.com/ml-math/optimization/batch-normalization) (which also has regularization effects).

#### How Dropout Works

For each training batch, each neuron has probability ppp of being dropped (output set to 0). Formally, we apply a mask vector rrr of Bernoulli random variables:

rj∼Bernoulli(p)r\_j \\sim \\text{Bernoulli}(p)rj​∼Bernoulli(p)

h=f(W(x⊙r)+b)h = f(W(x \\odot r) + b)h=f(W(x⊙r)+b)

**Intuition:** Imagine a team where any member might call in sick randomly. The team can't rely on one "superstar" to do everything. Everyone must learn to contribute. This forces **redundant, robust** representations.

### Dropout Simulation

TrainingInference

Dropout Rate (p): 0.5

Probability a neuron is dropped (zeroed out).

New Mask (Next Batch)

x1x2x3h1\_1h1\_2h1\_3h1\_4h1\_5h2\_1h2\_2h2\_3h2\_4h3\_1h3\_2h3\_3h3\_4y1y2InputHidden 1Hidden 2Hidden 3Output

**Training:** Each batch randomly drops neurons across **all 3 hidden layers**. The network becomes a "thinned" version of itself. This prevents neurons from relying too much on any specific peer and forces the network to learn robust, distributed representations.

#### Preventing Co-Adaptation

Without dropout, neurons develop complex co-dependencies: "I only need to detect X because neuron 47 detects Y." With dropout, neuron 47 might be absent, so each neuron must be individually useful. This prevents brittle, specialized features and forces the network to learn more generalizable patterns.

## Inverted Dropout & Scaling

There's a subtle problem: during training, only (1−p)(1-p)(1−p) of neurons are active. At test time, all neurons are active. The expected activation magnitude is different!

#### The Scaling Problem

With p=0.5p = 0.5p=0.5 dropout, training uses ~50 active neurons. Testing uses all 100.

Training

Signal: ~50x

Testing (No Dropout)

Signal: ~100x (2x stronger!)

#### Inverted Dropout (The Fix)

Instead of scaling at test time (which is annoying), we scale up activations **during training**:

y=11−p⋅mask⋅xy = \\frac{1}{1-p} \\cdot \\text{mask} \\cdot xy=1−p1​⋅mask⋅x

With p=0.5p=0.5p=0.5, we multiply surviving activations by 2. This ensures the expected value of the activation remains constant between training and testing. At test time, we simply run the network normally without any scaling or masking. This is computationally efficient and standard in modern frameworks like PyTorch and TensorFlow.

## Dropout as Ensemble

There's a deep theoretical justification for dropout: it implicitly trains an **ensemble** of 2N2^N2N different networks (where N is the number of neurons). This connects to the power of [bootstrap aggregation](https://www.tensortonic.com/ml-math/statistics/resampling).

Each dropout mask creates a different "thinned" sub-network. By training with random masks, we're training exponentially many sub-networks simultaneously, all sharing weights. At test time, using all neurons approximates averaging the predictions of all these sub-networks.

This connects to the success of Random Forests and Bagging. Ensemble methods work because they average out individual model errors. Dropout achieves this "for free" within a single network.

## Comparison Table

| Technique | Best For | Effect |
| --- | --- | --- |
| L1 (Lasso) | Feature selection, sparse models | Drives weights to exactly zero |
| L2 (Ridge) | General purpose, weight decay | Shrinks all weights uniformly |
| Elastic Net | Correlated features | L1 + L2 combined |
| Dropout | Deep neural networks | Forces redundant representations |

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept