---
slug: nn-convolutional
module: neural-networks
title: Convolutional Neural Networks
subtitle: Slide a small shared filter across an image and let the network discover edges, then textures, then objects — without ever connecting every pixel to every neuron.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 14
prereqs: [nn-backpropagation]
relatedProblems: []
references:
  - title: "Distill — Feature Visualization (what convolutional features learn)"
    url: "https://distill.pub/2017/feature-visualization/"
    type: article
  - title: "Stanford CS231n — Convolutional Neural Networks (course notes)"
    url: "https://cs231n.github.io/convolutional-networks/"
    type: course
  - title: "3Blue1Brown — But what is a convolution?"
    url: "https://www.youtube.com/watch?v=KuXjwB4LzSA"
    type: video
status: published
---

## intro
A fully connected layer treats an image as a flat list of pixels, giving every pixel its own weight into every neuron — for a modest 200×200 colour image that is 120{,}000 inputs times thousands of neurons, hundreds of millions of weights in a single layer, and it throws away the one thing that makes an image an image: the fact that nearby pixels are related and that a cat is a cat wherever it appears. A convolutional neural network fixes both problems with one idea: slide a small set of shared weights — a **filter** or **kernel** — across the image, computing a dot product at every position. The same filter, reused everywhere, detects the same local pattern regardless of where it sits. Stack these layers and the network learns edges, then corners and textures, then object parts, then whole objects.

## whyItMatters
Convolutional networks are why computers can see. They power image classification, object detection, face recognition, medical imaging, self-driving perception, and were the architecture that ignited the deep-learning revolution when AlexNet won ImageNet in 2012 by a stunning margin. Their two structural priors — **local connectivity** and **weight sharing** — match the statistics of natural images so well that they need orders of magnitude fewer parameters than a fully connected network while generalizing far better. Those same priors recur far beyond images: 1D convolutions process audio and time series, and the convolution operation underlies signal processing broadly. Even as transformers now rival or surpass CNNs on large vision benchmarks, convolutions remain the efficient default for most real-world vision work and a foundational concept: understanding receptive fields, feature maps, pooling, and translation equivariance is prerequisite to understanding modern vision systems of any kind.

## intuition
Start with a single **filter** — say a 3×3 grid of weights. Place it on the top-left corner of the image, multiply each filter weight by the pixel beneath it, sum the nine products, and write that single number into an output grid called a **feature map**. Now slide the filter one pixel right and repeat; slide across the whole row, then down. The feature map records, at every position, how strongly the local image patch matches the pattern the filter encodes. A filter whose weights look like \([-1, 0, +1]\) horizontally lights up on vertical edges — a dark-to-light transition produces a big positive sum, a flat region produces zero. The filter is a *pattern detector that reports where its pattern occurs*.

Two structural ideas make this powerful. First, **local receptive fields**: each output only depends on a small patch of input, because nearby pixels carry the meaningful structure — an edge is a local event, not a global one. Second, **weight sharing**: the *same* filter weights are reused at every position. A vertical-edge detector should fire on a vertical edge whether it is in the corner or the centre, so it makes no sense to learn a separate detector per location. Sharing slashes the parameter count from "one weight per pixel per neuron" to "one small filter," and it gives the layer **translation equivariance** — shift the input, and the feature map shifts the same way.

A convolutional layer learns *many* filters at once, each producing its own feature map; together they form a stack of channels. Crucially the filters are **learned by backpropagation**, not hand-designed — the network discovers which edges, blobs, and textures are worth detecting for the task. **Pooling** then summarizes each small neighbourhood of a feature map (max-pooling keeps the strongest response), shrinking the spatial size, granting a little translation *invariance*, and widening the **receptive field** so that deeper layers see larger regions of the original image. Stack convolution → activation → pooling repeatedly and a hierarchy emerges: early layers respond to oriented edges, middle layers to textures and motifs, late layers to object parts and whole objects — a learned visual vocabulary built from the bottom up.

## visualization
```
input image (5x5)            3x3 kernel (vertical-edge)        feature map (3x3)
 +--+--+--+--+--+            +----+----+----+                 the kernel slides over
 | 0| 0|10|10|10|            | -1 |  0 | +1 |                 every 3x3 window; each
 | 0| 0|10|10|10|            | -1 |  0 | +1 |  =  dot prod -> output cell is the dot
 | 0| 0|10|10|10|            | -1 |  0 | +1 |                 product of kernel and
 | 0| 0|10|10|10|            +----+----+----+                 the window beneath it.
 | 0| 0|10|10|10|

window at top-left   .  kernel  = (-1*0)+(0*0)+(1*10) + (-1*0)+(0*0)+(1*10) + (-1*0)+(0*0)+(1*10) = 30
  ->  large positive response exactly on the dark-to-light vertical edge; flat areas give 0.

then 2x2 max-pool a feature map:   [[30,30,0],[30,30,0],...]  ->  keep the max of each 2x2 block
  ->  smaller map, strongest responses survive, a little shift no longer matters.
```

## bruteForce
The "brute-force" baseline is the **fully connected layer**: flatten the image to a vector and connect every input to every neuron with its own weight. This can in principle represent any function a CNN can, but it is wasteful and weak for images. The parameter count explodes — a single hidden layer over a 200×200×3 image needs tens of millions of weights *per neuron-bank*, which overfits and is slow to train. Worse, it has no built-in notion that nearby pixels matter more or that a pattern in one corner is the same pattern in another; it must *learn* translation invariance from data, which takes enormous amounts of it and rarely fully succeeds. Implementing convolution itself naively — four nested loops over output positions and kernel positions — is correct but slow; production systems lower convolution to matrix multiplication (the im2col trick) or use FFT-based and Winograd algorithms, so the conceptual quadruple loop is the thing to understand, not the thing to ship.

## optimal
A **convolutional layer** applies the structural priors directly. For a single 2D input and one kernel \(K\) of size \(k\times k\), the feature map is the **cross-correlation**
\[
S[i,j]=\sum_{m=0}^{k-1}\sum_{n=0}^{k-1} I[i\,s+m,\;j\,s+n]\,K[m,n]+b,
\]
where \(s\) is the **stride** (how far the filter jumps) and \(b\) a shared bias. With \(C_{\text{in}}\) input channels and \(C_{\text{out}}\) filters, each filter is \(k\times k\times C_{\text{in}}\) and produces one output channel; **padding** the input preserves spatial size. The output size is \(\big\lfloor (W - k + 2p)/s \big\rfloor + 1\). A **pooling** layer then downsamples: max-pool takes \(\max\) over each window, average-pool the mean. The whole stack is differentiable, so the filters are trained by backpropagation exactly like any other weights — the gradient of a shared weight simply sums the contributions from every position it was applied. The parameter count of a conv layer is \(C_{\text{out}}\,(k^2 C_{\text{in}} + 1)\), independent of image size — that size-independence is the structural win. Modern architectures stack many such layers with small (3×3) kernels, interleave normalization and residual connections, and end with a few fully connected layers or global pooling for the final prediction.

```python
import numpy as np

def conv2d(image, kernel, stride=1):
    """Valid 2D cross-correlation: slide kernel over image, dot product per window."""
    kh, kw = kernel.shape
    H, W = image.shape
    out_h = (H - kh) // stride + 1
    out_w = (W - kw) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            patch = image[i*stride:i*stride+kh, j*stride:j*stride+kw]
            out[i, j] = np.sum(patch * kernel)   # element-wise multiply then sum
    return out

img = np.array([[0,0,10,10,10]]*5, dtype=float)
edge = np.array([[-1,0,1],[-1,0,1],[-1,0,1]], dtype=float)  # vertical-edge filter
print(conv2d(img, edge))    # large response on the dark->light edge, 0 on flat regions
```

## complexity
time: O(C_out · C_in · k² · H_out · W_out) for a convolution layer — one multiply-add per output position per kernel weight per channel pair. Pooling is O(C · H_out · W_out · pool²).
space: O(C_out · H_out · W_out) for the feature maps (activation memory, the dominant cost in deep CNNs), plus O(C_out · C_in · k²) for the small, size-independent parameter tensor.
notes: Parameter count is independent of image resolution — that is the structural payoff of weight sharing. Compute still scales with output area. Production convolution is lowered to GEMM (im2col) or uses Winograd/FFT to exploit fast matrix-multiply hardware.

## pitfalls
- Confusing convolution with cross-correlation. Mathematical convolution flips the kernel; deep-learning "convolution" does not (it is cross-correlation). It rarely matters because the kernel is learned, but it bites when you port a hand-designed filter or compare to signal-processing code. The fix: be explicit about whether the kernel is flipped.
- Off-by-one output-size errors. The formula \(\lfloor(W-k+2p)/s\rfloor+1\) is easy to get wrong; a mismatched stride or forgotten padding silently changes spatial dimensions and breaks the next layer. The fix: compute and assert output shapes explicitly.
- Over-pooling away spatial information. Aggressive pooling or large strides shrink feature maps so fast that fine detail (needed for segmentation or small objects) is destroyed. The fix: use pooling sparingly, prefer strided convolutions, or use dilated convolutions to grow the receptive field without downsampling.
- Forgetting that filters span all input channels. A 3×3 filter on a 64-channel input is actually 3×3×64; treating it as 2D drops channel mixing and gives wrong shapes. The fix: always size kernels as \(k\times k\times C_{\text{in}}\).
- Assuming translation invariance is free. Convolution is translation *equivariant*; full *invariance* comes only from pooling/global pooling, and CNNs are not naturally invariant to rotation or scale. The fix: use data augmentation for transformations the architecture does not handle structurally.

## interviewTips
- Be ready to compute a layer's parameter count and output spatial size from \(k\), stride, padding, and channel counts — it is the single most common CNN interview question and tests whether you actually understand the operation.
- Explain *why* CNNs beat fully connected nets on images using the two priors — local connectivity and weight sharing — and connect weight sharing to translation equivariance and the dramatic parameter reduction.
- Distinguish equivariance (convolution) from invariance (pooling), and describe the receptive-field hierarchy: edges → textures → parts → objects as depth increases. Mentioning im2col/GEMM lowering shows systems awareness.

## keyTakeaways
- A convolution slides a small shared filter across the input, computing a dot product at each position to build a feature map; the filter is a learned local-pattern detector that reports where its pattern occurs.
- Local receptive fields and weight sharing make CNNs parameter-efficient (parameter count is independent of image size) and translation-equivariant — and the filters are learned by backpropagation, with pooling adding downsampling and a little invariance while widening the receptive field.
- Stacking convolution → activation → pooling builds a feature hierarchy (edges → textures → parts → objects); the layer's output size follows \(\lfloor(W-k+2p)/s\rfloor+1\) and its cost scales with output area, not parameters.

## code.python
```python
import numpy as np

def conv2d(image, kernel, stride=1):
    kh, kw = kernel.shape
    out_h = (image.shape[0] - kh) // stride + 1
    out_w = (image.shape[1] - kw) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            patch = image[i*stride:i*stride+kh, j*stride:j*stride+kw]
            out[i, j] = float(np.sum(patch * kernel))
    return out

def max_pool(fmap, size=2, stride=2):
    out_h = (fmap.shape[0] - size) // stride + 1
    out_w = (fmap.shape[1] - size) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            out[i, j] = fmap[i*stride:i*stride+size, j*stride:j*stride+size].max()
    return out

img = np.array([[0, 0, 10, 10, 10]] * 5, dtype=float)
edge = np.array([[-1, 0, 1]] * 3, dtype=float)
fm = conv2d(img, edge)
print(fm)                 # vertical-edge feature map
print(max_pool(fm))       # downsampled, strongest responses kept
```

## code.javascript
```javascript
function conv2d(image, kernel, stride = 1) {
  const kh = kernel.length, kw = kernel[0].length;
  const outH = Math.floor((image.length - kh) / stride) + 1;
  const outW = Math.floor((image[0].length - kw) / stride) + 1;
  const out = Array.from({ length: outH }, () => new Array(outW).fill(0));
  for (let i = 0; i < outH; i++)
    for (let j = 0; j < outW; j++) {
      let s = 0;
      for (let m = 0; m < kh; m++)
        for (let n = 0; n < kw; n++)
          s += image[i * stride + m][j * stride + n] * kernel[m][n];
      out[i][j] = s;
    }
  return out;
}

function maxPool(fmap, size = 2, stride = 2) {
  const outH = Math.floor((fmap.length - size) / stride) + 1;
  const outW = Math.floor((fmap[0].length - size) / stride) + 1;
  const out = Array.from({ length: outH }, () => new Array(outW).fill(-Infinity));
  for (let i = 0; i < outH; i++)
    for (let j = 0; j < outW; j++)
      for (let m = 0; m < size; m++)
        for (let n = 0; n < size; n++)
          out[i][j] = Math.max(out[i][j], fmap[i * stride + m][j * stride + n]);
  return out;
}

const img = Array.from({ length: 5 }, () => [0, 0, 10, 10, 10]);
const edge = Array.from({ length: 3 }, () => [-1, 0, 1]);
const fm = conv2d(img, edge);
console.log(fm);            // vertical-edge feature map
console.log(maxPool(fm));   // downsampled
```

## code.java
```java
public class ConvNet {
    static double[][] conv2d(double[][] img, double[][] ker, int stride) {
        int kh = ker.length, kw = ker[0].length;
        int outH = (img.length - kh) / stride + 1;
        int outW = (img[0].length - kw) / stride + 1;
        double[][] out = new double[outH][outW];
        for (int i = 0; i < outH; i++)
            for (int j = 0; j < outW; j++) {
                double s = 0;
                for (int m = 0; m < kh; m++)
                    for (int n = 0; n < kw; n++)
                        s += img[i * stride + m][j * stride + n] * ker[m][n];
                out[i][j] = s;
            }
        return out;
    }

    public static void main(String[] args) {
        double[][] img = new double[5][];
        for (int r = 0; r < 5; r++) img[r] = new double[]{0, 0, 10, 10, 10};
        double[][] edge = {{-1, 0, 1}, {-1, 0, 1}, {-1, 0, 1}};
        double[][] fm = conv2d(img, edge, 1);
        for (double[] row : fm) {
            for (double v : row) System.out.printf("%6.1f", v);
            System.out.println();
        }
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <vector>
using std::vector;

vector<vector<double>> conv2d(const vector<vector<double>>& img,
                              const vector<vector<double>>& ker, int stride) {
    int kh = ker.size(), kw = ker[0].size();
    int outH = (int)(img.size() - kh) / stride + 1;
    int outW = (int)(img[0].size() - kw) / stride + 1;
    vector<vector<double>> out(outH, vector<double>(outW, 0.0));
    for (int i = 0; i < outH; i++)
        for (int j = 0; j < outW; j++) {
            double s = 0;
            for (int m = 0; m < kh; m++)
                for (int n = 0; n < kw; n++)
                    s += img[i * stride + m][j * stride + n] * ker[m][n];
            out[i][j] = s;
        }
    return out;
}

int main() {
    vector<vector<double>> img(5, {0, 0, 10, 10, 10});
    vector<vector<double>> edge(3, {-1, 0, 1});
    auto fm = conv2d(img, edge, 1);
    for (auto& row : fm) {
        for (double v : row) std::printf("%6.1f", v);
        std::printf("\n");
    }
    return 0;
}
```
