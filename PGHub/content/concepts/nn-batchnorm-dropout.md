---
slug: nn-batchnorm-dropout
module: neural-networks
title: Batch Norm & Dropout
subtitle: Two cheap layers that keep deep networks trainable — one steadies the signal, the other stops neurons from memorizing.
difficulty: Intermediate
position: 10
estimatedReadMinutes: 14
prereqs: [nn-backpropagation, nn-gradient-descent]
relatedProblems: []
references:
  - title: "Ioffe & Szegedy — Batch Normalization: Accelerating Deep Network Training"
    url: "https://arxiv.org/abs/1502.03167"
    type: paper
  - title: "Srivastava et al. — Dropout: A Simple Way to Prevent Overfitting (JMLR 2014)"
    url: "https://jmlr.org/papers/v15/srivastava14a.html"
    type: paper
  - title: "Andrej Karpathy — Building makemore Part 3 (BatchNorm from scratch)"
    url: "https://www.youtube.com/watch?v=P6sfmUTpUmc"
    type: video
  - title: "Santurkar et al. — How Does Batch Normalization Help Optimization?"
    url: "https://arxiv.org/abs/1805.11604"
    type: paper
status: published
---

## intro
Deep networks are fragile in two directions. As a signal flows forward through many layers, the distribution of each layer's inputs drifts and stretches, so a learning rate that was safe at the start becomes explosive or dead a few layers deeper. And as a network grows large relative to its data, it starts memorizing training examples instead of learning patterns that generalize. Batch normalization and dropout are the two cheap, ubiquitous layers that address these problems directly. Batch norm rescales each layer's activations back to a controlled distribution every step so gradients stay well-behaved; dropout randomly silences neurons during training so no single unit can become a crutch. Both are a few lines of code, add negligible compute, and turned "deep learning" from a fragile art into something that trains reliably.

## whyItMatters
Before batch norm, training a network more than a handful of layers deep meant babysitting the learning rate and initialization by hand, and even then the loss often stalled or diverged. Batch norm let practitioners crank the learning rate up by an order of magnitude, care far less about exactly how weights were initialized, and train much deeper stacks — it is one of the components that made architectures like ResNet practical. Dropout, in the same era, was the regularizer that let over-parameterized networks stop overfitting without a mountain of extra data; it single-handedly closed much of the train/test gap on the vision and speech benchmarks of its day. Every modern training recipe still reaches for one or both (or their descendants: layer norm in transformers, stochastic depth, DropPath). Understanding what they actually do to the activations and gradients — not just where to type the layer — is what lets you debug a network that trains fine but generalizes badly, or one whose loss is fine in training mode but garbage at inference.

## intuition
Think of a deep network as a bucket brigade passing a signal down a line. **Batch norm** is the person at each station who, before passing the bucket on, always refills it to the same level and stirs it to the same temperature. Downstream stations no longer have to cope with a bucket that is sometimes overflowing and sometimes nearly empty — the input they see is always in a familiar range. Concretely, for each feature (each neuron's output) batch norm looks across the current minibatch, computes that feature's mean and variance, and subtracts the mean and divides by the standard deviation. Now every feature arrives centered at zero with unit spread, regardless of what the previous layers did. That is the whole stabilizing trick: keep the input distribution to each layer roughly fixed so the layer never has to chase a moving target, and so gradients neither vanish into a flat region nor blow up.

But forcing every feature to zero-mean/unit-variance is too rigid — sometimes a feature genuinely *should* be shifted or scaled, and a hard normalization would throw away useful signal (imagine forcing the input to a sigmoid to always sit in its linear middle). So batch norm adds two **learnable** parameters per feature, a scale \(\gamma\) and a shift \(\beta\), applied after normalizing. The network can learn to undo the normalization if that helps, or to pick any other mean and spread it likes — but it starts from a clean, standardized baseline.

**Dropout** attacks a completely different problem: co-adaptation. In a big network, neurons form fragile committees where unit A only works because unit B always fires alongside it — brittle partnerships that memorize the training set. Dropout breaks these up by, on every training step, flipping a coin for each neuron and zeroing it with probability \(p\). Because any neuron might vanish at any step, no unit can rely on a specific partner being present; each must learn a feature that is useful on its own. The side effect is that every forward pass uses a different random sub-network, so training with dropout is like training an exponential ensemble of thinned networks that share weights — and averaging an ensemble is a classic way to reduce overfitting.

## visualization
```
BATCH NORM  (per feature, across the batch)
  raw x:    12.4   9.1   14.8   7.7   11.0     mean = 11.0   std = 2.6
                |  subtract mean, divide by std (+ eps)
  x_hat:    +0.54 -0.73 +1.46 -1.27 +0.00     mean =  0.0   std = 1.0
                |  apply learnable scale gamma, shift beta
  y = g*x_hat + b   ->  network picks the final mean/spread it wants

DROPOUT  (per neuron, p = 0.4 kept-mask, train time only)
  neurons:  n0   n1   n2   n3   n4   n5   n6   n7
  mask:      1    0    1    1    0    1    0    1     (0 = dropped)
  scale:   1/(1-p) = 1.667 applied to survivors  (inverted dropout)
  test time:  no mask, no scale — full network, deterministic
```

## bruteForce
The naive way to keep activations in range is to tune it away by hand: pick a careful weight initialization (Xavier/He), pick a small learning rate, and hope the signal neither saturates nor dies across the depth of the network. This works for shallow nets but scales terribly — the "right" learning rate for a 50-layer network is a razor's edge, and it shifts as training progresses because the weights (and therefore the activation statistics) keep changing. The naive way to fight overfitting is likewise blunt: collect more data, or shrink the model until it can no longer memorize. Both cost you capacity or money, and neither adapts during training. These baselines are not wrong — good initialization still matters — but they push all the burden onto the human, are static, and break down exactly when the network gets deep and wide enough to be interesting. Batch norm and dropout replace the manual babysitting with cheap adaptive layers.

## optimal
**Batch norm forward pass.** For a minibatch of \(m\) examples and a given feature, compute the batch statistics, normalize, then apply the learnable affine transform:
\[
\mu_B = \frac{1}{m}\sum_{i=1}^{m} x_i,\qquad
\sigma_B^2 = \frac{1}{m}\sum_{i=1}^{m} (x_i - \mu_B)^2,
\]
\[
\hat x_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \varepsilon}},\qquad
y_i = \gamma\,\hat x_i + \beta.
\]
The \(\varepsilon\) (typically \(10^{-5}\)) guards against dividing by zero when a feature is constant across the batch. Crucially, \(\mu_B\) and \(\sigma_B^2\) depend on the *whole batch*, so gradients flow back through the statistics too — the network cannot cheat by exploding one example. **At inference** you usually have no batch (or want deterministic outputs), so you cannot use batch statistics. Instead, during training you keep an exponential running average of the mean and variance, \(\mu_{run} \leftarrow (1-\alpha)\mu_{run} + \alpha\mu_B\), and at test time normalize with those frozen population estimates. Forgetting to switch to running stats is the single most common batch-norm bug.

Why does it help so much? The original "internal covariate shift" story — that batch norm helps by keeping each layer's input distribution fixed — is intuitive but contested. Later work (Santurkar et al.) showed the bigger effect is that batch norm *smooths the loss landscape*: it makes the gradients more predictable and Lipschitz, so larger steps are safe and optimization is easier. Either way the practical payoff is real: higher learning rates, faster convergence, and less sensitivity to initialization.

**Dropout.** During training, sample a mask \(r_j \sim \text{Bernoulli}(1-p)\) per neuron and apply it, then rescale so the expected activation is unchanged (inverted dropout):
\[
\tilde a_j = \frac{r_j}{1-p}\, a_j,\qquad \mathbb{E}[\tilde a_j] = a_j.
\]
The \(1/(1-p)\) factor means test time needs no adjustment: you just remove the mask and run the full network. **Ordering matters** when combining them — the common recipe is Linear → BatchNorm → activation → Dropout. Placing dropout *before* batch norm is discouraged, because the random zeroing shifts the batch variance that BN then measures, so the training-time and inference-time statistics disagree (the "variance shift" problem); many modern nets therefore use one or the other rather than stacking both.

```python
import numpy as np

rng = np.random.default_rng(0)          # seeded -> deterministic output
x = np.array([12.4, 9.1, 14.8, 7.7, 11.0])
mu, var = x.mean(), x.var()
x_hat = (x - mu) / np.sqrt(var + 1e-5)  # zero-mean, unit-var
y = 1.0 * x_hat + 0.0                    # gamma=1, beta=0
print("normed:", np.round(x_hat, 3), "-> mean", round(x_hat.mean(), 3))

p = 0.4
mask = (rng.random(x.size) > p).astype(float)  # keep with prob 1-p
dropped = y * mask / (1 - p)             # inverted dropout scale
print("kept:", int(mask.sum()), "of", x.size, "->", np.round(dropped, 3))
```

## complexity
time: O(m·d) for a batch-norm layer over a batch of m examples with d features — one pass to compute per-feature mean and variance, one pass to normalize and scale. Dropout is O(m·d): one Bernoulli draw and one multiply per activation. Both are trivial next to the matrix multiplies of the surrounding layers.
space: O(d) extra parameters and running buffers for batch norm (gamma, beta, running mean, running var — four length-d vectors). Dropout stores one mask of size O(m·d) during a training step for the backward pass, and zero extra parameters. Neither adds meaningful memory versus the weights.
notes: Both are elementwise/reduction operations, so per-step cost is dominated by the layer's GEMM, not the normalization. Batch norm's cost is the same order in train and inference; its behavior differs (batch stats vs running stats). Dropout is a no-op at inference — the mask is dropped entirely.

## pitfalls
- Leaving the model in train mode at inference. Batch norm will use the current batch's statistics and dropout will keep zeroing neurons, so predictions become batch-dependent and noisy. The fix: call the framework's eval/inference switch (`model.eval()` in PyTorch, `training=False` in Keras) so BN uses running stats and dropout becomes identity.
- Batch norm with a tiny batch size. With a batch of 1–2, the per-feature variance estimate is garbage and training destabilizes. The fix: use a larger batch, or switch to a batch-independent normalizer (layer norm, group norm) when batches must be small — this is why transformers use layer norm.
- Double-scaling dropout. Applying the \(1/(1-p)\) factor at both train and test (or at neither) rescales the whole network's outputs. The fix: pick inverted dropout — scale by \(1/(1-p)\) at train time only — and do nothing at test time.
- Stacking Dropout before BatchNorm. The random zeroing changes the variance BN measures, so train-time and running (inference) statistics disagree and accuracy drops. The fix: order as Linear → BN → activation → Dropout, or use just one of the two.
- Applying dropout to the wrong probability. Setting p as the keep-probability in a framework that expects the drop-probability (or vice versa) silently trains the wrong network. The fix: check the API — most define p as the *drop* rate, so p=0.5 drops half the units.

## interviewTips
- Be able to write the batch-norm forward pass from memory — mean, variance, normalize with epsilon, then the learnable gamma/beta — and immediately explain why gamma/beta exist (so the layer can recover any distribution it wants, including undoing the normalization).
- State the train-versus-inference difference crisply: BN uses batch statistics during training and a running average at inference; dropout randomly zeroes-and-rescales during training and is the identity at inference. Interviewers probe this because it is the most common real-world bug.
- Know the modern nuance: the "internal covariate shift" motivation is debated, the better-supported explanation is loss-landscape smoothing; and transformers prefer layer norm over batch norm because it does not depend on batch size or batch statistics.

## keyTakeaways
- Batch norm normalizes each feature across the minibatch to zero-mean/unit-variance, then applies a learnable scale and shift; it uses batch stats in training and a running average at inference, which stabilizes gradients and lets you train deeper with higher learning rates.
- Dropout randomly zeroes each neuron with probability p during training and rescales survivors by 1/(1-p) (inverted dropout), so test time is the full deterministic network; it breaks co-adaptation and acts like averaging an ensemble of thinned sub-networks.
- Both are cheap elementwise layers, but they change behavior between train and eval mode — forgetting to flip that switch, using BN with tiny batches, or stacking dropout before BN are the classic bugs.

## code.python
```python
import numpy as np

rng = np.random.default_rng(42)   # seed -> deterministic, reproducible output

def batchnorm_forward(x, gamma, beta, eps=1e-5):
    mu = x.mean(axis=0)                       # per-feature mean across batch
    var = x.var(axis=0)                       # per-feature variance
    x_hat = (x - mu) / np.sqrt(var + eps)     # normalize to ~N(0,1)
    return gamma * x_hat + beta, mu, var

def dropout_forward(a, p, rng):
    mask = (rng.random(a.shape) > p) / (1 - p)  # inverted dropout: keep+rescale
    return a * mask, mask

# Batch of 6 examples, 4 features, deliberately off-center and wide.
x = np.array([[12., 3., -5., 40.],
              [ 9., 4., -6., 55.],
              [14., 2., -4., 33.],
              [ 8., 5., -7., 60.],
              [11., 3., -5., 48.],
              [10., 4., -6., 44.]])
gamma, beta = np.ones(4), np.zeros(4)

y, mu, var = batchnorm_forward(x, gamma, beta)
print("pre-BN  mean:", np.round(mu, 2))
print("post-BN mean:", np.round(y.mean(axis=0), 3), "std:", np.round(y.std(axis=0), 3))

dropped, mask = dropout_forward(y, p=0.4, rng=rng)
kept = int((mask > 0).sum())
print("dropout kept", kept, "of", y.size, "activations")
```

## code.javascript
```javascript
// Deterministic PRNG (mulberry32) so the dropout mask is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function batchnorm(x, gamma, beta, eps = 1e-5) {
  const m = x.length, d = x[0].length;
  const mu = Array(d).fill(0), varr = Array(d).fill(0);
  for (const row of x) for (let j = 0; j < d; j++) mu[j] += row[j] / m;
  for (const row of x) for (let j = 0; j < d; j++) varr[j] += (row[j] - mu[j]) ** 2 / m;
  return x.map(row => row.map((v, j) =>
    gamma[j] * (v - mu[j]) / Math.sqrt(varr[j] + eps) + beta[j]));
}

const rand = mulberry32(42);
const x = [[12, 3, -5, 40], [9, 4, -6, 55], [14, 2, -4, 33],
           [8, 5, -7, 60], [11, 3, -5, 48], [10, 4, -6, 44]];
const gamma = [1, 1, 1, 1], beta = [0, 0, 0, 0];

const y = batchnorm(x, gamma, beta);
const d = y[0].length;
const outMean = Array(d).fill(0);
for (const row of y) for (let j = 0; j < d; j++) outMean[j] += row[j] / y.length;
console.log('post-BN mean:', outMean.map(v => +v.toFixed(3)));

const p = 0.4;
let kept = 0, total = 0;
const dropped = y.map(row => row.map(v => {
  total++;
  const keep = rand() > p ? 1 : 0;
  kept += keep;
  return v * keep / (1 - p);   // inverted dropout
}));
console.log('dropout kept', kept, 'of', total, 'activations');
```

## code.java
```java
public class BatchNormDropout {
    // Deterministic PRNG so the dropout mask is reproducible.
    static long state = 42L;
    static double rand() {
        state ^= (state << 13); state ^= (state >>> 7); state ^= (state << 17);
        return ((state >>> 11) & ((1L << 53) - 1)) / (double) (1L << 53);
    }

    static double[][] batchnorm(double[][] x, double[] g, double[] b, double eps) {
        int m = x.length, d = x[0].length;
        double[] mu = new double[d], var = new double[d];
        for (double[] row : x) for (int j = 0; j < d; j++) mu[j] += row[j] / m;
        for (double[] row : x) for (int j = 0; j < d; j++) var[j] += Math.pow(row[j] - mu[j], 2) / m;
        double[][] y = new double[m][d];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < d; j++)
                y[i][j] = g[j] * (x[i][j] - mu[j]) / Math.sqrt(var[j] + eps) + b[j];
        return y;
    }

    public static void main(String[] args) {
        double[][] x = {{12, 3, -5, 40}, {9, 4, -6, 55}, {14, 2, -4, 33},
                        {8, 5, -7, 60}, {11, 3, -5, 48}, {10, 4, -6, 44}};
        double[] g = {1, 1, 1, 1}, b = {0, 0, 0, 0};
        double[][] y = batchnorm(x, g, b, 1e-5);

        int d = y[0].length;
        double[] mean = new double[d];
        for (double[] row : y) for (int j = 0; j < d; j++) mean[j] += row[j] / y.length;
        System.out.printf("post-BN mean: [%.3f %.3f %.3f %.3f]%n", mean[0], mean[1], mean[2], mean[3]);

        double p = 0.4;
        int kept = 0, total = 0;
        for (double[] row : y)
            for (int j = 0; j < d; j++) {
                total++;
                if (rand() > p) kept++;              // inverted dropout keeps with prob 1-p
            }
        System.out.println("dropout kept " + kept + " of " + total + " activations");
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <vector>
using namespace std;

// Deterministic xorshift PRNG so the dropout mask is reproducible.
static unsigned long long st = 42ULL;
double rnd() {
    st ^= st << 13; st ^= st >> 7; st ^= st << 17;
    return ((st >> 11) & ((1ULL << 53) - 1)) / (double)(1ULL << 53);
}

int main() {
    vector<vector<double>> x = {{12,3,-5,40},{9,4,-6,55},{14,2,-4,33},
                                {8,5,-7,60},{11,3,-5,48},{10,4,-6,44}};
    int m = x.size(), d = x[0].size();
    vector<double> mu(d, 0), var(d, 0), g(d, 1), b(d, 0);
    for (auto& row : x) for (int j = 0; j < d; j++) mu[j] += row[j] / m;
    for (auto& row : x) for (int j = 0; j < d; j++) var[j] += pow(row[j] - mu[j], 2) / m;

    vector<vector<double>> y(m, vector<double>(d));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < d; j++)
            y[i][j] = g[j] * (x[i][j] - mu[j]) / sqrt(var[j] + 1e-5) + b[j];

    vector<double> mean(d, 0);
    for (auto& row : y) for (int j = 0; j < d; j++) mean[j] += row[j] / m;
    printf("post-BN mean: [%.3f %.3f %.3f %.3f]\n", mean[0], mean[1], mean[2], mean[3]);

    double p = 0.4;
    int kept = 0, total = 0;
    for (auto& row : y)
        for (int j = 0; j < d; j++) {
            total++;
            if (rnd() > p) kept++;                  // inverted dropout keeps with prob 1-p
        }
    printf("dropout kept %d of %d activations\n", kept, total);
    return 0;
}
```
