---
slug: nn-cnn-architectures
module: neural-networks
title: CNN Architectures
subtitle: LeNet to ResNet — how convolutional nets got deeper, and why skip connections let depth finally pay off.
difficulty: Intermediate
position: 11
estimatedReadMinutes: 15
prereqs: [nn-convolutional, nn-backpropagation]
relatedProblems: []
references:
  - title: "He et al. — Deep Residual Learning for Image Recognition (ResNet)"
    url: "https://arxiv.org/abs/1512.03385"
    type: paper
  - title: "Krizhevsky et al. — ImageNet Classification with Deep Convolutional Neural Networks (AlexNet)"
    url: "https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html"
    type: paper
  - title: "Simonyan & Zisserman — Very Deep Convolutional Networks for Large-Scale Image Recognition (VGG)"
    url: "https://arxiv.org/abs/1409.1556"
    type: paper
  - title: "LeCun et al. — Gradient-Based Learning Applied to Document Recognition (LeNet)"
    url: "http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf"
    type: paper
status: published
---

## intro
A single convolution layer detects edges and blobs. A useful vision network stacks dozens of them so that early layers find edges, middle layers assemble those edges into textures and parts, and late layers recognize whole objects. The story of convolutional architectures is the story of that stack getting deeper: LeNet-5 in 1998 had two convolutional layers, AlexNet in 2012 had five, VGG in 2014 had sixteen, and ResNet in 2015 had over a hundred. Each jump unlocked accuracy that shallower nets could not reach — but simply piling on layers stopped working around twenty, because gradients vanished and deep plain nets trained *worse* than shallow ones. Residual connections broke that ceiling. This lesson traces why depth helps, what breaks when you overdo it, and how the skip connection fixed it.

## whyItMatters
Every modern vision system — object detectors, segmentation models, medical imaging pipelines, the image encoders inside multimodal language models — descends from this lineage, and most still use residual blocks as their backbone. Knowing the progression tells you *why* the field's defaults look the way they do: why kernels are almost always 3x3, why channel counts double whenever spatial size halves, why batch normalization sits between convolution and activation, why a network can be 50 or 152 layers deep without collapsing. It also tells you the failure modes to watch for. A practitioner who understands the degradation problem knows that adding layers is not free and that a skip connection is not decoration — it changes what the layers are asked to learn. When you fine-tune a ResNet, quote receptive fields to justify an architecture, or debug a deep net that will not train, this history is the map. The same ideas — residual paths, normalization, depth over width — reappear in transformers, so the payoff extends well past images.

## intuition
Think of a deep network as an assembly line where each station adds a little more understanding to the image. The first station sees raw pixels and can only notice tiny local patterns — a bright-to-dark edge, a corner, a spot of color. But here is the key: because each station looks at a small window over the *output* of the previous station, and that output already summarized a window of the layer before it, the region of the original image that influences one late-layer value keeps growing. That growing window is the **receptive field**. Stack enough layers and a single neuron near the top "sees" the whole image, even though every individual convolution only ever looked at a 3x3 patch. Depth buys reach.

Convolution also shares one small set of weights across every position in the image — the same edge detector slides everywhere. This **parameter sharing** is why a convolutional layer with a handful of filters can process a megapixel image with a few hundred weights, while a fully connected layer would need millions and would have to relearn "edge" separately in every corner. Sharing bakes in the assumption that a useful pattern is useful wherever it appears, which is exactly true for natural images.

Between convolutions we periodically **downsample** — via pooling or a strided convolution — halving the height and width. This is deliberate: it throws away fine spatial precision we no longer need and, crucially, it makes each following layer's fixed window cover twice as much of the original image, accelerating receptive-field growth while keeping computation affordable. To pay for the lost spatial detail we usually *double the channel count* at each downsampling step, trading resolution for richer feature descriptions. So the canonical shape of a convolutional net is a funnel: feature maps shrink in height and width as they descend, and grow in depth (channels). VGG's insight sharpened this — two stacked 3x3 convolutions see the same 5x5 region as one 5x5 convolution but use fewer weights and add an extra nonlinearity, so small kernels stacked deep beat big kernels stacked shallow.

## visualization
```
ResNet-style funnel — spatial size shrinks, channels grow going DOWN:

  input           32 x 32  x   3    <- H x W x C  (raw RGB image)
    |
  [conv 3x3]      32 x 32  x  64     edges / colors, receptive field ~3
    |
  [conv 3x3]      32 x 32  x  64  <-.  residual block: y = F(x) + x
    |               (skip)          |  the +x arc bypasses these convs
    +---------------->--------------'  so gradient has a clean path back
    |
  [pool /2]       16 x 16  x 128     downsample, channels doubled
    |
  [conv 3x3]      16 x 16  x 128     textures / parts, RF grows fast
    |
  [pool /2]        8 x  8  x 256
    |
  [conv 3x3]       8 x  8  x 256     object parts, RF ~ whole image
    |
  [global pool]    1 x  1  x 256     collapse spatial dims
    |
  [dense]                 10         class scores
```

## bruteForce
The obvious way to make a network more powerful is to keep stacking plain convolutional layers — twenty, forty, a hundred of them — expecting each one to add capacity. It does not work. Past roughly twenty layers, a plain stack suffers the **degradation problem**: the deeper network reaches *higher* training error than a shallower one, even though the deeper net could in principle just copy the shallow net and set the extra layers to identity. Two forces conspire. First, **vanishing gradients**: backpropagation multiplies many small Jacobian factors together across layers, so the gradient reaching the early layers shrinks toward zero and those layers barely update. Second, plain layers find the identity mapping surprisingly hard to represent — asking a stack of convolutions with nonlinearities to output exactly their input requires a precise, awkward setting of weights. So the extra depth, instead of being free capacity, becomes dead weight the optimizer cannot even neutralize. You can soften this with careful initialization and normalization, but the ceiling remains: naive depth eventually hurts.

## optimal
The fix is the **residual block**. Instead of asking a stack of layers to compute a target mapping \(H(x)\) directly, ask it to compute only the *difference* from the input, \(F(x) = H(x) - x\), and then add the input back through a shortcut:
\[
y = F(x) + x.
\]
Here \(F\) is a couple of convolution + batch-norm + ReLU layers, and the \(+x\) is an **identity shortcut** that simply carries the input forward unchanged. This small change fixes the degradation problem for two reasons. First, if the ideal behaviour for a block is to do nothing, the optimizer only has to drive \(F(x) \to 0\) — pushing weights toward zero is easy, whereas learning an exact identity through nonlinear layers is hard. So adding blocks can never make training worse; in the limit they become identities. Second, the shortcut gives gradients a clean path home. Differentiating \(y = F(x)+x\) gives \(\frac{\partial y}{\partial x} = \frac{\partial F}{\partial x} + 1\); that \(+1\) means the gradient always has a term that flows straight through, so it cannot vanish no matter how deep the stack.

Several supporting ideas make deep stacks trainable. **Batch normalization**, placed between the convolution and the activation, renormalizes each layer's inputs every minibatch; it keeps activations in a healthy range, stabilizes gradients, and lets you use larger learning rates — without it, hundred-layer nets barely train. **Receptive-field growth** justifies the depth: stacking 3x3 convolutions widens the effective window a couple of pixels per layer, so late layers integrate context from most of the image. Following VGG, small \(3\times 3\) kernels stacked deep beat one large kernel: two 3x3 layers cover a 5x5 region with \(2\cdot 3^2 = 18\) weights per channel versus \(5^2 = 25\), plus an extra nonlinearity. For very deep nets, **1x1 convolutions** form a bottleneck: a 1x1 conv squeezes the channel count down before an expensive 3x3 conv, then another 1x1 restores it, cutting compute dramatically while preserving representational power. Together — residual shortcuts, batch norm, small stacked kernels, and bottlenecks — these turn "deeper" from a liability into the single most reliable lever for accuracy.

```python
import numpy as np

# A residual add: F(x) is what a small conv stack learned; x is the shortcut.
def residual_add(F_x, x):
    return F_x + x          # y = F(x) + x — identity path lets gradients flow

x = np.array([[1.0, 2.0], [3.0, 4.0]])
F_x = np.array([[0.1, -0.2], [0.0, 0.3]])   # small learned residual
print(residual_add(F_x, x))   # close to x when F(x) is near zero
```

## complexity
time: O(K^2 * C_in * C_out * H * W) per convolutional layer — kernel area times input channels times output channels times the spatial size of the output map. Total network cost is the sum over layers; downsampling shrinks H*W while doubling channels, so the per-layer cost stays roughly balanced down the stack. A 1x1 bottleneck cuts the K^2 factor to 1 and reduces C, which is why deep ResNets use it.
space: O(sum of activation-map sizes) for the forward pass, dominated by the early high-resolution layers, plus O(number of parameters) for the weights. Residual shortcuts add no parameters when input and output shapes match (identity), only a cheap 1x1 projection when the channel count changes.
notes: Depth adds layers but each layer's parameter count is independent of image size thanks to parameter sharing, so a convolutional net has far fewer weights than a dense net of comparable reach. The dominant training cost is activations to store for backprop, not the weights.

## pitfalls
- Expecting a plain deep stack to keep improving. Beyond ~20 layers a plain net hits the degradation problem and trains *worse* than a shallower one. The fix: use residual (or dense) skip connections so extra depth defaults to identity and gradients keep flowing.
- Adding a shortcut across a shape mismatch. If the block changes spatial size or channel count, `F(x) + x` fails because the tensors do not align. The fix: put a 1x1 convolution (with matching stride) on the shortcut to project `x` to the block's output shape before adding.
- Dropping batch normalization from a very deep net. Without it, activations drift in scale, gradients destabilize, and a 50+ layer net may not train at all. The fix: place batch norm between the convolution and the activation in every residual block, and keep it in eval mode at inference.
- Reaching for one large kernel instead of stacked small ones. A single 7x7 conv uses more parameters and adds only one nonlinearity compared with three stacked 3x3 convs covering the same receptive field. The fix: prefer stacks of 3x3 convolutions (the VGG rule) except at the very first layer, where a larger stem kernel is common.
- Forgetting to downsample and grow channels together. Halving spatial size without increasing channels throws away capacity; growing channels without ever downsampling explodes compute. The fix: double the channel count at each stride-2 stage so cost per stage stays balanced.

## interviewTips
- Explain the degradation problem precisely: it is not overfitting (training error rises too) and not only vanishing gradients — plain layers also struggle to learn the identity. Then show `y = F(x) + x` and how it makes identity the easy default while the `+1` in the derivative keeps gradients alive.
- Be ready to compute a receptive field. State the rule that stacking two 3x3 convs matches one 5x5's window with fewer weights and an extra nonlinearity, and explain how pooling or stride-2 layers grow the receptive field faster by shrinking the spatial map.
- Connect the funnel shape to a design principle: spatial size halves and channels double at each stage so per-stage compute stays balanced, parameter sharing keeps weight counts independent of image size, and 1x1 bottlenecks cut the cost of very deep nets. Naming these signals architectural fluency, not memorization.

## keyTakeaways
- Depth is the lever: stacking convolutions grows the receptive field so late layers see the whole image, while parameter sharing keeps weight counts tiny and pooling/stride downsampling trades spatial resolution for channels in a shrinking-then-deepening funnel.
- Naive depth fails past ~20 layers via the degradation problem (vanishing gradients plus the difficulty of learning identity); the residual block `y = F(x) + x` fixes it by making identity the easy default and giving gradients a clean shortcut path back.
- Supporting tricks make deep nets practical: batch norm between conv and activation stabilizes training, stacked 3x3 kernels beat one big kernel (VGG), and 1x1 bottlenecks slash the cost of very deep stacks.

## code.python
```python
import numpy as np

# Tiny CNN forward pass: valid 2D convolution -> ReLU -> 2x2 max-pool, then a residual add.
def conv2d_valid(x, k):
    H, W = x.shape
    kh, kw = k.shape
    out = np.zeros((H - kh + 1, W - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(x[i:i+kh, j:j+kw] * k)
    return out

def relu(x):
    return np.maximum(0.0, x)

def maxpool2x2(x):
    H, W = x.shape
    out = np.zeros((H // 2, W // 2))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.max(x[2*i:2*i+2, 2*j:2*j+2])
    return out

x = np.array([
    [1., 2., 0., 1.],
    [3., 1., 2., 0.],
    [0., 1., 3., 2.],
    [2., 0., 1., 1.],
])
kernel = np.array([[1., 0.], [0., -1.]])   # a simple diagonal edge detector

feat = maxpool2x2(relu(conv2d_valid(x, kernel)))
print("conv->relu->pool:\n", feat)

# Residual add on the pooled map: y = F(x) + x with a small learned residual F.
F = np.array([[0.5, -0.5], [0.0, 0.25]])
print("residual y = F(x) + x:\n", F + feat)
```

## code.javascript
```javascript
// Tiny CNN forward pass: valid 2D convolution -> ReLU -> 2x2 max-pool, then residual add.
function conv2dValid(x, k) {
  const H = x.length, W = x[0].length, kh = k.length, kw = k[0].length;
  const out = [];
  for (let i = 0; i <= H - kh; i++) {
    const row = [];
    for (let j = 0; j <= W - kw; j++) {
      let s = 0;
      for (let a = 0; a < kh; a++)
        for (let b = 0; b < kw; b++) s += x[i + a][j + b] * k[a][b];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

const relu = m => m.map(r => r.map(v => Math.max(0, v)));

function maxpool2x2(x) {
  const out = [];
  for (let i = 0; i < x.length; i += 2) {
    const row = [];
    for (let j = 0; j < x[0].length; j += 2) {
      row.push(Math.max(x[i][j], x[i][j + 1], x[i + 1][j], x[i + 1][j + 1]));
    }
    out.push(row);
  }
  return out;
}

const x = [
  [1, 2, 0, 1],
  [3, 1, 2, 0],
  [0, 1, 3, 2],
  [2, 0, 1, 1],
];
const kernel = [[1, 0], [0, -1]];

const feat = maxpool2x2(relu(conv2dValid(x, kernel)));
console.log("conv->relu->pool:", JSON.stringify(feat));

const F = [[0.5, -0.5], [0.0, 0.25]];
const y = feat.map((r, i) => r.map((v, j) => v + F[i][j]));
console.log("residual y = F(x) + x:", JSON.stringify(y));
```

## code.java
```java
public class TinyCnn {
    static double[][] convValid(double[][] x, double[][] k) {
        int H = x.length, W = x[0].length, kh = k.length, kw = k[0].length;
        double[][] out = new double[H - kh + 1][W - kw + 1];
        for (int i = 0; i < out.length; i++)
            for (int j = 0; j < out[0].length; j++) {
                double s = 0;
                for (int a = 0; a < kh; a++)
                    for (int b = 0; b < kw; b++) s += x[i + a][j + b] * k[a][b];
                out[i][j] = s;
            }
        return out;
    }

    static double[][] relu(double[][] x) {
        double[][] out = new double[x.length][x[0].length];
        for (int i = 0; i < x.length; i++)
            for (int j = 0; j < x[0].length; j++) out[i][j] = Math.max(0, x[i][j]);
        return out;
    }

    static double[][] maxpool2x2(double[][] x) {
        double[][] out = new double[x.length / 2][x[0].length / 2];
        for (int i = 0; i < out.length; i++)
            for (int j = 0; j < out[0].length; j++)
                out[i][j] = Math.max(Math.max(x[2*i][2*j], x[2*i][2*j+1]),
                                     Math.max(x[2*i+1][2*j], x[2*i+1][2*j+1]));
        return out;
    }

    public static void main(String[] args) {
        double[][] x = {
            {1, 2, 0, 1}, {3, 1, 2, 0}, {0, 1, 3, 2}, {2, 0, 1, 1}
        };
        double[][] kernel = {{1, 0}, {0, -1}};
        double[][] feat = maxpool2x2(relu(convValid(x, kernel)));
        double[][] F = {{0.5, -0.5}, {0.0, 0.25}};
        System.out.println("conv->relu->pool:");
        for (double[] row : feat) System.out.println(java.util.Arrays.toString(row));
        System.out.println("residual y = F(x) + x:");
        for (int i = 0; i < feat.length; i++) {
            for (int j = 0; j < feat[0].length; j++) System.out.print((feat[i][j] + F[i][j]) + " ");
            System.out.println();
        }
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
#include <algorithm>
using namespace std;

using Mat = vector<vector<double>>;

Mat convValid(const Mat& x, const Mat& k) {
    int H = x.size(), W = x[0].size(), kh = k.size(), kw = k[0].size();
    Mat out(H - kh + 1, vector<double>(W - kw + 1, 0.0));
    for (int i = 0; i < (int)out.size(); i++)
        for (int j = 0; j < (int)out[0].size(); j++) {
            double s = 0;
            for (int a = 0; a < kh; a++)
                for (int b = 0; b < kw; b++) s += x[i + a][j + b] * k[a][b];
            out[i][j] = s;
        }
    return out;
}

Mat reluMat(const Mat& x) {
    Mat out = x;
    for (auto& row : out) for (auto& v : row) v = max(0.0, v);
    return out;
}

Mat maxpool2x2(const Mat& x) {
    Mat out(x.size() / 2, vector<double>(x[0].size() / 2, 0.0));
    for (int i = 0; i < (int)out.size(); i++)
        for (int j = 0; j < (int)out[0].size(); j++)
            out[i][j] = max(max(x[2*i][2*j], x[2*i][2*j+1]),
                            max(x[2*i+1][2*j], x[2*i+1][2*j+1]));
    return out;
}

int main() {
    Mat x = {{1, 2, 0, 1}, {3, 1, 2, 0}, {0, 1, 3, 2}, {2, 0, 1, 1}};
    Mat kernel = {{1, 0}, {0, -1}};
    Mat feat = maxpool2x2(reluMat(convValid(x, kernel)));
    Mat F = {{0.5, -0.5}, {0.0, 0.25}};
    printf("conv->relu->pool:\n");
    for (auto& row : feat) { for (double v : row) printf("%g ", v); printf("\n"); }
    printf("residual y = F(x) + x:\n");
    for (int i = 0; i < (int)feat.size(); i++) {
        for (int j = 0; j < (int)feat[0].size(); j++) printf("%g ", feat[i][j] + F[i][j]);
        printf("\n");
    }
    return 0;
}
```
