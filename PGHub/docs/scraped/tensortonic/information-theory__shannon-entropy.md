---
source_url: https://tensortonic.com/ml-math/information-theory/shannon-entropy
title: Shannon Entropy: Formula, Bits & Interactive Calculator | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

01/07

Information Theory

### Contents

IntroductionIntuition: Measuring SurpriseBits: The Unit of InformationInformation Content FormulaInteractive: Information ContentEntropy: Expected SurpriseInteractive: Binary EntropyInteractive: Entropy ComparisonKey PropertiesWorked ExamplesConnection to Coding TheoryML Applications

## Introduction

In 1948, Claude Shannon published "A Mathematical Theory of Communication," creating the field of Information Theory. He asked a deceptively simple question: _"How do we measure information?"_

Before Shannon, "information" was vague and philosophical. After Shannon, information became a precise, measurable quantity, as fundamental as mass or energy. This single insight underlies everything from data compression (ZIP files) to neural networks ( [Cross-Entropy loss](https://www.tensortonic.com/ml-math/information-theory/cross-entropy)).

#### Shannon's Key Insight

Information is the **resolution of uncertainty**. If you already knew something with certainty, telling you provides zero information. If you didn't know it at all, telling you provides maximum information.

## Intuition: Measuring Surprise

Think of information as **surprise**. Unlikely events are surprising; likely events are not.

#### Low Information (No Surprise)

"The sun rose this morning."

P(sun rises) = 1.0. You knew this would happen. The message tells you nothing you didn't already know.

#### High Information (Surprising)

"It snowed in the Sahara Desert today."

P(Sahara snow) = 0.0001. This is shocking! The message carries enormous information.

"Information is inversely proportional to probability."

## Bits: The Unit of Information

Shannon defined the unit of information as the **bit** (binary digit). One bit is the amount of information gained from learning the outcome of a fair coin flip.

#### How Many Bits?

1

bit

2 equally likely outcomes (coin flip)

2

bits

4 outcomes (00, 01, 10, 11)

3

bits

8 outcomes (2^3)

Bits needed=log⁡2(Number of equally likely outcomes)\\text{Bits needed} = \\log\_2(\\text{Number of equally likely outcomes})Bits needed=log2​(Number of equally likely outcomes)

To identify one person among 8 billion, you need log⁡2(8×109)≈33\\log\_2(8 \\times 10^9) \\approx 33log2​(8×109)≈33 bits. That's 33 yes/no questions.

## Information Content (Surprisal)

If an event xxx has probability P(x)P(x)P(x), its **information content** (also called "surprisal" or "self-information") is:

I(x)=−log⁡2P(x)=log⁡21P(x)I(x) = -\\log\_2 P(x) = \\log\_2 \\frac{1}{P(x)}I(x)=−log2​P(x)=log2​P(x)1​

Measured in bits when using log⁡2\\log\_2log2​. Use ln⁡\\lnln for "nats" (natural units).

#### Why Logarithm?

**Information is additive.** Two independent coin flips provide 1+1=21 + 1 = 21+1=2 bits of information.

Probabilities multiply (0.5×0.5=0.250.5 \\times 0.5 = 0.250.5×0.5=0.25). Logarithms turn multiplication into addition:

log⁡(P1⋅P2)=log⁡(P1)+log⁡(P2)\\log(P\_1 \\cdot P\_2) = \\log(P\_1) + \\log(P\_2)log(P1​⋅P2​)=log(P1​)+log(P2​)

P(x) = 1.0

I(x) = 0 bits

Certainty: No surprise

P(x) = 0.5

I(x) = 1 bit

Fair coin flip

P(x) = 0.001

I(x) = 9.97 bits

Rare event: Very surprising

## Interactive: Information Content

Explore the inverse relationship between probability and information. Drag the slider to see how rare events carry more information!

### Information Content Visualization

See how information content I(x) = -log₂(P(x)) changes with probability. Rare events carry more information!

Probability: 0.500

0.01 (Very Rare)0.5 (Fair)1.0 (Certain)

Probability P(x)Information I(x) (bits)0.000.250.500.751.0002468101.00 bits

Probability

0.500

Information Content

1.00 bits

Interpretation

Moderate

#### Key Observations

- As probability approaches 0, information content goes to infinity (very surprising events)
- When P(x) = 1.0, I(x) = 0 (certain events carry no information)
- When P(x) = 0.5, I(x) = 1 bit (a fair coin flip)
- The relationship is logarithmic: information adds when probabilities multiply

## Entropy: The Expected Surprise

I(x)I(x)I(x) is the information for a single specific event. **Entropy** HHH is the **average** information content of the entire probability distribution. It tells us how "unpredictable" the source is on average.

H(X)=E\[I(X)\]=−∑xP(x)log⁡2P(x)H(X) = E\[I(X)\] = -\\sum\_{x} P(x) \\log\_2 P(x)H(X)=E\[I(X)\]=−∑x​P(x)log2​P(x)

Entropy is the expected value of information content.

#### Low Entropy (Predictable)

Biased coin: P(H) = 0.99, P(T) = 0.01

H = 0.08 bits. The outcome is almost certain.

#### High Entropy (Uncertain)

Fair coin: P(H) = 0.5, P(T) = 0.5

H = 1.0 bit. Maximum uncertainty for 2 outcomes.

## Interactive: Binary Entropy

Explore how entropy changes as you adjust the probability. Notice that entropy is maximized when the outcome is most uncertain.

### Binary Entropy Function

Uncertainty in a coin flip

Max: 1 bit

Probability Distribution

HEADS

TAILS

0.500.50

Adjust P(Heads)

Surprise (Bits)

If Heads1.00 bits

If Tails1.00 bits

P(Heads)Entropy H(X)00.5101

Current Entropy

1.00

bits

#### Maximum Uncertainty

When P(Heads) = 0.5, the outcome is completely unpredictable. You need exactly **1 bit** of information to know the result.

## Interactive: Entropy Comparison

Compare entropy across different probability distributions. See how uniformity maximizes entropy!

### Entropy Comparison

Compare entropy across different probability distributions. Uniform = highest entropy, deterministic = zero entropy.

UniformModerately SkewedHighly SkewedDeterministic

#### Probability Distribution

Probability0.25x10.25x20.25x30.25x40.000.250.500.751.00

#### Entropy Level

2.00bits

Max Entropy: 2.0 bits

100% of maximum

#### Entropy Calculation

H(X)=−∑i=14P(xi)log⁡2P(xi)H(X) = -\\sum\_{i=1}^{4} P(x\_i) \\log\_2 P(x\_i)H(X)=−∑i=14​P(xi​)log2​P(xi​)

-0.25 × log₂(0.25) = 0.500

-0.25 × log₂(0.25) = 0.500

-0.25 × log₂(0.25) = 0.500

-0.25 × log₂(0.25) = 0.500

H(X) = 2.000 bits

**Uniform:** All outcomes equally likely - maximum entropy

## Key Properties of Entropy

#### 1\. Non-Negativity

H(X)≥0H(X) \\ge 0H(X)≥0. Entropy is never negative. The minimum is 0 (complete certainty).

#### 2\. Maximum for Uniform Distribution

For n outcomes, entropy is maximized when all outcomes are equally likely: Hmax=log⁡2(n)H\_{max} = \\log\_2(n)Hmax​=log2​(n).

#### 3\. Additivity for Independent Variables

If X and Y are independent: H(X,Y)=H(X)+H(Y)H(X, Y) = H(X) + H(Y)H(X,Y)=H(X)+H(Y). Joint uncertainty is the sum of individual uncertainties.

#### 4\. Conditioning Reduces Entropy

H(X∣Y)≤H(X)H(X\|Y) \\le H(X)H(X∣Y)≤H(X). Knowing something about Y can only reduce (or maintain) uncertainty about X. This is related to [Mutual Information](https://www.tensortonic.com/ml-math/information-theory/mutual-information).

## Worked Examples

#### Example 1: Fair Coin

P(H)=0.5,P(T)=0.5P(H) = 0.5, P(T) = 0.5P(H)=0.5,P(T)=0.5

H(X)=−(0.5log⁡20.5+0.5log⁡20.5)H(X) = -(0.5 \\log\_2 0.5 + 0.5 \\log\_2 0.5)H(X)=−(0.5log2​0.5+0.5log2​0.5)

H(X)=−(0.5×(−1)+0.5×(−1))=1 bitH(X) = -(0.5 \\times (-1) + 0.5 \\times (-1)) = 1 \\text{ bit}H(X)=−(0.5×(−1)+0.5×(−1))=1 bit

#### Example 2: Fair Die (6 sides)

Each outcome has probability 1/61/61/6.

H(X)=−6×16log⁡216=log⁡26≈2.58 bitsH(X) = -6 \\times \\frac{1}{6} \\log\_2 \\frac{1}{6} = \\log\_2 6 \\approx 2.58 \\text{ bits}H(X)=−6×61​log2​61​=log2​6≈2.58 bits

#### Example 3: English Text

Letters in English are not uniformly distributed. 'e' appears ~12%, 'z' appears ~0.07%.

Shannon estimated English text has about **1-1.5 bits per character**, far less than the 4.7 bits needed for uniform 26 letters. This redundancy enables compression!

## Connection to Coding Theory

Entropy is not just abstract. It directly tells us the **minimum number of bits** needed to encode messages from a source.

#### Shannon's Source Coding Theorem

You cannot compress data below its entropy. On average, you need at least H(X)H(X)H(X) bits per symbol.

Example: A source with entropy 2 bits/symbol cannot be compressed below 2 bits/symbol on average, no matter how clever the algorithm.

#### Huffman Coding

Assign short codes to frequent symbols, long codes to rare symbols. This is how ZIP, JPEG, and MP3 work. The average code length approaches entropy.

## ML Applications

#### Cross-Entropy Loss

The most common loss function for classification. It measures how well a model's predicted distribution QQQ matches the true distribution PPP. See the [Cross-Entropy](https://www.tensortonic.com/ml-math/information-theory/cross-entropy) page for details.

#### Decision Trees (Information Gain)

Trees choose splits that maximize **Information Gain** = reduction in entropy. The feature that most reduces uncertainty is chosen. See [Information Gain](https://www.tensortonic.com/ml-math/information-theory/information-gain).

#### Variational Autoencoders (KL Divergence)

VAEs use [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence) to measure the difference between the learned latent distribution and a prior (usually Gaussian).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept