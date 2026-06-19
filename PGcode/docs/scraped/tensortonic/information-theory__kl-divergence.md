---
source_url: https://tensortonic.com/ml-math/information-theory/kl-divergence
title: KL Divergence: Measuring Distribution Difference | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

03/07

Information Theory

### Contents

IntroductionIntuition: Extra BitsThe FormulaInteractive: KL Between GaussiansAsymmetry: Not a DistanceForward vs Reverse KLInteractive: Forward vs ReverseRelation to EntropyInteractive: Entropy RelationshipKey PropertiesML Applications

## Introduction

In geometry, we measure distance between points with Euclidean distance. But how do we measure the "distance" between two probability distributions?

For example, how different is a Gaussian N(0,1)N(0, 1)N(0,1) from N(2,2)N(2, 2)N(2,2)? Or the word distribution in Shakespeare versus a Reddit thread?

**KL Divergence** (Kullback-Leibler Divergence, also called Relative Entropy) quantifies this difference. It measures how much information is lost when we approximate one distribution with another.

#### Not a True Metric

While KL Divergence is often called a "distance," it doesn't satisfy all the properties of a mathematical distance metric (it's asymmetric and doesn't obey the triangle inequality). Think of it as a directed measure of divergence.

## Intuition: Extra Bits

Imagine you're designing a compression code for English text. Optimal codes assign short representations to frequent letters ('e', 't') and long ones to rare letters ('z', 'q').

- **P (True Distribution):** The actual frequency of letters in English.
- **Q (Model/Approximation):** Your guess at the frequency (maybe based on French).

If you build your code based on Q but data comes from P, your code will be inefficient. You'll use long codes for letters that are actually common.

#### KL Divergence = Extra Bits

DKL(P∣∣Q)D\_{KL}(P \|\| Q)DKL​(P∣∣Q) measures the **extra bits** you need to transmit because you used the wrong distribution Q instead of the true P. It quantifies the cost of your approximation.

## The Formula

For discrete probability distributions P and Q:

DKL(P∣∣Q)=∑xP(x)log⁡(P(x)Q(x))D\_{KL}(P \|\| Q) = \\sum\_{x} P(x) \\log \\left( \\frac{P(x)}{Q(x)} \\right)DKL​(P∣∣Q)=∑x​P(x)log(Q(x)P(x)​)

=∑xP(x)\[log⁡P(x)−log⁡Q(x)\]= \\sum\_{x} P(x) \[\\log P(x) - \\log Q(x)\]=∑x​P(x)\[logP(x)−logQ(x)\]

#### Critical Warning

If P(x)>0P(x) > 0P(x)>0 but Q(x)=0Q(x) = 0Q(x)=0, KL divergence goes to **infinity**. The model Q thinks an event is impossible when it actually occurs. This is a fatal modeling error called "zero-avoiding" behavior.

#### For Continuous Distributions

DKL(P∣∣Q)=∫P(x)log⁡(P(x)Q(x))dxD\_{KL}(P \|\| Q) = \\int P(x) \\log \\left( \\frac{P(x)}{Q(x)} \\right) dxDKL​(P∣∣Q)=∫P(x)log(Q(x)P(x)​)dx

For Gaussians, there's a closed-form solution, making KL Divergence computationally efficient.

## Interactive: KL Between Gaussians

Explore how KL divergence changes as you move the model distribution Q away from the true distribution P.

### KL Divergence

Distance between q(z\|x) and prior N(0,1)

μ (mean shift)0.0

log σ² (variance)0.0 (σ = 1.00)

p(z) = N(0,1)q(z\|x)z

KL = 0.000

✓ Close to prior

KL = -½ × (1 + log σ² - μ² - σ²) = -½ × (1 + 0.0 \- 0.00 \- 1.00)

## Asymmetry: Not a True Distance

In geometry, distance is symmetric: Distance(A to B) = Distance(B to A). **KL Divergence is NOT symmetric.**

DKL(P∣∣Q)≠DKL(Q∣∣P)D\_{KL}(P \|\| Q) \\neq D\_{KL}(Q \|\| P)DKL​(P∣∣Q)=DKL​(Q∣∣P)

This asymmetry is not a bug. It reflects a real difference: "How much does Q fail to capture P?" is a different question from "How much does P fail to capture Q?"

#### Worked Example

Let P=\[0.5,0.5\]P = \[0.5, 0.5\]P=\[0.5,0.5\] (fair coin) and Q=\[0.9,0.1\]Q = \[0.9, 0.1\]Q=\[0.9,0.1\] (biased coin).

**Forward KL:** DKL(P∣∣Q)D\_{KL}(P \|\| Q)DKL​(P∣∣Q)

=0.5⋅ln⁡(0.50.9)+0.5⋅ln⁡(0.50.1)= 0.5 \\cdot \\ln\\left(\\frac{0.5}{0.9}\\right) + 0.5 \\cdot \\ln\\left(\\frac{0.5}{0.1}\\right)=0.5⋅ln(0.90.5​)+0.5⋅ln(0.10.5​)

=0.5⋅(−0.588)+0.5⋅(1.609)= 0.5 \\cdot (-0.588) + 0.5 \\cdot (1.609)=0.5⋅(−0.588)+0.5⋅(1.609)

=0.511 nats= 0.511 \\text{ nats}=0.511 nats

**Reverse KL:** DKL(Q∣∣P)D\_{KL}(Q \|\| P)DKL​(Q∣∣P)

=0.9⋅ln⁡(0.90.5)+0.1⋅ln⁡(0.10.5)= 0.9 \\cdot \\ln\\left(\\frac{0.9}{0.5}\\right) + 0.1 \\cdot \\ln\\left(\\frac{0.1}{0.5}\\right)=0.9⋅ln(0.50.9​)+0.1⋅ln(0.50.1​)

=0.9⋅(0.588)+0.1⋅(−1.609)= 0.9 \\cdot (0.588) + 0.1 \\cdot (-1.609)=0.9⋅(0.588)+0.1⋅(−1.609)

=0.368 nats= 0.368 \\text{ nats}=0.368 nats

0.511≠0.3680.511 \\neq 0.3680.511=0.368 \- The direction matters!

#### What are "nats"?

**Nats** (natural units) measure information using ln⁡\\lnln (natural log, base eee). **Bits** use log⁡2\\log\_2log2​. To convert: 1 nat=1ln⁡(2)≈1.44 bits1 \\text{ nat} = \\frac{1}{\\ln(2)} \\approx 1.44 \\text{ bits}1 nat=ln(2)1​≈1.44 bits. Deep learning frameworks typically use nats because ln⁡\\lnln has simpler derivatives.

## Forward vs Reverse KL

The choice between DKL(P∣∣Q)D\_{KL}(P \|\| Q)DKL​(P∣∣Q) (Forward) and DKL(Q∣∣P)D\_{KL}(Q \|\| P)DKL​(Q∣∣P) (Reverse) has major implications for how your model behaves.

#### Forward KL: DKL(P \|\| Q)

**Mean-Seeking / Moment-Matching**

Q must cover all the mass of P. If P is multimodal, Q will spread out to cover all modes, potentially with density in between.

Used in: VAEs, Maximum Likelihood, Expectation Maximization

#### Reverse KL: DKL(Q \|\| P)

**Mode-Seeking / Zero-Avoiding**

Q avoids placing mass where P is zero. If P is multimodal, Q will collapse to cover only ONE mode, ignoring the rest.

Used in: Variational Inference, Some GANs, Policy Gradients

#### Multimodal Example

If P has two peaks (bimodal), Forward KL makes Q spread across both peaks (blurry, inclusive). Reverse KL makes Q collapse to just one peak (sharp but missing mass).

## Interactive: Forward vs Reverse

See how the direction of KL Divergence dramatically changes model behavior for multimodal distributions.

### Forward vs Reverse KL

Two ways to fit a distribution

Mean-Seeking

Forward KLReverse KL

#### Zero-Avoiding (Mass Covering)

Forward KL penalizes Q if P(x) > 0 but Q(x) ≈ 0. To avoid infinite penalty, Q stretches to cover ALL of P's support, often becoming blurry.

DKL(P∣∣Q)=Ex∼P\[log⁡P(x)Q(x)\]D\_{KL}(P \|\| Q) = \\mathbb{E}\_{x \\sim P} \[\\log \\frac{P(x)}{Q(x)}\]DKL​(P∣∣Q)=Ex∼P​\[logQ(x)P(x)​\]

Typical Use Cases

Variational Autoencoders (VAEs)

Maximum Likelihood Estimation

P (True)Q (Model)

P is complex (bimodal). Q is simple (unimodal).

## Relation to Entropy

KL Divergence connects beautifully to [Entropy](https://www.tensortonic.com/ml-math/information-theory/shannon-entropy) and [Cross-Entropy](https://www.tensortonic.com/ml-math/information-theory/cross-entropy):

DKL(P∣∣Q)=H(P,Q)−H(P)D\_{KL}(P \|\| Q) = H(P, Q) - H(P)DKL​(P∣∣Q)=H(P,Q)−H(P)

KL Divergence = Cross-Entropy - Entropy

Since H(P) is constant for fixed data, **minimizing Cross-Entropy is equivalent to minimizing KL Divergence**. This is why Cross-Entropy loss makes models learn to match the data distribution.

#### Why This Connection Matters

In classification, we don't actually need to compute H(P) because it's constant. We just minimize H(P,Q), which implicitly minimizes the divergence between our model and the true distribution!

## Interactive: Entropy Relationship

Explore the decomposition: Cross-Entropy = Entropy + KL Divergence.

### The Information Theory Identity

Visualizing H(P,Q)=H(P)+DKL(P∣∣Q)H(P, Q) = H(P) + D\_{KL}(P \|\| Q)H(P,Q)=H(P)+DKL​(P∣∣Q)

True Distribution P0.70 / 0.30

Model Distribution Q0.50 / 0.50

**Key Insight:** Since H(P) is fixed by the data, minimizing Cross-Entropy is mathematically identical to minimizing KL Divergence.

This is why training a neural net with Cross-Entropy loss makes it learn the true distribution!

Total Cost (Bits)1.00

Cross-Entropy H(P,Q)

=

Min Cost0.88

Entropy H(P)

+

Inefficiency0.12

KL Divergence

Wasted Bits: 0.12

The model is inefficient. Cross-Entropy is higher than the theoretical minimum (Entropy).

## Key Properties of KL Divergence

#### 1\. Non-Negativity (Gibbs' Inequality)

DKL(P∣∣Q)≥0D\_{KL}(P \|\| Q) \\geq 0DKL​(P∣∣Q)≥0

KL Divergence is always non-negative, and equals zero **if and only if** P=QP = QP=Q everywhere.

**Why?** From Jensen's Inequality:

−DKL(P∣∣Q)=∑xP(x)ln⁡(Q(x)P(x))-D\_{KL}(P \|\| Q) = \\sum\_x P(x) \\ln\\left(\\frac{Q(x)}{P(x)}\\right)−DKL​(P∣∣Q)=∑x​P(x)ln(P(x)Q(x)​)

≤ln⁡(∑xP(x)⋅Q(x)P(x))=ln⁡(1)=0\\leq \\ln\\left(\\sum\_x P(x) \\cdot \\frac{Q(x)}{P(x)}\\right) = \\ln(1) = 0≤ln(∑x​P(x)⋅P(x)Q(x)​)=ln(1)=0

Since −DKL≤0-D\_{KL} \\leq 0−DKL​≤0, we have DKL≥0D\_{KL} \\geq 0DKL​≥0.

**ML implication:** You can never have "negative divergence." If your loss is negative, there's a bug in your code.

#### 2\. Asymmetry (Not a Metric)

DKL(P∣∣Q)≠DKL(Q∣∣P)D\_{KL}(P \|\| Q) \\neq D\_{KL}(Q \|\| P)DKL​(P∣∣Q)=DKL​(Q∣∣P)

Unlike Euclidean distance, KL Divergence is **not symmetric**. The "distance" from P to Q differs from Q to P.

Forward KL

DKL(P∣∣Q)D\_{KL}(P \|\| Q)DKL​(P∣∣Q)

"How well does Q explain P?"

Reverse KL

DKL(Q∣∣P)D\_{KL}(Q \|\| P)DKL​(Q∣∣P)

"How well does P explain Q?"

**Why it fails as a metric:** A true metric requires symmetry (d(a,b)=d(b,a)d(a,b) = d(b,a)d(a,b)=d(b,a)) and triangle inequality. KL satisfies neither.

#### 3\. Convexity

DKL(P∣∣Q)D\_{KL}(P \|\| Q)DKL​(P∣∣Q) is **convex** in the pair (P,Q)(P, Q)(P,Q). For any λ∈\[0,1\]\\lambda \\in \[0, 1\]λ∈\[0,1\]:

DKL(λP1+(1−λ)P2∣∣λQ1+(1−λ)Q2)≤λDKL(P1∣∣Q1)+(1−λ)DKL(P2∣∣Q2)D\_{KL}(\\lambda P\_1 + (1-\\lambda)P\_2 \\,\|\|\\, \\lambda Q\_1 + (1-\\lambda)Q\_2) \\leq \\lambda D\_{KL}(P\_1 \|\| Q\_1) + (1-\\lambda) D\_{KL}(P\_2 \|\| Q\_2)DKL​(λP1​+(1−λ)P2​∣∣λQ1​+(1−λ)Q2​)≤λDKL​(P1​∣∣Q1​)+(1−λ)DKL​(P2​∣∣Q2​)

Mixing distributions reduces or maintains the divergence. This property ensures:

- Gradient descent converges to global minimum (for fixed P)
- No local minima traps in variational inference
- Optimization is computationally tractable

#### 4\. Additive for Independent Variables

If XXX and YYY are **independent** under both P and Q:

DKL(PXY∣∣QXY)=DKL(PX∣∣QX)+DKL(PY∣∣QY)D\_{KL}(P\_{XY} \|\| Q\_{XY}) = D\_{KL}(P\_X \|\| Q\_X) + D\_{KL}(P\_Y \|\| Q\_Y)DKL​(PXY​∣∣QXY​)=DKL​(PX​∣∣QX​)+DKL​(PY​∣∣QY​)

**Derivation:**

DKL(PXY∣∣QXY)=∑x,yP(x,y)ln⁡P(x,y)Q(x,y)D\_{KL}(P\_{XY} \|\| Q\_{XY}) = \\sum\_{x,y} P(x,y) \\ln\\frac{P(x,y)}{Q(x,y)}DKL​(PXY​∣∣QXY​)=∑x,y​P(x,y)lnQ(x,y)P(x,y)​

Since independent: P(x,y)=P(x)P(y)P(x,y) = P(x)P(y)P(x,y)=P(x)P(y) and Q(x,y)=Q(x)Q(y)Q(x,y) = Q(x)Q(y)Q(x,y)=Q(x)Q(y)

=∑x,yP(x)P(y)ln⁡P(x)P(y)Q(x)Q(y)= \\sum\_{x,y} P(x)P(y) \\ln\\frac{P(x)P(y)}{Q(x)Q(y)}=∑x,y​P(x)P(y)lnQ(x)Q(y)P(x)P(y)​

=∑x,yP(x)P(y)\[ln⁡P(x)Q(x)+ln⁡P(y)Q(y)\]= \\sum\_{x,y} P(x)P(y) \\left\[\\ln\\frac{P(x)}{Q(x)} + \\ln\\frac{P(y)}{Q(y)}\\right\]=∑x,y​P(x)P(y)\[lnQ(x)P(x)​+lnQ(y)P(y)​\]

=DKL(PX∣∣QX)+DKL(PY∣∣QY)= D\_{KL}(P\_X \|\| Q\_X) + D\_{KL}(P\_Y \|\| Q\_Y)=DKL​(PX​∣∣QX​)+DKL​(PY​∣∣QY​)

**ML implication:** For high-dimensional data with independent features, you can compute KL divergence feature-by-feature and sum them up.

#### 5\. Invariance Under Reparameterization

For any invertible transformation y=f(x)y = f(x)y=f(x):

DKL(PX∣∣QX)=DKL(PY∣∣QY)D\_{KL}(P\_X \|\| Q\_X) = D\_{KL}(P\_Y \|\| Q\_Y)DKL​(PX​∣∣QX​)=DKL​(PY​∣∣QY​)

KL Divergence only depends on the probability values, not how the space is parameterized. Scaling, rotating, or nonlinearly transforming your features does not change the divergence.

## ML Applications

#### Variational Autoencoders (VAEs)

The VAE loss has two parts: Reconstruction Loss + **KL Divergence**. The KL term forces the learned latent distribution q(z\|x) to be close to a standard Normal prior N(0, I).

L=−Eq\[log⁡p(x∣z)\]+DKL(q(z∣x)∣∣p(z))\\mathcal{L} = -E\_q\[\\log p(x\|z)\] + D\_{KL}(q(z\|x) \|\| p(z))L=−Eq​\[logp(x∣z)\]+DKL​(q(z∣x)∣∣p(z))

This regularization ensures smooth, interpretable latent spaces for generation.

#### t-SNE Visualization

t-SNE minimizes the KL Divergence between the distribution of pairwise distances in high-dimensional space and low-dimensional space. This preserves local structure while reducing dimensions.

Critical for visualizing embeddings, gene expression data, and neural network activations.

#### Knowledge Distillation

Training a small "student" model to mimic a large "teacher" model. The loss is the KL Divergence between the teacher's softmax outputs (with temperature) and the student's outputs.

Used to compress BERT → DistilBERT, reducing size by 40% with 97% performance.

#### Reinforcement Learning (TRPO/PPO)

Trust Region Policy Optimization constrains policy updates so the new policy doesn't diverge too much from the old policy, measured by KL Divergence. PPO uses a clipped surrogate objective.

Powers OpenAI's robotic control, Dota 2 agents, and ChatGPT's RLHF training.

#### Generative Adversarial Networks (GANs)

Some GAN formulations (f-GAN) use KL or reverse KL divergence. The choice affects whether the generator covers all modes (forward KL) or focuses on high-quality single modes (reverse KL).

Explains mode collapse: reverse KL encourages sharp, single-mode outputs.

#### Bayesian Model Selection

KL Divergence measures how well an approximate posterior matches the true posterior in variational Bayes. Also used in Akaike Information Criterion (AIC) for model comparison.

Theoretical foundation for choosing between competing statistical models.

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept