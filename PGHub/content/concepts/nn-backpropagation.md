---
slug: nn-backpropagation
module: neural-networks
title: Backpropagation
subtitle: The chain rule run backward — how a network apportions blame for its error to every single weight in one sweep.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [nn-gradient-descent]
relatedProblems: []
references:
  - title: "3Blue1Brown — Backpropagation, intuitively (Ch. 3)"
    url: "https://www.youtube.com/watch?v=Ilg3gGewQ5U"
    type: video
  - title: "3Blue1Brown — Backpropagation calculus (Ch. 4)"
    url: "https://www.youtube.com/watch?v=tIeHLnjs5U8"
    type: video
  - title: "Andrej Karpathy — The spelled-out intro to backpropagation (micrograd)"
    url: "https://www.youtube.com/watch?v=VMj-3S1tku0"
    type: video
status: published
---

## intro
A neural network with millions of weights makes a prediction, compares it to the truth, and gets a single number back — the loss. To learn, it must change every one of those millions of weights in the direction that reduces the loss, which means it needs the gradient: the partial derivative of the loss with respect to each weight. Computing those derivatives one at a time would be hopeless. Backpropagation is the algorithm that computes all of them at once, in a single backward sweep through the network, by reusing intermediate results. It is nothing more than the chain rule of calculus applied with ruthless bookkeeping — but that bookkeeping is what makes training deep networks possible at all.

## whyItMatters
Every deep-learning system you have heard of — image classifiers, language models, recommendation engines, AlphaGo — is trained by backpropagation. It is the workhorse beneath the entire field. Before it was popularized in 1986, training networks with more than one layer was an open problem; afterward, depth became a tunable knob. The reason it matters so much is efficiency: backprop computes the gradient of a scalar loss with respect to *all* parameters in time proportional to the cost of a single forward pass, regardless of how many parameters there are. Naively perturbing each weight to estimate its derivative (finite differences) would cost one forward pass per weight — billions of passes for a modern model. Understanding backprop also demystifies the failure modes of deep learning: vanishing and exploding gradients, why certain activations train better, why residual connections help, and why gradient checking catches bugs. Reverse-mode automatic differentiation — the generalization of backprop — is what frameworks like PyTorch and JAX implement under the hood.

## intuition
Think of the network as a long chain of simple operations, each taking an input and producing an output, ending in a single loss \(L\). The forward pass runs left to right, computing and **caching** every intermediate value. Backprop runs right to left, computing for each value how much the final loss would change if that value were nudged — its gradient.

The engine is the **chain rule**. If \(L\) depends on \(z\), and \(z\) depends on \(w\), then \(\frac{\partial L}{\partial w}=\frac{\partial L}{\partial z}\cdot\frac{\partial z}{\partial w}\). The first factor is "how sensitive is the loss to \(z\)" — a quantity we already computed downstream. The second is "how sensitive is \(z\) to \(w\)" — a purely local derivative of one operation. So every node only needs to know the gradient arriving from its output side and its own local derivative; it multiplies them and passes the result back to its inputs.

Concretely, for a single neuron computing \(z=wx+b\) then \(a=\sigma(z)\): the loss sends back \(\frac{\partial L}{\partial a}\). The neuron multiplies by \(\sigma'(z)\) to get \(\frac{\partial L}{\partial z}=\frac{\partial L}{\partial a}\,\sigma'(z)\). Then the weight's gradient is \(\frac{\partial L}{\partial w}=\frac{\partial L}{\partial z}\cdot x\) (because \(\partial z/\partial w=x\)), the bias's gradient is \(\frac{\partial L}{\partial b}=\frac{\partial L}{\partial z}\cdot 1\), and the gradient passed to the input is \(\frac{\partial L}{\partial x}=\frac{\partial L}{\partial z}\cdot w\).

The deep insight is **reuse**. The quantity \(\delta=\frac{\partial L}{\partial z}\) for each neuron — call it the neuron's "error signal" — gets computed once, then feeds both that neuron's weight gradients *and* the error signals of the layer feeding into it. So the error flows backward layer by layer, each layer's \(\delta\) built from the next layer's \(\delta\) times the weights times the local activation derivative. That is why the cost is one backward pass, not one pass per weight: every shared subexpression is computed exactly once and reused everywhere it appears. When a weight gets a large gradient, the network is saying "this connection carried a lot of blame for the error" — and gradient descent then nudges it to reduce that blame.

## visualization
```
forward  (cache every value)              backward  (multiply local deriv by upstream grad)

  x ---[*w1]---> z1 ---[sig]---> a1          dL/dx <--[*w1]-- dz1 <--[*sig']-- da1
                                  |                                              ^
                                  +---[*w2]---> z2 ---[sig]---> a2 == y_hat       |
                                                                |                 |
                                                              loss L              |
                                                                                  |
  grads:   dL/dw2 = a1 * dz2          dz2 = da2 * sig'(z2)        da2 = (y_hat - y)
           dL/dw1 =  x * dz1          dz1 = (w2 * dz2) * sig'(z1)

  the "error signal" dz_k is computed once per neuron, then reused
  for BOTH its weight gradient AND the error signal of the layer below.
```

## bruteForce
The naive way to get every gradient is **numerical differentiation**: perturb one weight by a tiny \(\epsilon\), run a full forward pass, see how the loss changed, and divide — \(\frac{\partial L}{\partial w}\approx\frac{L(w+\epsilon)-L(w-\epsilon)}{2\epsilon}\). Repeat for every weight. This is conceptually trivial and needs no calculus, but it costs *two forward passes per parameter*: for a model with a million weights that is two million forward passes per training step, which is utterly impractical. It is also numerically delicate — too large an \(\epsilon\) gives a poor approximation, too small invites floating-point cancellation. Its one genuine use is **gradient checking**: run numerical differentiation on a handful of weights and compare against backprop's analytic gradient to catch implementation bugs. If the two disagree by more than about \(10^{-7}\) relative error, your backward pass has a bug. So finite differences is the trusted-but-slow oracle you validate the fast algorithm against, not the algorithm you ship.

## optimal
**Backpropagation** computes all gradients in a single backward sweep using cached forward values. Formally, for a feedforward net with layers \(\ell=1\dots L\), pre-activations \(z^\ell=W^\ell a^{\ell-1}+b^\ell\), and activations \(a^\ell=\sigma(z^\ell)\), define the error signal \(\delta^\ell=\frac{\partial L}{\partial z^\ell}\). The four backprop equations are:
\[
\delta^L=\nabla_a L \odot \sigma'(z^L),\qquad
\delta^\ell=\big((W^{\ell+1})^\top\delta^{\ell+1}\big)\odot \sigma'(z^\ell),
\]
\[
\frac{\partial L}{\partial W^\ell}=\delta^\ell (a^{\ell-1})^\top,\qquad
\frac{\partial L}{\partial b^\ell}=\delta^\ell.
\]
Read top-left to bottom-right: start the error at the output from the loss derivative, propagate it backward through the transposed weight matrices and local activation derivatives, then read off each layer's weight and bias gradients as outer products with the cached activations. The \(\odot\) is elementwise (Hadamard) multiplication. This is **reverse-mode automatic differentiation** specialized to a layered graph: each operation contributes a local Jacobian, and we left-multiply by the accumulated upstream gradient. Because the loss is scalar, reverse mode is optimal — one backward pass yields the full gradient. The forward pass must cache activations so the backward pass can use them; this memory cost (activations for every layer) is backprop's main resource trade-off, addressed in practice by gradient checkpointing.

```python
import numpy as np

def sigmoid(z): return 1 / (1 + np.exp(-z))
def sigmoid_prime(z): s = sigmoid(z); return s * (1 - s)

# Tiny 2-layer net: 2 inputs -> 2 hidden -> 1 output, MSE loss.
def backprop(x, y, W1, b1, W2, b2):
    z1 = W1 @ x + b1;  a1 = sigmoid(z1)        # forward, cache z's and a's
    z2 = W2 @ a1 + b2; a2 = sigmoid(z2)
    d2 = (a2 - y) * sigmoid_prime(z2)          # output error signal
    d1 = (W2.T @ d2) * sigmoid_prime(z1)       # backprop the error
    return {'W2': np.outer(d2, a1), 'b2': d2,  # grads as outer products
            'W1': np.outer(d1, x),  'b1': d1}

x = np.array([0.5, -0.2]); y = np.array([1.0])
W1 = np.array([[0.1, 0.4], [-0.3, 0.2]]); b1 = np.array([0.0, 0.1])
W2 = np.array([[0.7, -0.5]]);             b2 = np.array([0.2])
g = backprop(x, y, W1, b1, W2, b2)
print(np.round(g['W1'], 4))   # gradient of every first-layer weight, one sweep
```

## complexity
time: O(W) per training example, where W is the number of weights — the backward pass costs the same order as one forward pass, independent of how many parameters exist. For a batch of B examples it is O(B·W).
space: O(A) to cache activations across all layers for one example (A = total activations), plus O(W) for the gradients. Activation memory is the dominant cost for deep nets and is what gradient checkpointing trades compute against.
notes: This is what makes deep learning tractable. Finite differences would cost O(W) forward passes — O(W²) total — versus backprop's single O(W) backward pass. Reverse-mode autodiff generalizes this to arbitrary computation graphs.

## pitfalls
- Forgetting to cache forward values. The backward pass needs every pre-activation \(z^\ell\) and activation \(a^{\ell-1}\); recomputing them or, worse, using stale values from a different example silently corrupts every gradient. The fix: store activations during the forward pass and consume them in reverse order.
- Vanishing and exploding gradients. Because \(\delta^\ell\) multiplies by \(\sigma'(z)\) and a weight matrix at every layer, gradients shrink toward zero (saturating sigmoids, \(\sigma'\le 0.25\)) or blow up (large weights) across depth. The fix: ReLU-family activations, careful initialization (He/Xavier), normalization layers, and residual connections.
- Transpose and shape errors. The backward pass uses \((W^{\ell+1})^\top\) and outer products \(\delta(a)^\top\); getting a transpose wrong produces gradients of the right shape but wrong values, which trains slowly or diverges. The fix: gradient-check against finite differences on a small example.
- Mixing up \(\frac{\partial L}{\partial z}\) and \(\frac{\partial L}{\partial a}\). The activation derivative \(\sigma'(z)\) sits between them; applying it twice, or to the wrong quantity, is a classic bug. The fix: name the error signal \(\delta=\partial L/\partial z\) explicitly and track when \(\sigma'\) is applied.
- Not zeroing gradients between batches. In frameworks that accumulate gradients (PyTorch), forgetting `optimizer.zero_grad()` sums this batch's gradient onto the last one, giving a wrong update. The fix: reset gradients to zero before each backward pass.

## interviewTips
- Derive the four backprop equations from the chain rule live, defining \(\delta^\ell=\partial L/\partial z^\ell\) first — interviewers want to see you build the error-signal recursion, not recite it. Emphasize that \(\delta\) is computed once per neuron and reused.
- Explain *why* backprop is O(one forward pass) and not O(weights × forward passes): reverse-mode autodiff reuses every shared subexpression. Contrast with finite differences to make the efficiency concrete.
- Mention gradient checking as the way to validate a hand-written backward pass, and connect vanishing gradients to the \(\sigma'(z)\) factor multiplying through every layer — it shows you understand both the algorithm and its failure modes.

## keyTakeaways
- Backpropagation is the chain rule applied backward through a cached computation graph: each node multiplies the gradient arriving from its output by its own local derivative and passes the result to its inputs.
- The error signal \(\delta^\ell=\partial L/\partial z^\ell\) is computed once per neuron and reused for both that layer's weight gradients (outer product with cached activations) and the previous layer's error signal — this reuse is why the full gradient costs a single backward pass.
- It is reverse-mode automatic differentiation specialized to layered nets, optimal for a scalar loss; its main cost is caching activations, and its main failure mode is gradients vanishing or exploding through the per-layer \(\sigma'\) factor.

## code.python
```python
import numpy as np

def sigmoid(z): return 1 / (1 + np.exp(-z))
def dsigmoid(z): s = sigmoid(z); return s * (1 - s)

def forward_backward(x, y, W1, b1, W2, b2):
    z1 = W1 @ x + b1; a1 = sigmoid(z1)
    z2 = W2 @ a1 + b2; a2 = sigmoid(z2)
    loss = 0.5 * float(np.sum((a2 - y) ** 2))
    d2 = (a2 - y) * dsigmoid(z2)
    d1 = (W2.T @ d2) * dsigmoid(z1)
    grads = {'W1': np.outer(d1, x), 'b1': d1,
             'W2': np.outer(d2, a1), 'b2': d2}
    return loss, grads

x = np.array([0.5, -0.2]); y = np.array([1.0])
W1 = np.array([[0.1, 0.4], [-0.3, 0.2]]); b1 = np.array([0.0, 0.1])
W2 = np.array([[0.7, -0.5]]);             b2 = np.array([0.2])
loss, g = forward_backward(x, y, W1, b1, W2, b2)
print(round(loss, 5))             # scalar loss
print(np.round(g['W2'], 4))       # output-layer weight gradients
```

## code.javascript
```javascript
const sig = z => 1 / (1 + Math.exp(-z));
const dsig = z => { const s = sig(z); return s * (1 - s); };

// Tiny net: 2 inputs -> 2 hidden -> 1 output, MSE loss.
function forwardBackward(x, y, W1, b1, W2, b2) {
  const z1 = W1.map((row, i) => row[0] * x[0] + row[1] * x[1] + b1[i]);
  const a1 = z1.map(sig);
  const z2 = W2[0][0] * a1[0] + W2[0][1] * a1[1] + b2;
  const a2 = sig(z2);
  const loss = 0.5 * (a2 - y) ** 2;
  const d2 = (a2 - y) * dsig(z2);                       // output error signal
  const d1 = [W2[0][0] * d2 * dsig(z1[0]),              // backprop the error
              W2[0][1] * d2 * dsig(z1[1])];
  return {
    loss,
    gW2: [[d2 * a1[0], d2 * a1[1]]], gb2: d2,
    gW1: [[d1[0] * x[0], d1[0] * x[1]], [d1[1] * x[0], d1[1] * x[1]]], gb1: d1,
  };
}

const out = forwardBackward([0.5, -0.2], 1.0,
  [[0.1, 0.4], [-0.3, 0.2]], [0.0, 0.1], [[0.7, -0.5]], 0.2);
console.log(out.loss.toFixed(5));
console.log(out.gW2.map(r => r.map(v => v.toFixed(4))));
```

## code.java
```java
public class Backprop {
    static double sig(double z) { return 1.0 / (1.0 + Math.exp(-z)); }
    static double dsig(double z) { double s = sig(z); return s * (1 - s); }

    public static void main(String[] args) {
        double[] x = {0.5, -0.2}; double y = 1.0;
        double[][] W1 = {{0.1, 0.4}, {-0.3, 0.2}}; double[] b1 = {0.0, 0.1};
        double[] W2 = {0.7, -0.5}; double b2 = 0.2;

        double[] z1 = new double[2], a1 = new double[2];
        for (int i = 0; i < 2; i++) {
            z1[i] = W1[i][0] * x[0] + W1[i][1] * x[1] + b1[i];
            a1[i] = sig(z1[i]);
        }
        double z2 = W2[0] * a1[0] + W2[1] * a1[1] + b2, a2 = sig(z2);
        double loss = 0.5 * (a2 - y) * (a2 - y);

        double d2 = (a2 - y) * dsig(z2);                  // output error
        double[] d1 = { W2[0] * d2 * dsig(z1[0]), W2[1] * d2 * dsig(z1[1]) };
        double[] gW2 = { d2 * a1[0], d2 * a1[1] };        // weight grads
        System.out.printf("loss=%.5f%n", loss);
        System.out.printf("gW2=[%.4f, %.4f]%n", gW2[0], gW2[1]);
        System.out.printf("d1=[%.4f, %.4f]%n", d1[0], d1[1]);
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>

double sig(double z) { return 1.0 / (1.0 + std::exp(-z)); }
double dsig(double z) { double s = sig(z); return s * (1 - s); }

int main() {
    double x[2] = {0.5, -0.2}, y = 1.0;
    double W1[2][2] = {{0.1, 0.4}, {-0.3, 0.2}}, b1[2] = {0.0, 0.1};
    double W2[2] = {0.7, -0.5}, b2 = 0.2;

    double z1[2], a1[2];
    for (int i = 0; i < 2; i++) {
        z1[i] = W1[i][0] * x[0] + W1[i][1] * x[1] + b1[i];
        a1[i] = sig(z1[i]);
    }
    double z2 = W2[0] * a1[0] + W2[1] * a1[1] + b2, a2 = sig(z2);
    double loss = 0.5 * (a2 - y) * (a2 - y);

    double d2 = (a2 - y) * dsig(z2);                    // output error
    double d1[2] = { W2[0] * d2 * dsig(z1[0]), W2[1] * d2 * dsig(z1[1]) };
    double gW2[2] = { d2 * a1[0], d2 * a1[1] };         // weight grads
    std::printf("loss=%.5f\n", loss);
    std::printf("gW2=[%.4f, %.4f]\n", gW2[0], gW2[1]);
    std::printf("d1=[%.4f, %.4f]\n", d1[0], d1[1]);
    return 0;
}
```
