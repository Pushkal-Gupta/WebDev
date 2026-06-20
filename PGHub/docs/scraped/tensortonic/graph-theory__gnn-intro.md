---
source_url: https://tensortonic.com/ml-math/graph-theory/gnn-intro
title: Introduction to Graph Neural Networks (GNNs) | TensorTonic
scraped_at: 2026-06-18
---

[Modules](https://www.tensortonic.com/ml-math)

05/06

Graph Theory

### Contents

IntroductionWhy Do We Need GNNs?What is a GNN?The Core IntuitionNode Features & EmbeddingsAnatomy of One GNN LayerInteractive: Message PassingInteractive: Aggregation FunctionsStacking Layers & Receptive FieldGNN TasksPopular ArchitecturesLimitations

## Introduction

Traditional neural networks assume data comes in a fixed structure: images are grids of pixels, text is a sequence of tokens, audio is a 1D waveform. But much of the world's data is relational entities connected by relationships that form complex networks.

Social networks, molecules, transportation systems, knowledge graphs, protein interactions, citation networks: none of these fit neatly into grids or sequences. They are **graphs**: nodes connected by edges, with no fixed ordering or regular structure.

**Graph Neural Networks (GNNs)** are a family of neural network architectures designed specifically for graph-structured data. They learn to transform and propagate information across the graph while respecting its topology.

## Why Do We Need GNNs?

Could you just flatten a graph into a feature vector and use a standard MLP? Technically yes, but you would lose critical information:

#### Problems with Flattening

- Graphs have variable sizes, no fixed input dimension
- Node ordering is arbitrary, same graph, infinite permutations
- Adjacency matrix is O(n²) and mostly zeros
- Loses local structure information

#### What GNNs Provide

- Handle arbitrary graph sizes
- Permutation invariant/equivariant
- Scale with edges, not nodes²
- Exploit local neighborhood structure

### Real-World Applications

#### Drug Discovery

Molecules as graphs. Predict toxicity, binding affinity, solubility from molecular structure.

#### Social Networks

Friend recommendations, bot detection, influence prediction, community detection.

#### Recommendation

User-item bipartite graphs. Pinterest, Uber Eats, Twitter all use GNNs.

#### Traffic & Navigation

Road networks as graphs. Google Maps uses GNNs for ETA prediction.

## What is a GNN?

A GNN is a neural network that takes a graph as input and produces transformed representations. The key constraint: the network must respect the graph structure.

#### GNN Input

- **Node features X ∈ ℝⁿˣᵈ:** Each of the n nodes has a d-dimensional feature vector (e.g., atom type, user profile)
- **Adjacency A ∈ {0,1}ⁿˣⁿ:** Which nodes are connected (or weighted/directed versions)
- **Edge features (optional):** Features on edges (e.g., bond type, relationship type)

#### GNN Output

- **Node embeddings H ∈ ℝⁿˣᵈ':** Updated representations for each node
- **Graph embedding (optional):** Single vector representing the entire graph (via pooling)
- **Edge predictions (optional):** Scores for edges (link prediction)

## The Core Intuition

The fundamental idea behind GNNs is beautifully simple: **nodes should learn from their neighbors**.

**The Neighbor Principle:** In a social network, you are similar to your friends. In a molecule, an atom's properties depend on what it's bonded to. In a citation network, a paper's topic relates to what it cites. GNNs operationalize this by aggregating information from neighbors.

Think of it as a "rumor spreading" process:

1. Each node starts with its own features (what it "knows")
2. Nodes share information with their neighbors
3. Each node combines what it hears with what it already knows
4. Repeat this process multiple times
5. After k rounds, each node knows about its k-hop neighborhood

#### Message Passing Paradigm

This is the **message passing** framework, the foundation of virtually all modern GNN architectures. We'll explore it interactively below.

## Node Features & Embeddings

The input to a GNN is a feature matrix X where each row is a node's initial representation. Where do these features come from?

#### Natural Features

**Molecules:** Atom type (one-hot), charge, hybridization

**Social:** User profile, activity metrics, text embeddings

**Citations:** Paper abstract embeddings, year, venue

#### Structural Features

When no natural features exist, use graph structure: degree, centrality, clustering coefficient, or even random features that get learned.

#### Positional Encodings

Inspired by Transformers: encode each node's "position" in the graph using Laplacian eigenvectors or random walk probabilities.

## Anatomy of One GNN Layer

A single GNN layer transforms node features by incorporating neighbor information. The general form:

hv(l+1)=UPDATE(hv(l),AGGREGATE({hu(l):u∈N(v)}))h\_v^{(l+1)} = \\text{UPDATE}\\left( h\_v^{(l)}, \\text{AGGREGATE}\\left( \\{ h\_u^{(l)} : u \\in \\mathcal{N}(v) \\} \\right) \\right)hv(l+1)​=UPDATE(hv(l)​,AGGREGATE({hu(l)​:u∈N(v)}))

AGGREGATE

Combine neighbor features (sum, mean, max, attention)

UPDATE

Merge with node's own features (usually MLP)

𝒩(v)

Set of neighbors of node v

Different GNN architectures differ in how they implement AGGREGATE and UPDATE. But they all follow this pattern.

#### Example: Simple Mean Aggregation

hv(l+1)=σ(W⋅1∣N(v)∣∑u∈N(v)hu(l))h\_v^{(l+1)} = \\sigma\\left( W \\cdot \\frac{1}{\|\\mathcal{N}(v)\|} \\sum\_{u \\in \\mathcal{N}(v)} h\_u^{(l)} \\right)hv(l+1)​=σ(W⋅∣N(v)∣1​∑u∈N(v)​hu(l)​)

Average neighbor features, apply learned weight matrix W, pass through nonlinearity σ.

## Interactive: Message Passing

Watch how node embeddings evolve as information propagates through the graph via message passing. Each layer allows information to spread one hop further.

Layer 0Ready

1.00.20.80.00.5

### GNN Message Passing

Information aggregates from neighbors to update node embeddings.

Update Rule (GCN-style)

hv(k)=σ(W⋅MEAN{hu(k−1)})h\_v^{(k)} = \\sigma \\left( W \\cdot \\text{MEAN} \\{ h\_u^{(k-1)} \\} \\right)hv(k)​=σ(W⋅MEAN{hu(k−1)​})

Node Embeddings

0

1.0

1

0.2

2

0.8

3

0.0

4

0.5

Propagate MessagesReset Layer

## Interactive: Aggregation Functions

Different aggregation functions have different properties. Try each one to see how they combine neighbor information.

### Aggregation Function

Select an operator to combine neighbor signals.

meansummax

0.8N00.3N10.6N20.9N30.65Target Node

Operation

mean

Averages neighbor features. Normalizes by degree.

hv=0.8+0.3+0.6+0.94=0.65h\_v = \\frac{0.8 + 0.3 + 0.6 + 0.9}{4} = \\mathbf{0.65}hv​=40.8+0.3+0.6+0.9​=0.65

Yellow nodes are neighbors

Central node aggregates them

## Stacking Layers & Receptive Field

One GNN layer lets each node "see" its immediate neighbors. Stack multiple layers, and information propagates further:

1 Layer

1-hop neighbors

2 Layers

2-hop neighbors

K Layers

K-hop neighbors

#### The Over-Smoothing Problem

With too many layers, all node representations converge to the same value. Information gets "smoothed out" across the entire graph. Most GNNs use 2-4 layers. This is an active research area.

## GNN Tasks

#### Node Classification

Predict a label for each node. Example: Classify users as bot/human, predict paper topic.

Output: h\_v → softmax → class

#### Link Prediction

Predict whether an edge should exist. Example: Friend recommendations, knowledge graph completion.

Output: score(h\_u, h\_v) → sigmoid → probability

#### Graph Classification

Predict a label for the entire graph. Example: Molecule toxicity, protein function.

Output: READOUT(H) → MLP → class

#### Graph Generation

Generate new graphs with desired properties. Example: Drug design, circuit design.

Output: Autoregressive or one-shot generation

## Popular Architectures

A brief overview of the main GNN families. Each makes different choices about how to aggregate neighbor information:

| Architecture | Key Idea | Aggregation |
| --- | --- | --- |
| [GCN](https://arxiv.org/abs/1609.02907) | Spectral convolution approximation | Normalized sum |
| [GraphSAGE](https://arxiv.org/abs/1706.02216) | Sample neighbors, inductive | Mean/LSTM/Pool |
| [GAT](https://arxiv.org/abs/1710.10903) | Attention over neighbors | Weighted sum (learned) |
| [GIN](https://arxiv.org/abs/1810.00826) | Maximally expressive (WL test) | Sum + MLP |
| [MPNN](https://arxiv.org/abs/1704.01212) | General message passing framework | Configurable |

## Limitations

#### Over-Smoothing

Deep GNNs (many layers) make all node representations similar. Hard to capture long-range dependencies.

#### Limited Expressivity

Standard GNNs cannot distinguish certain graph structures (limited by Weisfeiler-Lehman test). Cannot count triangles, detect cycles of length > 6.

#### Scalability

Full-batch training requires entire graph in memory. Mini-batching is tricky due to neighbor explosion.

#### Heterogeneous Graphs

Graphs with multiple node/edge types need special architectures (Relational GCN, HAN).

We use cookies to understand how you use TensorTonic and to improve the product. [Learn more](https://www.tensortonic.com/terms)

RejectAccept