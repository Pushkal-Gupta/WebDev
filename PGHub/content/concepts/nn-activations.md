---
slug: nn-activations
module: neural-networks
title: Activation Functions — where the nonlinearity lives
subtitle: Stack linear layers and you still get a line; bend each unit with sigmoid, tanh, ReLU or GELU and the network can finally curve.
difficulty: Beginner
position: 2
estimatedReadMinutes: 13
prereqs: [nn-perceptron]
relatedProblems: []
references:
  - title: "Andrew Ng — Why non-linear activation functions (Deep Learning Specialization)"
    url: "https://www.coursera.org/learn/neural-networks-deep-learning"
    type: course
  - title: "Stanford CS231n — Commonly used activation functions (Neural Networks notes)"
    url: "https://cs231n.github.io/neural-networks-1/"
    type: reference
  - title: "Hendrycks & Gimpel — Gaussian Error Linear Units (GELU)"
    url: "https://arxiv.org/abs/1606.08415"
    type: paper
status: published
---

## intro
A neural network's layers are mostly matrix multiplications, and matrix multiplications are linear: chain a hundred of them and you have collapsed them into one — still just a single linear map, still only able to draw a straight boundary. The **activation function** is the small nonlinear bend applied to each neuron's output that breaks this collapse. Insert a nonlinearity between layers and suddenly the composition can represent curves, corners, and arbitrarily complex regions — that is the entire reason deep networks work. Which bend you choose — the S-curves sigmoid and tanh, the hinge ReLU, the smooth GELU — shapes how gradients flow during training, and the wrong choice produces classic failure modes like vanishing gradients and dead neurons.

## whyItMatters
Without a nonlinear activation, depth is an illusion: a stack of linear layers \(W_3(W_2(W_1\mathbf{x}))\) equals one linear layer \((W_3 W_2 W_1)\mathbf{x}\), so a 50-layer net would be no more expressive than logistic regression. Activations are what make the universal approximation theorem true — a network with one nonlinear hidden layer can approximate any continuous function. They are also where most training pathologies originate. Sigmoid and tanh saturate: when inputs are large in magnitude their derivative is nearly zero, so gradients shrink toward nothing as they propagate back through many layers — the **vanishing gradient problem** that stalled deep learning for years. ReLU fixed that by keeping a constant gradient of 1 on the positive side, which is why it became the default and enabled networks far deeper than tanh ever could; but ReLU brought the **dead neuron** problem, where a unit stuck in its zero region stops learning entirely. GELU and its smooth cousins now dominate transformers because they keep ReLU's benefits while restoring a smooth, never-quite-zero gradient. Choosing and reasoning about activations is therefore a core part of designing any network that trains.

## intuition
An activation \(\sigma\) is applied element-wise to each neuron's pre-activation \(z=\mathbf{w}\cdot\mathbf{x}+b\). The key property is **nonlinearity** — the bend that lets stacked layers represent shapes a single line cannot.

**Sigmoid**, \(\sigma(z)=\dfrac{1}{1+e^{-z}}\), squashes any real number into \((0,1)\), making it read like a probability. Its derivative is \(\sigma'(z)=\sigma(z)(1-\sigma(z))\), which peaks at only \(0.25\) (at \(z=0\)) and decays to nearly zero for \(|z|\gtrsim 5\). That tiny, fast-vanishing gradient is its curse: stack several sigmoids and backpropagated gradients get multiplied by numbers \(\le 0.25\) layer after layer, shrinking exponentially.

**Tanh**, \(\tanh(z)\), is a rescaled sigmoid mapping to \((-1,1)\). Being zero-centered, its outputs don't all share a sign, which makes the next layer's gradients better-behaved than sigmoid's — so tanh is generally preferred over sigmoid in hidden layers. But it still saturates at both ends, so the vanishing-gradient problem persists, just less severely.

**ReLU**, \(\mathrm{ReLU}(z)=\max(0,z)\), is a hinge: it passes positive inputs unchanged and zeros out negatives. Its derivative is exactly 1 for \(z>0\) and 0 for \(z<0\). The constant gradient of 1 on the positive side is the breakthrough — gradients neither shrink nor explode as they pass through active units, so very deep networks finally train. It is also dirt cheap (a single comparison) and induces sparsity (many units output exactly 0). The cost: a neuron whose pre-activation is negative for every input gets a zero gradient forever and can never recover — a **dead ReLU**. A unit pushed into that state by a large gradient update simply stops learning.

**Leaky ReLU**, \(\max(\alpha z, z)\) with small \(\alpha\) (e.g. 0.01), patches this by giving negative inputs a small slope instead of zero, so the gradient is never exactly zero and dead units can revive.

**GELU**, \(z\cdot\Phi(z)\) where \(\Phi\) is the standard normal CDF, is the smooth modern default in transformers. It behaves like ReLU for large \(|z|\) but curves gently through zero rather than kinking sharply, and it allows a small negative output for slightly-negative inputs. The smoothness gives well-behaved gradients everywhere — no hard dead zone, no sharp corner — which empirically trains large language and vision models more stably than ReLU.

The unifying picture: every activation trades off **saturation** (flat regions where the gradient dies and learning stalls) against **smoothness and sparsity**. Reading an activation's *derivative*, not just its output, tells you where a network will learn fast and where it will get stuck.

## visualization
```
output sigma(z) on left, derivative sigma'(z) on right

sigmoid          tanh            ReLU            GELU
  1 _____         1 ___          | /             | /
   /                 /           |/               /
 ./       0 -------/-          --+----        ---/----
 /                /             /|              _/
0                -1             0|             /
 saturates       zero-centered  hard kink      smooth bend
 both ends       still saturates dead<0         tiny neg dip

derivatives:
 sigmoid'  peaks at 0.25, ~0 for |z|>5   -> vanishing gradient
 tanh'     peaks at 1.0,  ~0 for |z|>3   -> milder vanishing
 ReLU'     = 1 if z>0 else 0             -> dead zone at z<0
 GELU'     smooth, ~1 for z>>0, never exactly 0
```

## bruteForce
The naive default is to reach for **sigmoid everywhere**, because it's the textbook neuron and its \((0,1)\) output looks like a probability. For a single-layer model or the final binary-classification output this is fine. But using sigmoid (or tanh) in the *hidden* layers of a deep network is the trap that held the field back for a decade: each layer multiplies the backpropagated gradient by a derivative capped at 0.25 (sigmoid) or 1.0 (tanh) but typically far smaller in saturated regions, so after a handful of layers the gradient reaching the early weights is effectively zero and those layers stop learning. The "brute force" mindset — pick one familiar squashing function and apply it uniformly — produces networks that train fine when shallow and mysteriously fail to improve when deep. It also wastes compute: sigmoid and tanh require an exponential per element, far costlier than ReLU's single comparison. The lesson is that activation choice is not a default to set once but a design decision tied to depth and position in the network.

## optimal
Match the activation to its role. For **hidden layers**, default to **ReLU** — constant positive-side gradient, cheap, deep-trainable — and reach for **Leaky ReLU** (or its learnable variant) if you observe dead units, since the small negative slope keeps every neuron's gradient alive. For **transformers and large modern models**, use **GELU** (or SiLU/Swish): the smooth curve through zero gives stable gradients everywhere and empirically outperforms ReLU at scale. For the **output layer**, the activation is dictated by the task, not by gradient flow: **sigmoid** for binary classification (one probability), **softmax** for multi-class (a probability distribution), and **no activation** (linear) for regression. Pair the right activation with the right initialization — He initialization for ReLU-family units, Xavier/Glorot for tanh — so that pre-activations start in a non-saturated range and gradients neither vanish nor explode at step zero. The single discipline that prevents most activation bugs: think in terms of the *derivative*. If a unit spends its life in a flat region of its activation, it cannot learn; choose activations and initializations that keep neurons in their high-gradient zone.

```python
import numpy as np

def sigmoid(z): return 1.0 / (1.0 + np.exp(-z))
def sigmoid_grad(z): s = sigmoid(z); return s * (1 - s)
def relu(z): return np.maximum(0.0, z)
def relu_grad(z): return (z > 0).astype(float)
def gelu(z): return 0.5 * z * (1 + np.tanh(np.sqrt(2/np.pi) * (z + 0.044715 * z**3)))

z = np.array([-3.0, -0.5, 0.0, 0.5, 3.0])
print("sigmoid grad:", np.round(sigmoid_grad(z), 4))   # ~0 at the tails -> vanishing
print("relu grad   :", relu_grad(z))                   # 0 for z<=0 -> dead zone
print("gelu        :", np.round(gelu(z), 4))           # smooth, small negative dip
```

## complexity
time: O(1) per element for every common activation — sigmoid/tanh/GELU cost an exponential or a tanh evaluation, ReLU/Leaky ReLU cost a single comparison; total is O(units) per layer per forward and backward pass.
space: O(units) — the forward pre-activations must be cached so the backward pass can multiply by the activation's derivative; this is the standard activation-memory cost that dominates training memory in deep nets.
notes: ReLU is the cheapest by a wide margin (no exp), which compounds across billions of activations; GELU's extra cost is usually worth it for the gradient stability at large scale.

## pitfalls
- Using sigmoid or tanh in the hidden layers of a deep network. Their derivatives saturate toward zero, so backpropagated gradients vanish across layers and early weights stop learning. Use ReLU-family activations in hidden layers; reserve sigmoid/softmax for the output.
- Dead ReLUs from a too-large learning rate. A big update can push a unit's pre-activation negative for all inputs, giving it a permanent zero gradient. Lower the learning rate, use Leaky ReLU/GELU, or initialize with He init to keep units active.
- Wrong initialization for the activation. Xavier/Glorot init assumes a tanh-like, symmetric activation; using it with ReLU makes activations shrink layer by layer. Use He initialization for ReLU-family units.
- Putting an activation on the regression output. Squashing a linear regression target through sigmoid or ReLU clips the range you can predict. The output layer of a regressor should be linear (no activation).
- Treating saturated outputs as confident. A sigmoid pinned near 0 or 1 has a near-zero gradient, so the network can't correct it even when it's wrong — saturation is a learning hazard, not a sign of certainty.

## interviewTips
- Answer "why do we need activations?" with the collapse argument: without a nonlinearity, stacked linear layers reduce to one linear layer, so depth buys nothing. The nonlinearity is what makes deep networks more expressive than logistic regression.
- Explain the vanishing-gradient problem by reasoning about derivatives: sigmoid's derivative maxes at 0.25, so chaining several layers multiplies gradients by small numbers and they shrink exponentially — which is why ReLU (gradient 1 on the positive side) enabled much deeper nets.
- Know the dead-ReLU failure mode and its fixes (Leaky ReLU, GELU, lower learning rate, He init), and be able to say where GELU is the modern default (transformers) and why (smooth, no hard dead zone).

## keyTakeaways
- Activations supply the nonlinearity that prevents stacked linear layers from collapsing into one; without them, a deep network is no more expressive than a single linear classifier.
- Sigmoid and tanh saturate — their derivatives die at the tails, causing vanishing gradients in deep stacks — while ReLU keeps a constant gradient of 1 on the positive side, which is why it enabled truly deep training.
- ReLU's flat negative region can produce permanently dead neurons; Leaky ReLU and the smooth GELU restore a nonzero gradient everywhere, and GELU is the default in modern transformers. Reason about the derivative, not just the output, to predict where a network learns.

## code.python
```python
import numpy as np

def sigmoid(z): return 1.0 / (1.0 + np.exp(-z))
def tanh(z): return np.tanh(z)
def relu(z): return np.maximum(0.0, z)
def leaky_relu(z, a=0.01): return np.where(z > 0, z, a * z)
def gelu(z):
    return 0.5 * z * (1 + np.tanh(np.sqrt(2 / np.pi) * (z + 0.044715 * z ** 3)))

def relu_grad(z): return (z > 0).astype(float)
def sigmoid_grad(z): s = sigmoid(z); return s * (1 - s)

z = np.array([-4.0, -1.0, 0.0, 1.0, 4.0])
print("relu       :", relu(z))
print("leaky_relu :", leaky_relu(z))
print("gelu       :", np.round(gelu(z), 3))
print("sigmoid_grad:", np.round(sigmoid_grad(z), 4))  # tails ~ 0 -> vanishing
```

## code.javascript
```javascript
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const tanh = (z) => Math.tanh(z);
const relu = (z) => Math.max(0, z);
const leakyRelu = (z, a = 0.01) => (z > 0 ? z : a * z);
const gelu = (z) =>
  0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3)));

const sigmoidGrad = (z) => { const s = sigmoid(z); return s * (1 - s); };
const reluGrad = (z) => (z > 0 ? 1 : 0);

const zs = [-4, -1, 0, 1, 4];
console.log("relu       :", zs.map(relu));
console.log("leaky      :", zs.map((z) => leakyRelu(z)));
console.log("gelu       :", zs.map((z) => +gelu(z).toFixed(3)));
console.log("sigmoidGrad:", zs.map((z) => +sigmoidGrad(z).toFixed(4)));
```

## code.java
```java
public class Activations {
    static double sigmoid(double z) { return 1.0 / (1.0 + Math.exp(-z)); }
    static double relu(double z) { return Math.max(0.0, z); }
    static double leakyRelu(double z, double a) { return z > 0 ? z : a * z; }
    static double gelu(double z) {
        double inner = Math.sqrt(2.0 / Math.PI) * (z + 0.044715 * z * z * z);
        return 0.5 * z * (1 + Math.tanh(inner));
    }
    static double sigmoidGrad(double z) { double s = sigmoid(z); return s * (1 - s); }
    static double reluGrad(double z) { return z > 0 ? 1.0 : 0.0; }

    public static void main(String[] args) {
        double[] zs = {-4, -1, 0, 1, 4};
        for (double z : zs) {
            System.out.printf("z=%+.0f relu=%.2f leaky=%.3f gelu=%.3f sigGrad=%.4f%n",
                z, relu(z), leakyRelu(z, 0.01), gelu(z), sigmoidGrad(z));
        }
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <algorithm>
using namespace std;

double sigmoid(double z) { return 1.0 / (1.0 + exp(-z)); }
double relu(double z) { return max(0.0, z); }
double leaky_relu(double z, double a = 0.01) { return z > 0 ? z : a * z; }
double gelu(double z) {
    double inner = sqrt(2.0 / M_PI) * (z + 0.044715 * z * z * z);
    return 0.5 * z * (1 + tanh(inner));
}
double sigmoid_grad(double z) { double s = sigmoid(z); return s * (1 - s); }

int main() {
    double zs[] = {-4, -1, 0, 1, 4};
    for (double z : zs) {
        printf("z=%+.0f relu=%.2f leaky=%.3f gelu=%.3f sigGrad=%.4f\n",
               z, relu(z), leaky_relu(z), gelu(z), sigmoid_grad(z));
    }
    return 0;
}
```
