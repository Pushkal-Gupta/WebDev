---
source_url: https://tensortonic.com/ml-math/information-theory/cross-entropy
title: Cross-Entropy Loss: Formula, BCE vs MSE & Gradient Explained | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

02/07

Information Theory

### Contents

IntroductionIntuition: Penalty for Wrong CodesThe General FormulaInteractive: Loss CurveBinary Cross-Entropy (BCE)Categorical Cross-EntropyInteractive: BCE vs CCEThe Beautiful GradientWhy Not MSE?Interactive: Gradient ComparisonDerivation from MLEInteractive: MLE to BCEML Applications

## Introduction

When training a classifier (image recognition, spam detection, language modeling), the model outputs probabilities for each class. For a cat image, it might output: y^=\[0.8,0.2\]\\hat{y} = \[0.8, 0.2\]y^​=\[0.8,0.2\] (80% Cat, 20% Dog).

The true label is y=\[1.0,0.0\]y = \[1.0, 0.0\]y=\[1.0,0.0\] (100% Cat). We need a way to measure how "wrong" the prediction is. **Cross-Entropy** is that measure.

#### Why "Cross"?

[Entropy](https://www.tensortonic.com/ml-math/information-theory/shannon-entropy) measures uncertainty using the true distribution. **Cross-Entropy** measures uncertainty using a different (predicted) distribution. The "cross" refers to using P to weight but Q to compute information.

## Intuition: Penalty for Wrong Codes

Imagine you're designing a compression code for English text. You assign short codes to frequent letters ('e', 't') and long codes to rare letters ('z', 'q').

But what if you designed the code based on **French** letter frequencies? You'd use the wrong code lengths. Some letters would have wastefully long codes, others too short. This inefficiency is measured by Cross-Entropy.

H(P,Q)=Average bits using code Q for data from PH(P, Q) = \\text{Average bits using code Q for data from P}H(P,Q)=Average bits using code Q for data from P

If Q = P (perfect model), Cross-Entropy equals Entropy. If Q is wrong, Cross-Entropy is higher.

## The General Formula

For discrete probability distributions P (truth) and Q (prediction):

H(P,Q)=−∑xP(x)ln⁡Q(x)H(P, Q) = -\\sum\_{x} P(x) \\ln Q(x)H(P,Q)=−∑x​P(x)lnQ(x)

We average over P (what actually happens) but compute information using Q (our model's probabilities).

#### Key Relationship

H(P,Q)=H(P)+DKL(P∣∣Q)H(P, Q) = H(P) + D\_{KL}(P \|\| Q)H(P,Q)=H(P)+DKL​(P∣∣Q)

Cross-Entropy = Entropy of P + [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence). Since H(P) is constant (data is fixed), minimizing Cross-Entropy is equivalent to minimizing KL Divergence.

## Interactive: Loss Curve

Explore how the loss changes with prediction confidence. Notice the exponential penalty for confident wrong predictions.

### Binary Cross-Entropy Loss

Adjust the model's prediction and see how the loss changes. Wrong confident predictions are heavily penalized.

True Label = 1 (Positive)True Label = 0 (Negative)

Model Prediction P(class=1) = 0.70

Predicted P(class=1)Loss00.51

True Label

1

Prediction

0.70

Loss

0.3567

**Confidently Correct!** The model's prediction aligns with the true label. Low loss.

## Binary Cross-Entropy (BCE)

For binary classification (0 or 1), we have one output neuron with Sigmoid activation. Let yyy be the label (0 or 1) and y^\\hat{y}y^​ be the prediction.

L=−\[yln⁡(y^)+(1−y)ln⁡(1−y^)\]L = -\[y \\ln(\\hat{y}) + (1-y) \\ln(1-\\hat{y})\]L=−\[yln(y^​)+(1−y)ln(1−y^​)\]

#### If y = 1 (Positive)

Loss = −ln⁡(y^)-\\ln(\\hat{y})−ln(y^​)

We want y^\\hat{y}y^​ close to 1. If it's 0.9, loss is 0.1. If it's 0.001, loss is 6.9!

#### If y = 0 (Negative)

Loss = −ln⁡(1−y^)-\\ln(1-\\hat{y})−ln(1−y^​)

We want y^\\hat{y}y^​ close to 0.

## Categorical Cross-Entropy (CCE)

For multi-class classification (MNIST digits 0-9, ImageNet 1000 classes), we use Softmax activation. Let yyy be a one-hot vector (e.g., \[0,1,0,...,0\]\[0, 1, 0, ..., 0\]\[0,1,0,...,0\] for digit 1).

L=−∑c=1Cycln⁡(y^c)L = -\\sum\_{c=1}^C y\_c \\ln(\\hat{y}\_c)L=−∑c=1C​yc​ln(y^​c​)

Since y is one-hot, only the term for the true class survives:

L=−ln⁡(y^true)L = -\\ln(\\hat{y}\_{true})L=−ln(y^​true​)

This is why PyTorch's `nn.CrossEntropyLoss` only needs the class index, not a one-hot vector. The framework handles the one-hot encoding internally!

## Interactive: BCE vs CCE

Compare how Binary and Categorical Cross-Entropy compute loss for different scenarios.

### Binary vs Categorical Cross-Entropy

Compare how loss is calculated for binary classification (2 classes) vs multi-class classification.

Binary (2 Classes)Categorical (4 Classes)

Predicted Probability for Positive Class: 0.700

0.010.99

#### Formula (y = 1)

L=−ln⁡(y^)L = -\\ln(\\hat{y})L=−ln(y^​)

L=−ln⁡(0.700)=0.357L = -\\ln(0.700) = 0.357L=−ln(0.700)=0.357

Binary Cross-Entropy Loss

0.357

#### Key Insight

Binary CE only considers the probability of the true class. As the model becomes more confident (p → 1), loss decreases. Wrong confident predictions (p → 0) have huge loss!

## The Beautiful Gradient

One reason Cross-Entropy is preferred: its gradient with Softmax/Sigmoid is remarkably simple.

#### For Softmax + CCE:

∂L∂zi=y^i−yi\\frac{\\partial L}{\\partial z\_i} = \\hat{y}\_i - y\_i∂zi​∂L​=y^​i​−yi​

The gradient is simply: **prediction minus truth**. No log derivatives, no complicated expressions. This is a consequence of the log in Cross-Entropy canceling with the exp in Softmax.

#### Why This Matters

When the model is very wrong (y^\\hat{y}y^​ far from y), the gradient is large, pushing for fast correction. When the model is nearly right, the gradient is small. The learning rate is "self-adjusting."

## Why Not Mean Squared Error?

You _can_ use MSE for classification, but it performs poorly due to the vanishing gradient problem.

#### MSE Problem

With MSE + Sigmoid, the gradient involves σ′(z)\\sigma'(z)σ′(z).

When z is very wrong (e.g., z = -10 but y = 1), the Sigmoid derivative is nearly 0. **Gradient vanishes. Learning stops.**

#### Cross-Entropy Fix

The log in CE cancels the exp in Sigmoid.

Gradient simplifies to (y^−y)(\\hat{y} - y)(y^​−y). **Large error = Large gradient.** Learning continues strongly.

## Interactive: Gradient Comparison

See the dramatic difference in gradient behavior between MSE and Cross-Entropy. Notice how MSE gradients vanish when the prediction is very wrong!

### MSE vs Cross-Entropy: Gradient Comparison

See why Cross-Entropy is preferred: gradients stay large when the model is wrong, enabling faster learning.

Model Prediction (True Label = 1): 0.200

0.01 (Very Wrong)0.50.99 (Correct)

#### Gradient Magnitude

Prediction (ŷ)\|Gradient\|Cross-EntropyMSE

#### MSE Gradient

0.2560

2(y^−y)⋅σ′(z)2(\\hat{y} - y) \\cdot \\sigma'(z)2(y^​−y)⋅σ′(z)

Includes σ'(z) which vanishes when very wrong!

#### CE Gradient

0.8000

y^−y\\hat{y} - yy^​−y

Simple difference! Large error = large gradient.

#### The Problem with MSE

When the prediction is far from the truth (ŷ ≈ 0 but y = 1), the sigmoid derivative σ'(z) ≈ 0. This causes the MSE gradient to **vanish**, even though the model is very wrong!

Cross-Entropy avoids this: the log cancels the exp in sigmoid, giving a clean gradient that's proportional to the error. Learning never stalls.

## Derivation from Maximum Likelihood

Cross-Entropy isn't arbitrary. It emerges naturally from [Maximum Likelihood Estimation (MLE)](https://www.tensortonic.com/ml-math/statistics/maximum-likelihood-estimation) assuming a [Bernoulli distribution](https://www.tensortonic.com/ml-math/probability/distributions) for binary classification.

#### The Derivation

**Likelihood:** L(θ)=∏iP(yi∣xi;θ)L(\\theta) = \\prod\_{i} P(y\_i \| x\_i; \\theta)L(θ)=∏i​P(yi​∣xi​;θ)

**For Bernoulli:** P(y∣x)=y^y(1−y^)1−yP(y\|x) = \\hat{y}^y (1-\\hat{y})^{1-y}P(y∣x)=y^​y(1−y^​)1−y

**Log-Likelihood:** ln⁡L(θ)=∑\[yln⁡(y^)+(1−y)ln⁡(1−y^)\]\\ln L(\\theta) = \\sum \[y \\ln(\\hat{y}) + (1-y) \\ln(1-\\hat{y})\]lnL(θ)=∑\[yln(y^​)+(1−y)ln(1−y^​)\]

**Negative Log-Likelihood = Binary Cross-Entropy!**

This connection shows that minimizing Cross-Entropy is equivalent to maximizing the likelihood of observing the training data. It's the principled statistical foundation for why this loss function works.

## Interactive: MLE to BCE

Visualize the transformation from Likelihood to Cross-Entropy Loss. See how maximizing likelihood is equivalent to minimizing BCE.

Target class:

y = 1y = 0

01Predicted probability-4-2024

1\. Likelihood

0.700

↓ take ln()

2\. Log-Likelihood

-0.357

↓ negate

3\. BCE Loss

0.357

Prediction y^\\hat{y}y^​:0.70

## ML Applications

#### Image Classification (CNNs)

ImageNet, CIFAR, MNIST: all use Categorical Cross-Entropy. ResNet, VGG, EfficientNet models are trained with CCE + Softmax to classify thousands of object categories.

Binary variant used for single-label detection (cat vs not-cat).

#### Natural Language Processing

Language models (GPT, BERT) predict next tokens using CCE over vocabulary. Sentiment analysis uses BCE (positive/negative). Named Entity Recognition uses CCE per token.

Perplexity (model quality metric) is simply exp(Cross-Entropy).

#### Medical Diagnosis

Binary classification for disease detection (tumor/no tumor). Multi-class for disease type classification. Focal Loss (variant of CE) used for imbalanced medical datasets.

Calibrated probabilities matter for clinical decisions.

#### Recommender Systems

Click prediction (will user click? BCE). Multi-task learning with multiple BCE losses. Learning to rank using listwise CE.

Companies like Netflix, YouTube use variants for content recommendation.

#### Reinforcement Learning

Policy gradient methods use CE to train action distributions. Actor-Critic models optimize policy using CCE over discrete action spaces.

PPO, A3C algorithms rely on Cross-Entropy for policy updates.

#### Generative Models

[Variational Autoencoders (VAEs)](https://www.tensortonic.com/ml-math/information-theory/kl-divergence) use BCE for binary data reconstruction. GANs use BCE in discriminator training. Diffusion models use variants for denoising objectives.

Critical for modern generative AI (Stable Diffusion, DALL-E).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept