---
source_url: https://tensortonic.com/ml-math/graph-theory/message-passing
title: Message Passing Neural Networks (MPNN) | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

06/06

Graph Theory

### Contents

IntroductionThe MPNN FrameworkAggregation FunctionsUpdate FunctionsGCN: Graph Convolutional NetworkGraphSAGEGAT: Graph Attention NetworkInteractive: AttentionGIN: Graph Isomorphism NetworkReadout & Graph-Level TasksArchitecture ComparisonInteractive: All Architectures

## Introduction

In the [GNN introduction](https://www.tensortonic.com/ml-math/graph-theory/gnn-intro), we saw that GNNs learn by aggregating information from neighbors. **Message Passing** is the formal framework that unifies virtually all GNN architectures.

The idea is elegant: each node sends "messages" to its neighbors, collects messages from its neighbors, and uses them to update its own representation. Different GNN architectures (GCN, GAT, GraphSAGE, GIN) are just different implementations of this same idea.

### Why It Works

Message passing is a form of _neural network inductive bias_. By forcing nodes to learn from their local neighborhoods, we inject the prior knowledge that "connected things are related." This is similar to how CNNs inject the prior that "nearby pixels are related."

## The MPNN Framework

The Message Passing Neural Network (MPNN) framework, introduced by Gilmer et al. (2017), provides a unified view. One layer of message passing consists of three steps:

#### General Message Passing Layer

#### Step 1: MESSAGE

mv←u=MESSAGE(hu(l),hv(l),euv)m\_{v \\leftarrow u} = \\text{MESSAGE}(h\_u^{(l)}, h\_v^{(l)}, e\_{uv})mv←u​=MESSAGE(hu(l)​,hv(l)​,euv​)

Creates a "message" from neighbor u to target v using their features and edge attributes

#### Step 2: AGGREGATE

mv=AGGREGATE({mv←u:u∈N(v)})m\_v = \\text{AGGREGATE}(\\{m\_{v \\leftarrow u} : u \\in \\mathcal{N}(v)\\})mv​=AGGREGATE({mv←u​:u∈N(v)})

Combines all incoming messages (must be permutation-invariant: sum, mean, max, attention)

#### Step 3: UPDATE

hv(l+1)=UPDATE(hv(l),mv)h\_v^{(l+1)} = \\text{UPDATE}(h\_v^{(l)}, m\_v)hv(l+1)​=UPDATE(hv(l)​,mv​)

Merges aggregated message with node's current features (usually an MLP or GRU)

#### The Unifying Pattern

Every GNN architecture follows this pattern. They differ only in _how_ they implement MESSAGE, AGGREGATE, and UPDATE. This abstraction makes it easy to understand and compare different approaches.

## Aggregation Functions

The aggregation function must be **permutation-invariant**: the result should not depend on the order in which we process neighbors. This is a fundamental requirement for graph neural networks.

#### SUM

mv=∑u∈N(v)mv←um\_v = \\sum\_{u \\in \\mathcal{N}(v)} m\_{v \\leftarrow u}mv​=∑u∈N(v)​mv←u​

Pros:

Preserves neighborhood size information. Captures "how much" signal.

Cons:

Different scales for different degrees. Needs normalization.

Used by: [GIN](https://www.tensortonic.com/ml-math/graph-theory/message-passing#gin), original spectral GNNs

#### MEAN

mv=1∣N(v)∣∑u∈N(v)mv←um\_v = \\frac{1}{\|\\mathcal{N}(v)\|} \\sum\_{u \\in \\mathcal{N}(v)} m\_{v \\leftarrow u}mv​=∣N(v)∣1​∑u∈N(v)​mv←u​

Pros:

Normalizes for degree. Stable across graph sizes.

Cons:

Loses neighborhood size information.

Used by: [GCN](https://www.tensortonic.com/ml-math/graph-theory/message-passing#gcn), [GraphSAGE](https://www.tensortonic.com/ml-math/graph-theory/message-passing#graphsage)-mean

#### MAX

mv=max⁡u∈N(v)mv←um\_v = \\max\_{u \\in \\mathcal{N}(v)} m\_{v \\leftarrow u}mv​=maxu∈N(v)​mv←u​

Pros:

Captures strongest signal. Robust to outliers.

Cons:

Loses information from non-max neighbors.

Used by: GraphSAGE-pool, PointNet

#### ATTENTION (Weighted Sum)

mv=∑u∈N(v)αvu⋅mv←um\_v = \\sum\_{u \\in \\mathcal{N}(v)} \\alpha\_{vu} \\cdot m\_{v \\leftarrow u}mv​=∑u∈N(v)​αvu​⋅mv←u​

Pros:

Learns which neighbors are important. Adaptive weighting.

Cons:

More parameters, slower, can overfit on small graphs.

Used by: [GAT](https://www.tensortonic.com/ml-math/graph-theory/message-passing#gat), Graph Transformers

## Update Functions

The update function combines the aggregated message with the node's own features. The choice of update function affects both expressivity and trainability.

#### Simple: Replace

hv′=σ(W⋅mv)h'\_v = \\sigma(W \\cdot m\_v)hv′​=σ(W⋅mv​)

Just use the message, ignore self. Risk: lose self-information over layers.

#### Concatenate + MLP

hv′=MLP(\[hv∥mv\])h'\_v = \\text{MLP}(\[h\_v \\, \\\| \\, m\_v\])hv′​=MLP(\[hv​∥mv​\])

Concatenate self and message, let MLP learn combination. Most flexible.

#### Skip Connection

hv′=hv+σ(W⋅mv)h'\_v = h\_v + \\sigma(W \\cdot m\_v)hv′​=hv​+σ(W⋅mv​)

Residual connection. Essential for deep GNNs (helps gradient flow).

#### GRU Update

hv′=GRU(hv,mv)h'\_v = \\text{GRU}(h\_v, m\_v)hv′​=GRU(hv​,mv​)

Gated recurrent unit. Used in GGNN for sequential message passing.

#### The Over-Smoothing Problem

Deep GNNs (many layers) suffer from **over-smoothing**: all node representations converge to the same value. Skip connections and careful normalization (like in [BatchNorm](https://www.tensortonic.com/ml-math/optimization/batch-normalization)) help, but this limits GNN depth to typically 2-4 layers.

## GCN: Graph Convolutional Network

GCN (Kipf & Welling, 2017) is the foundational modern GNN. It's derived from [spectral graph theory](https://www.tensortonic.com/ml-math/graph-theory/spectral-graph) but has a simple spatial interpretation:

H(l+1)=σ(D~−1/2A~D~−1/2H(l)W(l))H^{(l+1)} = \\sigma\\left( \\tilde{D}^{-1/2} \\tilde{A} \\tilde{D}^{-1/2} H^{(l)} W^{(l)} \\right)H(l+1)=σ(D~−1/2A~D~−1/2H(l)W(l))

Where Ã = A + I (add self-loops) and D̃ is the degree matrix of Ã.

In message passing terms:

**MESSAGE:** Linear transform of neighbor feature: `m = W · h_u`

**AGGREGATE:** Normalized sum with symmetric weighting: 1du⋅dv\\frac{1}{\\sqrt{d\_u \\cdot d\_v}}du​⋅dv​​1​

**UPDATE:** Include self-loop (via Ã), then apply nonlinearity σ

#### Key Insight: Symmetric Normalization

The 1/du⋅dv1/\\sqrt{d\_u \\cdot d\_v}1/du​⋅dv​​ normalization prevents high-degree nodes from dominating. It's derived from the normalized graph Laplacian and ensures stable learning across graphs with varying degree distributions.

## GraphSAGE

GraphSAGE (Hamilton et al., 2017) introduced two key innovations: **neighborhood sampling** for scalability and **explicit self-loop handling** via concatenation.

hv(l+1)=σ(W⋅CONCAT(hv(l),AGG({hu(l):u∈N(v)})))h\_v^{(l+1)} = \\sigma\\left( W \\cdot \\text{CONCAT}\\left( h\_v^{(l)}, \\text{AGG}(\\{h\_u^{(l)} : u \\in \\mathcal{N}(v)\\}) \\right) \\right)hv(l+1)​=σ(W⋅CONCAT(hv(l)​,AGG({hu(l)​:u∈N(v)})))

#### Neighborhood Sampling

Instead of using all neighbors, sample a fixed number (e.g., 10-25). Makes training O(1) per node rather than O(degree), enabling massive-scale graphs.

#### Inductive Learning

Learns an aggregator function, not node-specific embeddings. Can generalize to completely unseen nodes and graphs at test time.

**Aggregator options:** MEAN (simple average), LSTM (order neighbors randomly for sequence), MAX-POOL (apply MLP element-wise then max).

## GAT: Graph Attention Network

GAT (Veličković et al., 2018) uses [attention mechanisms](https://www.tensortonic.com/ml-math/attention-mechanisms) to learn which neighbors are most important for each node. This is a major departure from fixed aggregation weights.

Attention coefficient:

evu=LeakyReLU(aT\[Whv∥Whu\])e\_{vu} = \\text{LeakyReLU}\\left( \\mathbf{a}^T \[W h\_v \\\| W h\_u\] \\right)evu​=LeakyReLU(aT\[Whv​∥Whu​\])

Softmax normalization:

αvu=exp⁡(evu)∑u′∈N(v)exp⁡(evu′)\\alpha\_{vu} = \\frac{\\exp(e\_{vu})}{\\sum\_{u' \\in \\mathcal{N}(v)} \\exp(e\_{vu'})}αvu​=∑u′∈N(v)​exp(evu′​)exp(evu​)​

Weighted aggregation:

hv(l+1)=σ(∑u∈N(v)αvuWhu)h\_v^{(l+1)} = \\sigma\\left( \\sum\_{u \\in \\mathcal{N}(v)} \\alpha\_{vu} W h\_u \\right)hv(l+1)​=σ(∑u∈N(v)​αvu​Whu​)

#### Multi-Head Attention

Like Transformers, GAT uses K independent attention heads and concatenates (or averages) their outputs. This stabilizes training and captures different "aspects" of neighbor importance. Typically K = 8 for intermediate layers.

## Interactive: Attention Weights

See how attention mechanisms dynamically weight neighbors. Unlike GCN's fixed normalization, GAT learns which connections matter most.

### Attention Weights

GAT learns to weight neighbors based on feature similarity.

Interactive Mode

53%20%26%Targeth\_vN1\[0.9, 0.3\]N2\[0.2, 0.9\]N3\[0.5, 0.5\]

#### Feature Modulation

Target Vector (Query)

Dim 0

Dim 1

Neighbor Vectors (Keys)

N1w = 53.5%

N2w = 20.5%

N3w = 26.0%

Attention Calculation

Score

eij=LeakyReLU(aT\[Whi∥Whj\])e\_{ij} = \\text{LeakyReLU}(\\mathbf{a}^T \[W h\_i \\\| W h\_j\])eij​=LeakyReLU(aT\[Whi​∥Whj​\])

(Simplified here as dot product similarity)

Weight

αij=exp⁡(eij)∑kexp⁡(eik)\\alpha\_{ij} = \\frac{\\exp(e\_{ij})}{\\sum\_k \\exp(e\_{ik})}αij​=∑k​exp(eik​)exp(eij​)​

## GIN: Graph Isomorphism Network

GIN (Xu et al., 2019) asks a fundamental question: what's the _most expressive_ possible GNN? The answer: one that's as powerful as the Weisfeiler-Lehman (WL) graph isomorphism test.

hv(l+1)=MLP((1+ϵ)⋅hv(l)+∑u∈N(v)hu(l))h\_v^{(l+1)} = \\text{MLP}\\left( (1 + \\epsilon) \\cdot h\_v^{(l)} + \\sum\_{u \\in \\mathcal{N}(v)} h\_u^{(l)} \\right)hv(l+1)​=MLP((1+ϵ)⋅hv(l)​+∑u∈N(v)​hu(l)​)

ε is a learnable parameter (or fixed small value like 0).

#### Key Theoretical Insights

- **SUM not MEAN:** Sum preserves multiset cardinality; mean loses it. Critical for distinguishing graphs.
- **MLP not linear:** Needs a universal approximator (MLP) to be injective. Linear transforms can't distinguish all neighborhoods.
- **(1 + ε) term:** Distinguishes self from sum of neighbors. Without it, some non-isomorphic graphs look identical.

## Readout & Graph-Level Tasks

For graph classification or regression, we need a single vector representing the entire graph. This is done via a **READOUT** (or pooling) function that aggregates node embeddings.

hG=READOUT({hv(L):v∈V})h\_G = \\text{READOUT}(\\{h\_v^{(L)} : v \\in V\\})hG​=READOUT({hv(L)​:v∈V})

#### Global Sum/Mean

Simplest approach. Sum (or mean) all final node embeddings. Works surprisingly well.

#### Hierarchical Pooling

Learn to coarsen graph iteratively (DiffPool, MinCutPool). More expressive but complex.

#### Set2Set

LSTM-based attention over all nodes. Order-invariant but sequential processing.

#### Virtual Node

Add a "super node" connected to all others. Its embedding represents the graph.

## Architecture Comparison

| Model | Aggregation | Self-Loop | Expressivity | Best For |
| --- | --- | --- | --- | --- |
| GCN | Normalized sum | In Ã matrix | Low (1-WL) | Semi-supervised node classification |
| GraphSAGE | Mean/Max/LSTM | Concatenate | Medium | Large-scale, inductive learning |
| GAT | Attention (learned) | In attention | Medium | Heterogeneous neighbor importance |
| GIN | Sum + MLP | (1+ε) weighted | High (WL-equivalent) | Graph classification, maximum expressivity |

#### Choosing the Right Architecture

**GCN** for node classification with smooth labels. **GraphSAGE** for massive graphs or inductive settings. **GAT** when neighbor importance varies (e.g., molecular graphs). **GIN** for graph-level tasks requiring maximum expressivity.

## Interactive: All Architectures

Compare all four GNN architectures side-by-side. Select an architecture to see its specific message passing mechanism, aggregation function, and update rule on the same graph.

### GNN Architecture Comparison

Select an architecture to see how it processes graph information. Click nodes to change target.

GCNGraphSAGEGATGINMPNN

GCN Mode

v₀d=2v₁d=3v₂d=4v₃d=2v₄d=2

#### GCN

Fixed spectral normalization prevents explosion

Update Rule

h′=σ(D~−1/2A~D~−1/2HW)h' = \\sigma(\\tilde{D}^{-1/2} \\tilde{A} \\tilde{D}^{-1/2} H W)h′=σ(D~−1/2A~D~−1/2HW)

Message

WhuWh\_uWhu​

Aggregate

Normalized sum

Update

Self-loop+σ\\text{Self-loop} + \\sigmaSelf-loop+σ

| Feature | GCN | SAGE | GAT | GIN | MPNN |
| --- | --- | --- | --- | --- | --- |
| Aggregation | Norm Sum | Mean/Max | Attention | Sum | Any |
| Inductive? | ❌ | ✅ | ✅ | ✅ | ✅ |
| Weights | Fixed | Fixed | Learned | Fixed | Variable |
| Expressivity | Low | Medium | Medium | High | High |

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept