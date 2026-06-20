---
source_url: https://tensortonic.com/ml-math/information-theory/mutual-information
title: Mutual Information: Beyond Correlation | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

04/07

Information Theory

### Contents

IntroductionIntuition: Shared InformationCorrelation vs MIInteractive: Correlation vs MIThe Mathematical FormulaInteractive: Joint Distribution LandscapeInteractive: Information BitsKey PropertiesConnection to KL DivergenceReal-World ExamplesML Applications

## Introduction

We often ask: "Are these two variables related?" Standard statistics gives us [Pearson Correlation](https://www.tensortonic.com/ml-math/statistics/correlation), but that only measures _linear_ relationships.

What if the relationship is y=x2y = x^2y=x2? A perfect parabola. Correlation might be near zero because it can't see non-linear patterns!

**Mutual Information (MI)** is the information-theoretic solution. It measures _any_ kind of relationship, linear or non-linear, monotonic or chaotic. It asks: "By observing X, how many bits of uncertainty do I remove about Y?"

#### The Power of MI

Unlike correlation, MI equals zero if and only if X and Y are **truly independent**. It's the gold standard for detecting any form of statistical dependence.

## Intuition: Shared Information

Think of [entropy](https://www.tensortonic.com/ml-math/information-theory/shannon-entropy) as a "circle" of uncertainty. X has its circle of uncertainty H(X). Y has its circle H(Y). If X and Y are related, their circles overlap.

- **H(X):** Total uncertainty in X
- **H(Y):** Total uncertainty in Y
- **H(X, Y):** Joint uncertainty (the union)
- **I(X; Y):** Mutual Information (the _intersection_). The information shared between X and Y.

#### The Key Insight

Mutual Information tells you: "If I know X, how much less uncertain am I about Y?" If I(X;Y) = 0, knowing X tells you nothing about Y. They are statistically independent.

## Correlation vs Mutual Information

This is the critical distinction. Why bother with MI when we have correlation?

#### Pearson Correlation

Only detects **linear** relationships.

- y=xy = xy=x : ρ=1.0\\rho = 1.0ρ=1.0
- y=x2y = x^2y=x2 (symmetric) : ρ≈0\\rho \\approx 0ρ≈0
- y=sin⁡(x)y = \\sin(x)y=sin(x) : ρ≈0\\rho \\approx 0ρ≈0

#### Mutual Information

Detects **any** dependence.

- y=xy = xy=x : High MI
- y=x2y = x^2y=x2 : High MI
- y=sin⁡(x)y = \\sin(x)y=sin(x) : High MI

#### The Bottom Line

Correlation=0Correlation = 0Correlation=0 means no _linear_ relationship. Variables might still be strongly connected.

MI=0MI = 0MI=0 means **true independence**. No relationship of any kind exists.

## Interactive: Correlation vs MI

See how correlation fails to detect non-linear relationships that Mutual Information captures perfectly.

Linear

QuadraticSinusoidalRandom

Relationship:y=x2y = x²y=x2

XY

Pearson CorrelationFails

ρ=0.00\\rho = 0.00ρ=0.00

Only detects linear relationships

Mutual InformationDetects

I=1.8I = 1.8I=1.8

Captures any dependence

Quadratic: Correlation blind to symmetric parabola

## The Mathematical Formula

Mutual Information is the [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence) between the joint distribution P(X,Y)P(X, Y)P(X,Y) and the product of marginals P(X)P(Y)P(X)P(Y)P(X)P(Y).

Why P(X)P(Y)P(X)P(Y)P(X)P(Y)? Because if X and Y were independent, their joint distribution would factor as P(X,Y)=P(X)P(Y)P(X, Y) = P(X)P(Y)P(X,Y)=P(X)P(Y). MI measures how far reality is from independence.

I(X;Y)=∑x∑yP(x,y)log⁡(P(x,y)P(x)P(y))I(X; Y) = \\sum\_{x} \\sum\_{y} P(x, y) \\log \\left( \\frac{P(x, y)}{P(x)P(y)} \\right)I(X;Y)=∑x​∑y​P(x,y)log(P(x)P(y)P(x,y)​)

Alternative form using [Entropy](https://www.tensortonic.com/ml-math/information-theory/shannon-entropy):

I(X;Y)=H(X)+H(Y)−H(X,Y)I(X; Y) = H(X) + H(Y) - H(X, Y)I(X;Y)=H(X)+H(Y)−H(X,Y)

#### For Continuous Variables

I(X;Y)=∫∫p(x,y)log⁡(p(x,y)p(x)p(y))dxdyI(X; Y) = \\int\\int p(x,y) \\log\\left(\\frac{p(x,y)}{p(x)p(y)}\\right) dx dyI(X;Y)=∫∫p(x,y)log(p(x)p(y)p(x,y)​)dxdy

## Interactive: Joint Distribution Landscape

Explore how the structure of the joint distribution P(X,Y)P(X,Y)P(X,Y) relates to Mutual Information. High MI means the landscape is "sharp" or structured (knowing X constrains Y). Low MI means it's "flat" or grid-like (independence).

### Joint Distribution Landscape

Visualize the joint probability P(X,Y)P(X,Y)P(X,Y) as a heatmap. Mutual Information measures how "structured" this landscape is compared to the product of marginals.

independentlinearclusterscircle

Noise / Spread

X

Y

High

Low

Entropy H(X)

4.30

Entropy H(Y)

4.30

Joint H(X,Y)

7.84

Mutual Info I(X;Y)

0.76

Observation: When there is structure (lines, circles, clusters), the joint distribution is 'sharper' than the product of marginals. MI is high.

## Interactive: Information Bits

Visualize Mutual Information as **shared bits** in a data stream. When MI is high, the streams become synchronized (purple bits).

### Information Bits Stream

Visualize Mutual Information as "Shared Bits" in a data stream. When bits are synchronized (purple), information is shared.

Entropy X (P=1)

Entropy Y (P=1)

Coupling (MI)

#### Information Decomposition

H(X\|Y)

I(X;Y)

H(Y\|X)

Unique X

Mutual Info

Unique Y

Total Length = Joint Entropy H(X,Y)

## Key Properties

#### 1\. Non-Negativity

I(X;Y)≥0I(X; Y) \\geq 0I(X;Y)≥0

Mutual Information can never be negative. This follows directly from its definition as a [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence), which is always non-negative (Gibbs' inequality).

**Why intuitively?** You cannot "lose" information by observing something. At worst, an observation tells you nothing new (MI = 0), but it can never make you _more_ uncertain than before.

**Equality condition:** I(X;Y)=0I(X; Y) = 0I(X;Y)=0 if and only if P(X,Y)=P(X)P(Y)P(X, Y) = P(X)P(Y)P(X,Y)=P(X)P(Y) everywhere, meaning X and Y are statistically independent.

#### 2\. Symmetry

I(X;Y)=I(Y;X)I(X; Y) = I(Y; X)I(X;Y)=I(Y;X)

The information X reveals about Y is exactly the same as the information Y reveals about X. This is a major difference from [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence), which is asymmetric.

**Proof sketch:** Using the entropy form: I(X;Y)=H(X)−H(X∣Y)=H(Y)−H(Y∣X)I(X;Y) = H(X) - H(X\|Y) = H(Y) - H(Y\|X)I(X;Y)=H(X)−H(X∣Y)=H(Y)−H(Y∣X). Both expressions equal H(X)+H(Y)−H(X,Y)H(X) + H(Y) - H(X,Y)H(X)+H(Y)−H(X,Y), which is symmetric in X and Y.

**Practical implication:** When measuring feature-target relationships, I(Feature;Label)I(\\text{Feature}; \\text{Label})I(Feature;Label) equals I(Label;Feature)I(\\text{Label}; \\text{Feature})I(Label;Feature). The direction doesn't matter for feature selection.

#### 3\. Zero Iff Independence

I(X;Y)=0⟺X⊥ ⁣ ⁣ ⁣⊥YI(X; Y) = 0 \\iff X \\perp\\!\\!\\!\\perp YI(X;Y)=0⟺X⊥⊥Y

This is the _definitive_ test for statistical independence. Unlike correlation (which can be zero even when variables are dependent), MI = 0 guarantees true independence.

**Why correlation fails:** Consider Y=X2Y = X^2Y=X2 where X is symmetric around zero. Correlation is zero (no linear relationship), but MI is high because knowing X completely determines Y.

**The gold standard:** MI captures _all_ forms of dependence: linear, polynomial, periodic, chaotic, or any arbitrary functional relationship.

#### 4\. Self-Information Equals Entropy

I(X;X)=H(X)I(X; X) = H(X)I(X;X)=H(X)

The mutual information of a variable with itself equals its [entropy](https://www.tensortonic.com/ml-math/information-theory/shannon-entropy). This makes intuitive sense: X shares _all_ of its information with itself.

**Derivation:** I(X;X)=H(X)−H(X∣X)I(X; X) = H(X) - H(X\|X)I(X;X)=H(X)−H(X∣X). Since knowing X tells you X exactly, H(X∣X)=0H(X\|X) = 0H(X∣X)=0. Therefore I(X;X)=H(X)I(X; X) = H(X)I(X;X)=H(X).

**Upper bound:** This also gives us I(X;Y)≤min⁡(H(X),H(Y))I(X; Y) \\leq \\min(H(X), H(Y))I(X;Y)≤min(H(X),H(Y)). You can't share more information than either variable contains.

#### 5\. Data Processing Inequality

X→Y→Z⟹I(X;Z)≤I(X;Y)X \\to Y \\to Z \\implies I(X; Z) \\leq I(X; Y)X→Y→Z⟹I(X;Z)≤I(X;Y)

If Z is derived from Y (which is derived from X), then Z cannot contain more information about X than Y does. **Processing can only lose information, never create it.**

**Deep learning insight:** In a neural network, if layer 1 output is Y and layer 2 output is Z, then I(Input;Z)≤I(Input;Y)I(\\text{Input}; Z) \\leq I(\\text{Input}; Y)I(Input;Z)≤I(Input;Y). Each layer can only discard information, not add new information about the input.

**Information Bottleneck:** Good representations maximize I(Z;Label)I(Z; \\text{Label})I(Z;Label) while minimizing I(Z;Input)I(Z; \\text{Input})I(Z;Input). This is the theoretical foundation for compression in deep learning.

**Equality condition:** I(X;Z)=I(X;Y)I(X; Z) = I(X; Y)I(X;Z)=I(X;Y) only if Z is a _sufficient statistic_ for X given Y, meaning no information is lost.

#### 6\. Chain Rule for Mutual Information

I(X1,X2;Y)=I(X1;Y)+I(X2;Y∣X1)I(X\_1, X\_2; Y) = I(X\_1; Y) + I(X\_2; Y \| X\_1)I(X1​,X2​;Y)=I(X1​;Y)+I(X2​;Y∣X1​)

The information that two variables jointly share with Y equals the information from the first, plus the _additional_ information from the second given the first.

**Feature selection application:** If X1X\_1X1​ and X2X\_2X2​ are redundant features, I(X2;Y∣X1)≈0I(X\_2; Y \| X\_1) \\approx 0I(X2​;Y∣X1​)≈0. Adding X2X\_2X2​ provides no new information. This is why mRMR (minimum Redundancy Maximum Relevance) uses conditional MI.

**General form:** I(X1,...,Xn;Y)=∑i=1nI(Xi;Y∣X1,...,Xi−1)I(X\_1, ..., X\_n; Y) = \\sum\_{i=1}^{n} I(X\_i; Y \| X\_1, ..., X\_{i-1})I(X1​,...,Xn​;Y)=∑i=1n​I(Xi​;Y∣X1​,...,Xi−1​)

## Connection to KL Divergence

I(X;Y)=DKL(P(X,Y)∣∣P(X)P(Y))I(X; Y) = D\_{KL}(P(X,Y) \|\| P(X)P(Y))I(X;Y)=DKL​(P(X,Y)∣∣P(X)P(Y))

Mutual Information is the KL Divergence from the "independence assumption" to reality.

This perspective shows why MI is always non-negative: [KL Divergence](https://www.tensortonic.com/ml-math/information-theory/kl-divergence) is always non-negative, and it's zero only when the two distributions match (i.e., when X and Y are truly independent).

#### Alternative Views

I(X;Y)=H(X)−H(X∣Y)I(X;Y) = H(X) - H(X\|Y)I(X;Y)=H(X)−H(X∣Y)(Reduction in uncertainty about X given Y)

I(X;Y)=H(Y)−H(Y∣X)I(X;Y) = H(Y) - H(Y\|X)I(X;Y)=H(Y)−H(Y∣X)(Reduction in uncertainty about Y given X)

## Real-World Examples

#### Weather Prediction

I(Temperature; Humidity) is high. Knowing today's temperature tells you a lot about humidity.

But I(Temperature; Tomorrow's Lottery Numbers) = 0. Completely independent!

#### Medical Diagnosis

I(Symptoms; Disease) quantifies how informative symptoms are. High MI means the symptom is a good diagnostic indicator.

Used in medical AI to rank symptom importance.

#### Gene Expression

I(Gene A; Gene B) reveals regulatory relationships. High MI suggests genes are co-regulated or in the same pathway.

Foundation of gene regulatory network inference.

## ML Applications

#### Feature Selection

Have 1000 features? Calculate I(Xi;Ytarget)I(X\_i; Y\_{target})I(Xi​;Ytarget​) for each feature. Pick the top k. Unlike correlation, this catches non-linear predictors.

Used in mRMR (minimum Redundancy Maximum Relevance) algorithm for optimal feature subsets.

#### Clustering Evaluation (NMI)

**Normalized Mutual Information** compares predicted clusters to ground truth labels. NMI = 1 means perfect agreement; NMI = 0 means no better than random.

Standard metric for unsupervised learning benchmarks (scikit-learn's default).

#### Decision Trees (Information Gain)

The splitting criterion for ID3 and C4.5 is **Information Gain**, which is literally mutual information between the feature and the label. Trees maximize I(Feature;Label)I(\\text{Feature}; \\text{Label})I(Feature;Label).

Also used in Random Forests for feature importance ranking.

#### Representation Learning (InfoNCE)

Contrastive learning methods like SimCLR, MoCo, and CLIP maximize a lower bound on MI between different views/augmentations of the same data. High MI = good representations.

Powers modern self-supervised learning (BERT, GPT pre-training conceptually related).

#### Neural Network Compression

Information Bottleneck Theory uses MI to understand deep learning: networks maximize I(Hidden; Label) while minimizing I(Hidden; Input). This explains generalization!

Theoretical framework for understanding why deep networks generalize.

#### Causality Detection

Transfer Entropy (conditional MI) detects causal direction: does X predict future Y better than Y predicts future X? Used in neuroscience, economics, climate science.

Granger causality is a linear approximation of this idea.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept