---
slug: nn-attention-transformers
module: neural-networks
title: Attention and Transformers
subtitle: Let every token look directly at every other token and decide what to read — the mechanism that replaced recurrence and powers every large language model.
difficulty: Advanced
position: 6
estimatedReadMinutes: 15
prereqs: [nn-backpropagation]
relatedProblems: []
references:
  - title: "Jay Alammar — The Illustrated Transformer"
    url: "https://jalammar.github.io/illustrated-transformer/"
    type: article
  - title: "Vaswani et al. — Attention Is All You Need (original paper)"
    url: "https://arxiv.org/abs/1706.03762"
    type: paper
  - title: "Distill — Attention and Augmented Recurrent Neural Networks"
    url: "https://distill.pub/2016/augmented-rnns/"
    type: article
status: published
---

## intro
To understand a sentence, the meaning of each word depends on the others: in "the animal didn't cross the street because *it* was too tired," *it* refers to the animal, not the street — and resolving that requires looking across the whole sentence. Recurrent networks tried to carry this context in a single hidden state passed word by word, but information from far back fades, and the strictly sequential processing forbids parallelism. **Attention** discards both limitations. It lets every position look directly at every other position in one step, compute a relevance score for each, and pull in a weighted blend of their information. The **transformer** is an architecture built almost entirely from this one mechanism — no recurrence, no convolution — and it is the foundation of modern language models, machine translation, and increasingly vision and audio.

## whyItMatters
The transformer is the most important neural architecture of the past decade. Every large language model — GPT, Claude, Gemini, Llama — is a transformer; so are the systems behind modern translation, code completion, protein-structure prediction (AlphaFold), and a growing share of state-of-the-art vision and speech models. Two properties explain the dominance. First, **parallelism**: because attention processes all positions simultaneously rather than stepping through a sequence, transformers exploit modern GPU hardware fully, making it feasible to train on internet-scale data. Second, **direct long-range dependencies**: any token can attend to any other in a single layer, so the path length between distant tokens is constant rather than growing with distance as in an RNN, which is why transformers capture long-range structure that recurrent models lose. These same properties drove the **scaling laws** that turned more data and compute into reliably better models — the engine of the current AI wave. Understanding query/key/value attention is now table stakes for anyone working in machine learning.

## intuition
The core operation is **self-attention**, and the cleanest way to think about it is as a soft, differentiable lookup — a dictionary where instead of matching one key exactly you match all keys partially and blend the results. Each token produces three vectors by multiplying its embedding by three learned matrices: a **query** (what am I looking for?), a **key** (what do I offer?), and a **value** (what will I actually contribute if attended to?).

To compute the new representation of a token, take its query and compare it against every token's key with a dot product. A large dot product means "this key is relevant to my query," a small one means "ignore." These scores are scaled and passed through a **softmax**, turning them into attention weights that are positive and sum to one — a distribution over which tokens to read from. The token's output is then the weighted sum of all the **value** vectors, weighted by those attention scores. So a token literally builds its new meaning by reading a custom-mixed blend of every other token's value, with the mix decided by query–key relevance. For *it* in our example, the query of *it* matches the key of *animal* strongly, so *it* pulls in mostly the animal's value and resolves its reference.

Two refinements matter. The dot products are divided by \(\sqrt{d_k}\) (the **scaled** in scaled dot-product attention) because for large key dimension the raw dot products grow large, pushing softmax into saturated regions where gradients vanish — the scaling keeps them well-conditioned. And attention runs in parallel across **multiple heads**: several independent query/key/value projections, each free to attend to a different kind of relationship (one head tracks syntax, another coreference, another position), whose outputs are concatenated. Because attention itself is permutation-blind — it has no idea which token came first — transformers add **positional encodings** to the embeddings so order is recoverable. A full transformer block then wraps multi-head attention and a position-wise feed-forward network, each with a residual connection and layer normalization. Stack these blocks and you get the depth that makes the architecture so capable.

## visualization
```
self-attention for ONE query token (vertical flow, top to bottom):

        token embeddings  (the, animal, ..., it, ..., tired)
                |
                v   multiply by learned W_Q, W_K, W_V
        +-------+-------+-------+
        |       |       |
      Query    Keys   Values         (one Q per token; K, V for ALL tokens)
        |       |
        v       v
        scores = Q . K^T           the -> 0.02   animal -> 0.71
        |                          street -> 0.05  was -> 0.04  ...
        v   divide by sqrt(d_k), then softmax  ->  weights sum to 1
        |
        v   weighted sum of Values  (weight each token's V by its score, add up)
        |
        v
    new representation of the query token  ("it" now carries the animal's meaning)
```

## bruteForce
Before attention, the standard tool for sequences was the **recurrent neural network** (and its gated variants, LSTM and GRU). An RNN reads tokens one at a time, folding each into a fixed-size hidden state that is meant to summarize everything seen so far. This is the "brute-force" baseline against which attention is the optimization. Two problems doom it for long sequences. First, the bottleneck: cramming an entire history into one fixed vector loses detail, and through backpropagation-through-time the gradient signal for distant tokens vanishes or explodes — long-range dependencies decay even with gating. Second, the sequentiality: step \(t\) cannot be computed until step \(t-1\) finishes, so training cannot parallelize across the sequence length, capping throughput on parallel hardware. Encoder-decoder RNNs with a single context vector made translation of long sentences notably worse as length grew — which is precisely the failure that motivated bolting attention onto RNNs first, and then, once attention proved sufficient on its own, dropping the recurrence entirely.

## optimal
**Scaled dot-product attention** is the optimal core. Pack the queries, keys, and values into matrices \(Q, K, V\) (one row per token) and compute all outputs at once:
\[
\text{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
\]
\(QK^\top\) is the matrix of all pairwise query–key dot products; dividing by \(\sqrt{d_k}\) keeps the logits well-scaled; the row-wise softmax turns each query's scores into a probability distribution; multiplying by \(V\) returns the weighted blend of values. **Multi-head attention** runs \(h\) such operations on learned projections and concatenates:
\[
\text{MultiHead}(Q,K,V)=\big[\text{head}_1;\dots;\text{head}_h\big]W^O,\quad \text{head}_i=\text{Attention}(QW_i^Q,KW_i^K,VW_i^V).
\]
A **transformer block** is then: \(x \to x + \text{MultiHead}(\text{LayerNorm}(x))\) followed by \(x \to x + \text{FFN}(\text{LayerNorm}(x))\), where the feed-forward network is two linear layers with a nonlinearity applied identically at each position, and the residual connections plus layer norm keep gradients flowing through depth. **Positional encodings** (sinusoidal or learned) are added to embeddings so order is recoverable, and decoders use a **causal mask** (set future-position logits to \(-\infty\) before softmax) so a token attends only to earlier tokens. The whole stack is differentiable end to end and trains by backpropagation. Its cost is the trade-off: attention is \(O(n^2)\) in sequence length \(n\) because every token attends to every token — the price of unrestricted, parallelizable, long-range context, and the motivation for the many efficient-attention variants.

```python
import numpy as np

def softmax(x, axis=-1):
    e = np.exp(x - x.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V):
    """Scaled dot-product attention. Q,K,V: (n_tokens, d). Returns (n_tokens, d)."""
    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)        # all pairwise query-key dot products
    weights = softmax(scores, axis=-1)     # each row: a distribution over tokens
    return weights @ V, weights            # weighted blend of value vectors

rng = np.random.default_rng(0)
Q = rng.standard_normal((3, 4)); K = rng.standard_normal((3, 4)); V = rng.standard_normal((3, 4))
out, w = attention(Q, K, V)
print(np.round(w, 3))     # attention weights: each row sums to 1
```

## complexity
time: O(n²·d) for self-attention over n tokens of dimension d — the QKᵀ score matrix and the weighted value sum each touch every token pair. The feed-forward sublayer is O(n·d²).
space: O(n²) to hold the attention-score / weight matrix per head (the memory bottleneck for long sequences), plus O(n·d) for activations and O(d²) per projection matrix.
notes: The quadratic-in-length cost is the price of all-pairs attention and the target of efficient variants (sparse, linear, FlashAttention). Unlike an RNN's O(n) sequential steps, attention parallelizes fully across positions — slower asymptotically in n but far faster in wall-clock on parallel hardware.

## pitfalls
- Forgetting the \(\sqrt{d_k}\) scaling. Without it, dot products grow with dimension, softmax saturates, and gradients vanish — training stalls. The fix: always divide logits by \(\sqrt{d_k}\) before softmax.
- Omitting positional information. Self-attention is permutation-invariant; without positional encodings the model cannot tell "dog bites man" from "man bites dog." The fix: add sinusoidal or learned positional encodings to the input embeddings.
- Missing or wrong causal masking in a decoder. If future positions are not masked to \(-\infty\) before softmax, the model attends to tokens it should not see, leaking the answer during training and breaking autoregressive generation. The fix: apply an upper-triangular mask of \(-\infty\) to the scores.
- Assuming attention is free. The \(O(n^2)\) cost in sequence length makes long contexts expensive in time and (especially) memory; naively scaling context length blows up the score matrix. The fix: use efficient-attention variants or memory-aware kernels (FlashAttention) for long sequences.
- Treating the value and key as the same thing. Keys decide *how much* to attend; values decide *what is read*. Tying or confusing them removes the model's ability to separate relevance from content. The fix: keep distinct learned \(W^K\) and \(W^V\) projections.

## interviewTips
- Write the scaled dot-product attention formula and explain each piece in plain language: query–key dot products are relevance scores, softmax makes them a distribution, the value-weighted sum is the output, and \(\sqrt{d_k}\) prevents softmax saturation.
- Articulate *why* transformers replaced RNNs with two concrete reasons — full parallelism across positions and constant-path-length long-range dependencies — and connect these to the scaling laws that made large models possible.
- Be ready to discuss multi-head attention (different heads learn different relations), positional encodings (attention is order-blind without them), causal masking for decoders, and the \(O(n^2)\) cost that motivates efficient-attention research.

## keyTakeaways
- Self-attention lets every token compute relevance scores (query · key) against all tokens, softmax them into weights, and output a weighted blend of value vectors — a soft, differentiable, parallelizable lookup over the whole sequence.
- The transformer is built from multi-head scaled dot-product attention plus position-wise feed-forward layers, with residual connections, layer norm, and positional encodings; it replaced recurrence because it parallelizes fully and gives constant-path-length access to distant tokens.
- The \(\sqrt{d_k}\) scaling prevents softmax saturation, decoders need causal masking, order requires positional encodings, and the all-pairs design costs \(O(n^2)\) in sequence length — the trade-off behind efficient-attention research.

## code.python
```python
import numpy as np

def softmax(x, axis=-1):
    e = np.exp(x - x.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, mask=None):
    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, scores, -1e9)   # causal / padding mask
    weights = softmax(scores, axis=-1)
    return weights @ V, weights

rng = np.random.default_rng(0)
Q = rng.standard_normal((3, 4)); K = rng.standard_normal((3, 4)); V = rng.standard_normal((3, 4))
out, w = attention(Q, K, V)
print(np.round(w, 3))            # each row sums to 1
print(np.round(w.sum(axis=1)))   # [1. 1. 1.]
```

## code.javascript
```javascript
function softmaxRow(row) {
  const m = Math.max(...row);
  const e = row.map(v => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / s);
}

// Scaled dot-product attention. Q,K,V are arrays of token vectors.
function attention(Q, K, V) {
  const dk = K[0].length;
  const dot = (a, b) => a.reduce((s, ai, i) => s + ai * b[i], 0);
  const weights = Q.map(q => softmaxRow(K.map(k => dot(q, k) / Math.sqrt(dk))));
  const out = weights.map(w =>
    V[0].map((_, d) => w.reduce((s, wi, t) => s + wi * V[t][d], 0)));
  return { out, weights };
}

const Q = [[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]];
const K = [[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]];
const V = [[10, 0], [0, 10], [5, 5]];
const { weights } = attention(Q, K, V);
console.log(weights.map(r => r.map(v => v.toFixed(3))));  // rows sum to 1
```

## code.java
```java
import java.util.Arrays;

public class Attention {
    static double[] softmax(double[] row) {
        double m = Arrays.stream(row).max().orElse(0), s = 0;
        double[] e = new double[row.length];
        for (int i = 0; i < row.length; i++) { e[i] = Math.exp(row[i] - m); s += e[i]; }
        for (int i = 0; i < row.length; i++) e[i] /= s;
        return e;
    }
    static double dot(double[] a, double[] b) {
        double s = 0; for (int i = 0; i < a.length; i++) s += a[i] * b[i]; return s;
    }

    public static void main(String[] args) {
        double[][] Q = {{1,0,1,0},{0,1,0,1},{1,1,0,0}};
        double[][] K = Q;
        double dk = K[0].length;
        for (double[] q : Q) {
            double[] scores = new double[K.length];
            for (int t = 0; t < K.length; t++) scores[t] = dot(q, K[t]) / Math.sqrt(dk);
            double[] w = softmax(scores);
            System.out.println(Arrays.toString(
                Arrays.stream(w).mapToObj(v -> String.format("%.3f", v)).toArray()));
        }
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
using std::vector;

vector<double> softmax(const vector<double>& row) {
    double m = row[0]; for (double v : row) m = std::max(m, v);
    vector<double> e(row.size()); double s = 0;
    for (size_t i = 0; i < row.size(); i++) { e[i] = std::exp(row[i] - m); s += e[i]; }
    for (double& v : e) v /= s;
    return e;
}
double dot(const vector<double>& a, const vector<double>& b) {
    double s = 0; for (size_t i = 0; i < a.size(); i++) s += a[i] * b[i]; return s;
}

int main() {
    vector<vector<double>> Q = {{1,0,1,0},{0,1,0,1},{1,1,0,0}}, K = Q;
    double dk = K[0].size();
    for (auto& q : Q) {
        vector<double> scores(K.size());
        for (size_t t = 0; t < K.size(); t++) scores[t] = dot(q, K[t]) / std::sqrt(dk);
        auto w = softmax(scores);
        for (double v : w) std::printf("%.3f ", v);
        std::printf("\n");
    }
    return 0;
}
```
