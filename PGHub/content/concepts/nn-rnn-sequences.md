---
slug: nn-rnn-sequences
module: neural-networks
title: Recurrent Networks
subtitle: A network with a memory — one hidden state carried across time steps, unrolled into a chain, and the vanishing-gradient wall that limits it.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 15
prereqs: [nn-backpropagation, nn-activations]
relatedProblems: []
references:
  - title: "Andrej Karpathy — The Unreasonable Effectiveness of Recurrent Neural Networks"
    url: "https://karpathy.github.io/2015/05/21/rnn-effectiveness/"
    type: article
  - title: "Christopher Olah — Understanding LSTM Networks"
    url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/"
    type: article
  - title: "Andrej Karpathy — Let's build GPT: from scratch (sequence modeling)"
    url: "https://www.youtube.com/watch?v=kCc8FmEb1nY"
    type: video
status: published
---

## intro
A feedforward network sees one fixed-size input and produces one output; it has no notion of "before" or "after." But language, audio, sensor streams, and stock prices are *sequences* — the meaning of an element depends on what came before it. A recurrent neural network (RNN) handles this by carrying a **hidden state**: a vector of memory that is updated at every time step from the previous state and the current input, then passed forward to the next step. The same small set of weights is applied at every step, so the network is really one cell used over and over along the sequence. Conceptually you "unroll" the loop into a chain as long as the input, run backprop through that chain, and learn weights that decide what to remember and what to forget. RNNs were the dominant tool for sequence modeling for years, and although transformers have largely replaced them, the ideas — recurrence, unrolling, and the vanishing-gradient problem they exposed — are foundational.

## whyItMatters
RNNs were the first architecture to make neural sequence modeling practical, powering early machine translation, speech recognition, handwriting generation, and text generation. They introduced the single most important idea in the field: **parameter sharing across positions**, the same insight that convolutions apply across space. That sharing is what lets a network of fixed size process inputs of arbitrary length and generalize a learned pattern to any position in the sequence. RNNs also taught the field its hardest lesson about depth: gradients propagated through many time steps shrink or explode exponentially, so a vanilla RNN cannot learn dependencies more than a handful of steps apart. The gated variants (LSTM, GRU) were invented specifically to fix this, and understanding *why* they were needed — the repeated multiplication by the same recurrent weight and activation derivative — is the clearest possible motivation for gating, residual connections, and ultimately the attention mechanism that replaced recurrence entirely. Even today, the unrolling-and-backprop-through-time picture is how every sequence model is trained.

## intuition
Imagine reading a sentence one word at a time while keeping a running mental summary of everything so far. That summary is the **hidden state** \(h\). When the next word \(x_t\) arrives, you update the summary: the new state \(h_t\) is a function of the old summary \(h_{t-1}\) and the new word \(x_t\). Crucially you use the *same updating habit* at every word — the same weights — because the rule for "fold a new word into my understanding" should not depend on whether you are on word 3 or word 30. That is the recurrence \(h_t = f(h_{t-1}, x_t)\), and it is the entire RNN.

To train it, you **unroll** the loop. Lay the sequence out flat: the cell at step 1 feeds the cell at step 2, which feeds step 3, and so on, like copying one layer many times into a deep feedforward network where every copy shares the same weights. Now ordinary backpropagation applies — it just has to flow backward through every time step, which is why it is called **backpropagation through time** (BPTT). The gradient for the shared weights is the sum of the contributions from every step where they were used.

The trouble lives in that backward flow. To get the gradient of an early input on a late output, the chain rule multiplies one factor per intervening step — and each factor includes the recurrent weight matrix and the activation's derivative. Multiply a number smaller than 1 by itself fifty times and it vanishes to nearly zero; multiply a number larger than 1 by itself fifty times and it explodes. So a vanilla RNN's gradient to a word fifty steps back is either negligible (it cannot learn the long-range dependency) or enormous (training destabilizes). This is the **vanishing/exploding gradient problem**, and it is not a bug in the code — it is intrinsic to repeatedly multiplying by the same quantity. Exploding gradients are patched cheaply by **clipping** the gradient norm. Vanishing gradients are the deeper problem, and the fix is **gating**: LSTM and GRU cells add a nearly-additive "cell state" highway with learned gates that decide what to keep, so information and gradient can flow many steps with multiplication by something close to 1 instead of decaying away. That additive memory path is the same trick residual connections use in deep feedforward nets, and the limitation it only partially solves is exactly what attention was designed to sidestep.

## visualization
```
Unrolled across time (same weights W, U, b reused at every step):

   x1        x2        x3        x4
    |         |         |         |
    v         v         v         v
  [cell] -> [cell] -> [cell] -> [cell] -> ...   h flows left to right
    |  h1     |  h2     |  h3     |  h4
    v         v         v         v
   y1        y2        y3        y4

  recurrence:  h_t = tanh(W*h_{t-1} + U*x_t + b)
               y_t = V*h_t

  backprop-through-time flows RIGHT to LEFT; the gradient to h1 from y4 is
  multiplied by (W * tanh') once per step  ->  shrinks or blows up over distance.

  gated cell (LSTM) adds a near-additive highway:  c_t = f_t * c_{t-1} + i_t * g_t
  so memory (and gradient) can pass many steps without decaying.
```

## bruteForce
The pre-RNN approach to sequences was a **fixed context window**: concatenate the last \(k\) inputs into one big vector and feed that to an ordinary feedforward network (an n-gram-style model). This is simple and trains with plain backprop — no recurrence, no BPTT — and it works when the relevant context is short and of known length. But it has two crippling limits. First, the window is fixed: anything older than \(k\) steps is invisible, so it structurally cannot capture a dependency longer than the window, no matter how much data you give it. Second, it has no parameter sharing across positions — a pattern learned at position 2 is not automatically recognized at position 7, so the model must relearn the same feature at every offset, wasting capacity and data. Widening the window helps a little but explodes the parameter count and still has a hard horizon. The recurrent solution removes both limits at once: one shared cell processes a sequence of *any* length, and the hidden state is an unbounded-in-principle summary of all prior inputs rather than a literal copy of the last few.

## optimal
A **recurrent cell** maintains a hidden state \(h_t\) and updates it at each step from the previous state and the current input, applying the *same* parameters at every step:
\[
h_t = \tanh\!\big(W\,h_{t-1} + U\,x_t + b\big),\qquad
y_t = V\,h_t .
\]
Here \(W\) is the recurrent weight (state-to-state), \(U\) is the input weight, \(V\) is the output weight, and \(b\) is the bias — all shared across time. Training is **backpropagation through time**: unroll the recurrence to the sequence length, run a normal backward pass, and accumulate the gradient for each shared parameter over all the steps it was used in. For long sequences this is done in chunks (truncated BPTT) to bound memory. The vanilla cell above suffers vanishing/exploding gradients because the backward pass multiplies by \(W\) and \(\tanh'\) once per step. The production fix is a **gated cell**. The LSTM adds a separate cell state \(c_t\) updated almost additively through learned gates:
\[
c_t = f_t \odot c_{t-1} + i_t \odot g_t,\qquad
h_t = o_t \odot \tanh(c_t),
\]
where the forget gate \(f_t\), input gate \(i_t\), and output gate \(o_t\) are each a sigmoid of \([h_{t-1}, x_t]\), and \(g_t=\tanh(\cdot)\) is the candidate update. Because \(c_t\) is mostly a gated sum rather than a repeated matrix multiply, gradients can travel many steps without vanishing — the gates *learn* to keep relevant memory and drop the rest. The GRU is a lighter two-gate variant with similar behavior. Pair any of these with **gradient clipping** (rescale the gradient when its norm exceeds a threshold) to tame the exploding side. This gated-recurrence recipe was the state of the art for sequence modeling before attention.

```python
import numpy as np

# Vanilla RNN forward pass over a sequence; shared weights W, U, V, b reused each step.
def rnn_forward(xs, h0, W, U, V, b):
    h = h0
    ys, hs = [], []
    for x in xs:                          # one step per time index
        h = np.tanh(W @ h + U @ x + b)    # h_t = tanh(W h_{t-1} + U x_t + b)
        y = V @ h                         # y_t = V h_t
        hs.append(h); ys.append(y)
    return ys, hs

rng = np.random.default_rng(0)
H, D, O, T = 4, 3, 2, 6                    # hidden, input, output dims; T time steps
W = rng.normal(0, 0.3, (H, H)); U = rng.normal(0, 0.3, (H, D))
V = rng.normal(0, 0.3, (O, H)); b = np.zeros(H); h0 = np.zeros(H)
xs = [rng.normal(0, 1, D) for _ in range(T)]
ys, hs = rnn_forward(xs, h0, W, U, V, b)
print(len(ys), "outputs, final hidden:", np.round(hs[-1], 3))
```

## complexity
time: O(T · H · (H + D)) for one forward pass over a sequence of length T with hidden size H and input size D — the dominant cost is the H×H recurrent matrix multiply repeated T times. Backpropagation through time is the same order. Because each step depends on the previous one, the recurrence is inherently sequential and cannot be parallelized across the time axis.
space: O(T · H) to cache the hidden state at every step for BPTT, plus O(H² + H·D + O·H) for the parameters. Truncated BPTT caps the T factor at the truncation length to bound memory.
notes: The sequential dependency is the practical ceiling — unlike convolutions or attention, an RNN cannot use the time dimension's parallelism, which is a major reason transformers (fully parallel over positions) displaced RNNs for large-scale training.

## pitfalls
- Treating exploding and vanishing gradients as the same problem. They have different fixes: exploding gradients are cured cheaply by gradient-norm clipping, while vanishing gradients require gating (LSTM/GRU) or architecture changes. The fix: clip to handle explosions, switch to a gated cell to handle vanishing — clipping alone will not recover long-range learning.
- Expecting a vanilla RNN to learn long-range dependencies. The repeated multiplication by \(W\) and \(\tanh'\) makes gradients to inputs many steps back negligible, so the model silently ignores distant context. The fix: use LSTM/GRU for anything beyond a handful of steps, and consider attention for truly long range.
- Forgetting that the weights are shared across time. The gradient for \(W\), \(U\), \(V\), \(b\) is the *sum* over every step they were applied at; computing it for only the last step (or averaging instead of summing) gives a wrong update. The fix: accumulate gradient contributions across all unrolled steps.
- Not resetting or carrying the hidden state correctly across batches. Carrying state from an unrelated previous sequence leaks information; zeroing it when you meant to continue a long sequence loses context. The fix: reset \(h_0\) at true sequence boundaries and only carry state for stateful/truncated-BPTT setups deliberately.
- Untruncated BPTT on very long sequences. Backpropagating through thousands of steps blows up memory and runtime and worsens the gradient pathologies. The fix: use truncated BPTT with a fixed window so the unrolled graph stays bounded.

## interviewTips
- Write the recurrence \(h_t = \tanh(W h_{t-1} + U x_t + b)\) and stress the single most important property: the *same* weights are reused at every step (parameter sharing), which is what lets one fixed-size network handle arbitrary-length input.
- Explain the vanishing-gradient problem mechanically: BPTT multiplies by the recurrent weight and the activation derivative once per step, so the gradient over k steps scales like that factor to the k-th power — exponential decay or growth. Then motivate gating as the additive-highway fix.
- Distinguish the two fixes clearly: gradient clipping for exploding gradients (a magnitude problem) versus LSTM/GRU gating for vanishing gradients (an information-flow problem), and note that the sequential dependency is why transformers, parallel over positions, eventually replaced RNNs.

## keyTakeaways
- An RNN carries a hidden state updated at each step by the same shared weights — \(h_t = f(h_{t-1}, x_t)\) — so one fixed-size cell processes sequences of any length, the key being parameter sharing across positions.
- Training unrolls the recurrence and runs backpropagation through time; gradients are summed over every step the shared weights were used in.
- Backprop through many steps multiplies by the recurrent weight and activation derivative repeatedly, causing gradients to vanish or explode — clip for explosions, and use gated cells (LSTM/GRU) whose near-additive cell-state highway lets memory and gradient survive long distances.

## code.python
```python
import numpy as np

# Character-style RNN forward + a single BPTT step illustrating shared-weight gradients.
def step(h_prev, x, W, U, b):
    return np.tanh(W @ h_prev + U @ x + b)   # one recurrence step

def unroll_and_grad(xs, W, U, V, b, h0):
    hs = [h0]; ys = []
    for x in xs:                              # forward: cache every hidden state
        hs.append(step(hs[-1], x, W, U, b))
        ys.append(V @ hs[-1])
    # backward (BPTT) with a toy upstream gradient of 1 on each output
    dW = np.zeros_like(W); dh_next = np.zeros_like(h0)
    for t in reversed(range(len(xs))):
        dh = V.T @ np.ones_like(ys[t]) + dh_next
        dz = dh * (1 - hs[t + 1] ** 2)        # tanh' = 1 - tanh^2
        dW += np.outer(dz, hs[t])             # accumulate over ALL steps (shared W)
        dh_next = W.T @ dz
    return ys, dW

rng = np.random.default_rng(1)
H, D, O, T = 3, 2, 2, 5
W = rng.normal(0, 0.3, (H, H)); U = rng.normal(0, 0.3, (H, D))
V = rng.normal(0, 0.3, (O, H)); b = np.zeros(H); h0 = np.zeros(H)
xs = [rng.normal(0, 1, D) for _ in range(T)]
ys, dW = unroll_and_grad(xs, W, U, V, b, h0)
print("dW (summed over", T, "steps):\n", np.round(dW, 4))
```

## code.javascript
```javascript
// Vanilla RNN forward pass; shared weights W (HxH), U (HxD), V (OxH), b reused each step.
const tanh = z => Math.tanh(z);
const matVec = (M, v) => M.map(row => row.reduce((s, m, j) => s + m * v[j], 0));
const addV = (a, b) => a.map((x, i) => x + b[i]);

function rnnForward(xs, h0, W, U, V, b) {
  let h = h0.slice();
  const ys = [], hs = [];
  for (const x of xs) {
    const z = addV(addV(matVec(W, h), matVec(U, x)), b);
    h = z.map(tanh);                        // h_t = tanh(W h_{t-1} + U x_t + b)
    hs.push(h.slice());
    ys.push(matVec(V, h));                  // y_t = V h_t
  }
  return { ys, hs };
}

const W = [[0.2, -0.1, 0.0], [0.1, 0.3, -0.2], [-0.1, 0.0, 0.25]];
const U = [[0.4, -0.2], [0.1, 0.3], [-0.3, 0.2]];
const V = [[0.5, -0.4, 0.1], [0.2, 0.1, -0.3]];
const b = [0, 0, 0], h0 = [0, 0, 0];
const xs = [[1, 0], [0, 1], [1, 1], [0.5, -0.5]];
const { ys, hs } = rnnForward(xs, h0, W, U, V, b);
console.log(ys.length, "outputs, final hidden:", hs[hs.length - 1].map(v => v.toFixed(3)));
```

## code.java
```java
public class RnnForward {
    static double[] matVec(double[][] M, double[] v) {
        double[] out = new double[M.length];
        for (int i = 0; i < M.length; i++)
            for (int j = 0; j < v.length; j++) out[i] += M[i][j] * v[j];
        return out;
    }

    public static void main(String[] args) {
        double[][] W = {{0.2, -0.1, 0.0}, {0.1, 0.3, -0.2}, {-0.1, 0.0, 0.25}};
        double[][] U = {{0.4, -0.2}, {0.1, 0.3}, {-0.3, 0.2}};
        double[][] V = {{0.5, -0.4, 0.1}, {0.2, 0.1, -0.3}};
        double[] b = {0, 0, 0};
        double[][] xs = {{1, 0}, {0, 1}, {1, 1}, {0.5, -0.5}};

        double[] h = {0, 0, 0};
        for (double[] x : xs) {
            double[] z = matVec(W, h), ux = matVec(U, x);
            for (int i = 0; i < h.length; i++) h[i] = Math.tanh(z[i] + ux[i] + b[i]);
            double[] y = matVec(V, h);                 // output at this step
            System.out.printf("y=[%.3f, %.3f]%n", y[0], y[1]);
        }
        System.out.printf("final hidden=[%.3f, %.3f, %.3f]%n", h[0], h[1], h[2]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
using std::vector;

vector<double> matVec(const vector<vector<double>>& M, const vector<double>& v) {
    vector<double> out(M.size(), 0.0);
    for (size_t i = 0; i < M.size(); i++)
        for (size_t j = 0; j < v.size(); j++) out[i] += M[i][j] * v[j];
    return out;
}

int main() {
    vector<vector<double>> W = {{0.2, -0.1, 0.0}, {0.1, 0.3, -0.2}, {-0.1, 0.0, 0.25}};
    vector<vector<double>> U = {{0.4, -0.2}, {0.1, 0.3}, {-0.3, 0.2}};
    vector<vector<double>> V = {{0.5, -0.4, 0.1}, {0.2, 0.1, -0.3}};
    vector<double> b = {0, 0, 0}, h = {0, 0, 0};
    vector<vector<double>> xs = {{1, 0}, {0, 1}, {1, 1}, {0.5, -0.5}};

    for (auto& x : xs) {
        auto z = matVec(W, h); auto ux = matVec(U, x);
        for (size_t i = 0; i < h.size(); i++) h[i] = std::tanh(z[i] + ux[i] + b[i]);
        auto y = matVec(V, h);                          // output at this step
        std::printf("y=[%.3f, %.3f]\n", y[0], y[1]);
    }
    std::printf("final hidden=[%.3f, %.3f, %.3f]\n", h[0], h[1], h[2]);
    return 0;
}
```
