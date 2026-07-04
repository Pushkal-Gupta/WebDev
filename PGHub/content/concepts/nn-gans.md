---
slug: nn-gans
module: neural-networks
title: Generative Adversarial Nets
subtitle: Two networks locked in a forgery contest — a generator faking data and a discriminator catching fakes — until the fakes are indistinguishable from real.
difficulty: Advanced
position: 12
estimatedReadMinutes: 15
prereqs: [nn-backpropagation, nn-optimizers]
relatedProblems: []
references:
  - title: "Goodfellow et al. — Generative Adversarial Networks"
    url: "https://arxiv.org/abs/1406.2661"
    type: paper
  - title: "Radford et al. — Unsupervised Representation Learning with DCGANs"
    url: "https://arxiv.org/abs/1511.06434"
    type: paper
  - title: "Arjovsky et al. — Wasserstein GAN"
    url: "https://arxiv.org/abs/1701.07875"
    type: paper
  - title: "Google Developers — Generative Adversarial Networks course intro"
    url: "https://developers.google.com/machine-learning/gan"
    type: article
status: published
---

## intro
A generative adversarial network trains two networks against each other. The **generator** takes a vector of random noise and maps it to a sample — an image, a waveform, a row of tabular data — trying to produce something that looks like it came from the real dataset. The **discriminator** is a classifier that sees a mix of real samples and the generator's fakes and tries to tell which is which. Their objectives are exactly opposed: every time the discriminator gets better at spotting fakes, the generator is pushed to make more convincing ones, and every improvement in the generator forces the discriminator to sharpen. There is no fixed target to regress toward and no likelihood to maximize directly; the learning signal for the generator comes entirely from the gradients of an adversary that is itself learning. Trained to equilibrium, the generator's samples become statistically indistinguishable from real data.

## whyItMatters
Before GANs, generating realistic high-dimensional data meant either modeling an explicit probability density — which forces restrictive architectural choices so the likelihood stays tractable — or accepting blurry, averaged-out samples from models trained on pixel-wise reconstruction. GANs sidestep both problems by never writing down a density at all: they learn to *sample* directly, judged only by whether an adversary can tell the samples apart from real data. That shift unlocked photorealistic image synthesis, super-resolution, image-to-image translation, style transfer, data augmentation for scarce medical datasets, and the whole "deepfake" family of tools. The adversarial idea also reaches far past images — it shows up in domain adaptation, in imitation learning, and in privacy-preserving synthetic data. Understanding GANs teaches something deeper than one architecture: it teaches how to define a learning objective through a *game* between models rather than a fixed loss, an idea that recurs across modern machine learning. Their notorious training instability is equally instructive about what makes optimization hard.

## intuition
Picture a counterfeiter and a detective. The **counterfeiter** (the generator) prints fake banknotes and wants them to pass as real. The **detective** (the discriminator) inspects notes — some genuine from the bank, some forged — and tries to flag every fake. At the start the counterfeiter is hopeless: the forgeries are crude and the detective catches them instantly. But the detective's rejections are informative. Each caught fake tells the counterfeiter *which* features gave it away, and the counterfeiter adjusts. As the forgeries improve, the detective can no longer rely on obvious tells and must study finer and finer details, which in turn pushes the counterfeiter to reproduce those details too. The two escalate together, each one's progress raising the bar for the other.

The crucial part is that neither network is handed the answer. The counterfeiter is never shown a real banknote to copy pixel by pixel; it only ever receives the detective's verdict — a single scalar signal of "how real did that look" — and follows the gradient of that signal back through its own weights. This is why GANs can produce *novel* samples rather than memorized copies: the generator is learning the whole distribution that fools the detective, not one example.

Formally, the generator induces a distribution \(p_g\) over samples — push noise \(z\) through the network and you get a sample, so the network defines an implicit distribution. Training drives \(p_g\) toward the true data distribution \(p_{data}\). When the two distributions coincide, the detective's job becomes impossible: a real and a fake sample are drawn from the same distribution, so the best it can do is guess, outputting \(0.5\) everywhere. That state — generator matched to the data, discriminator maximally uncertain — is the equilibrium the game is designed to reach.

## visualization
```
       noise z ~ p_z
           |
           v
     +-----------+          fake x_g
     | GENERATOR | -------------------+
     +-----------+                    |
           ^                          v
           | gradient           +---------------+     score in [0,1]
           | "make it           | DISCRIMINATOR | --> D(x): real? fake?
           |  look real"        +---------------+
           |                          ^
           +--------------------------+
                    real x ~ p_data ---+  (also fed to D)

  distribution view, p_g creeping toward p_data over rounds:

    round 0   real:  ....####....     fake:  ##..........   (far apart, D wins)
    round 4   real:  ....####....     fake:  ...##.....     (closing in)
    round 9   real:  ....####....     fake:  ...###....     (nearly matched)
    round 15  real:  ....####....     fake:  ....####...    (overlap -> D ~ 0.5)
```

## bruteForce
The obvious way to build a generative model is **explicit maximum-likelihood density estimation**: choose a parametric family \(p_\theta(x)\), then adjust \(\theta\) to maximize the likelihood of the training data. This works cleanly for simple models, but on high-dimensional data like images it forces a painful trade-off. To keep the likelihood tractable you must either restrict the architecture so the normalizing constant stays computable (autoregressive models that generate one pixel at a time, painfully slowly, or normalizing flows that constrain every layer to be invertible), or you optimize a *lower bound* instead of the true likelihood (as a variational autoencoder does), which in practice pushes the model toward blurry, over-smoothed samples because a pixel-wise reconstruction loss rewards hedging toward the mean. In every case you are paying a heavy price to make the density function explicit and normalized. The insight behind GANs is that you rarely *need* the density — you only need to draw samples from it. Dropping the requirement to evaluate \(p_g(x)\) and replacing it with an implicit, adversarially-defined objective removes the tractability constraints entirely and is what lets the generator produce sharp, realistic samples.

## optimal
GANs replace the explicit likelihood with a two-player **minimax game**. The discriminator \(D\) outputs the probability a sample is real; the generator \(G\) maps noise \(z\sim p_z\) to samples. They optimize opposite ends of one value function:
\[ \min_G \max_D V(D,G)=\mathbb{E}_{x\sim p_{data}}[\log D(x)] + \mathbb{E}_{z\sim p_z}[\log(1-D(G(z)))] \]
Read it as two jobs. \(D\) wants \(\log D(x)\) large on real data (call real samples real) and \(\log(1-D(G(z)))\) large on fakes (call generated samples fake). \(G\) wants the *opposite* of that second term — it wants \(D(G(z))\) close to 1 so its fakes are believed. Hold \(G\) fixed and solve for the best discriminator: the optimum is
\[ D^*(x)=\frac{p_{data}(x)}{p_{data}(x)+p_g(x)}. \]
This has a clean reading — the ideal detective just reports the *proportion* of real mass at each point. Substitute \(D^*\) back into \(V\) and the generator's objective becomes minimizing the Jensen–Shannon divergence between \(p_g\) and \(p_{data}\); it is globally minimized exactly when \(p_g = p_{data}\), at which point \(D^*(x)=\tfrac12\) everywhere. That is the equilibrium: the fakes match the data and the discriminator is reduced to a coin flip.

One practical wrinkle: early in training \(D\) easily rejects \(G\)'s fakes, so \(\log(1-D(G(z)))\) saturates and its gradient for \(G\) vanishes. The standard fix is the **non-saturating loss** — instead of minimizing \(\log(1-D(G(z)))\), the generator *maximizes* \(\log D(G(z))\). It has the same fixed point but delivers strong gradients precisely when the generator is losing, which is exactly when it needs them. The two networks are then trained by alternating stochastic gradient steps, often several \(D\) updates per \(G\) update to keep the discriminator a useful teacher without letting it become perfect.

```python
import math

# Optimal discriminator D*(x) = p_data / (p_data + p_g) for two 1D Gaussians,
# and the resulting cross-entropy the discriminator achieves.
def gauss(x, mu, sigma):
    return math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * math.sqrt(2 * math.pi))

def d_star(x, mu_data, mu_g, sigma=1.0):
    pd, pg = gauss(x, mu_data, sigma), gauss(x, mu_g, sigma)
    return pd / (pd + pg + 1e-12)

for gap in [4.0, 2.0, 0.5, 0.0]:            # generator mean approaches data mean (0)
    d_on_real = d_star(0.0, 0.0, gap)       # D* evaluated on the data mode
    print(f"gap={gap:>4}  D*(data mode)={d_on_real:.3f}")
# As the gap shrinks to 0, D*(x) -> 0.5 everywhere: the discriminator can no longer tell them apart.
```

## complexity
time: O(P_D + P_G) per training step, where P_D and P_G are the discriminator and generator parameter counts — a step is a forward/backward pass through each network, identical in cost to training any two feed-forward nets. Convergence is measured in steps, and GANs typically need many because the target (the adversary) keeps moving; there is no monotone loss to watch descend.
space: O(P_D + P_G) for the weights plus their optimizer state (Adam adds two moment buffers per parameter), plus activations for the minibatch during backprop. No stored density and no explicit likelihood table.
notes: The per-step cost is unremarkable; the real cost is *instability* — the game may oscillate, collapse, or diverge, so wall-clock time to a good model is dominated by restarts, hyperparameter search, and heuristics (spectral normalization, TTUR) rather than raw arithmetic.

## pitfalls
- **Mode collapse.** The generator discovers one output (or a few) that reliably fools the current discriminator and pumps out only that, ignoring whole regions of \(p_{data}\) — every sample looks the same. The fix: **minibatch discrimination** or **feature matching** so the generator is penalized for low sample diversity, or use an **unrolled** GAN objective that lets \(G\) anticipate \(D\)'s response instead of chasing a single blind spot.
- **Non-convergence / oscillation.** Because the two objectives are opposed, the parameters can circle a fixed point forever without settling — samples visibly cycle through modes rather than improving. The fix: the **two-timescale update rule (TTUR)** with a higher discriminator learning rate, **spectral normalization** on \(D\) to bound its Lipschitz constant, and Adam with a low \(\beta_1\) to damp the oscillation.
- **Vanishing generator gradient when D is too strong.** If the discriminator becomes near-perfect, \(\log(1-D(G(z)))\) saturates and \(G\) receives almost no gradient, stalling completely. The fix: train with the **non-saturating loss** (maximize \(\log D(G(z))\)), and don't over-train \(D\) between \(G\) steps — or switch to **WGAN**, whose critic gives usable gradients even when the distributions barely overlap.
- **Extreme hyperparameter sensitivity.** GANs can go from photorealistic to garbage with a small learning-rate change, an unbalanced update ratio, or the wrong batch normalization placement. The fix: adopt a **proven recipe** (DCGAN architectural guidelines, WGAN-GP gradient penalty, equal or two-timescale learning rates), change one thing at a time, and monitor a real metric like **FID** rather than eyeballing the loss curves, which are nearly uninformative for GANs.

## interviewTips
- Explain the objective as a game, not a loss: write the minimax value function, then derive \(D^*(x)=\frac{p_{data}}{p_{data}+p_g}\) and show that plugging it back in leaves the generator minimizing Jensen–Shannon divergence, minimized when \(p_g=p_{data}\). Deriving the fixed point beats reciting it.
- Be ready to explain the non-saturating trick: the original generator loss \(\log(1-D(G(z)))\) has vanishing gradient exactly when \(G\) is bad, so in practice \(G\) maximizes \(\log D(G(z))\) — same optimum, strong gradients early. Interviewers probe whether you know why the "textbook" loss is not the one people use.
- Name mode collapse as the signature failure and connect the fixes to their causes: feature matching / minibatch discrimination for diversity, TTUR and spectral normalization for stability, and WGAN's Earth-Mover distance for meaningful gradients when supports don't overlap. Mentioning FID as the evaluation metric signals real experience.

## keyTakeaways
- A GAN pits a generator that turns noise into samples against a discriminator that classifies real vs. fake; training is a minimax game, not minimization of a fixed loss, and its signal for \(G\) comes only from the adversary's gradients.
- The optimal discriminator is \(D^*(x)=\frac{p_{data}(x)}{p_{data}(x)+p_g(x)}\); at equilibrium \(p_g=p_{data}\) and \(D^*\equiv\tfrac12\), so the generator has matched the data distribution and the discriminator can only guess.
- The dominant practical problems are mode collapse and unstable, oscillating training; the standard remedies are the non-saturating loss, feature matching, spectral normalization, TTUR, and Wasserstein (WGAN) objectives — plus evaluating with FID, since the loss curves are uninformative.

## code.python
```python
import math

# A 1D toy GAN with closed-form updates. Data ~ N(mu_data, 1). The generator is
# G(z) = mu_g + z (z ~ N(0,1)), so p_g = N(mu_g, 1); we learn the scalar mu_g.
# The discriminator is logistic: D(x) = sigmoid(w*x + b), trained by gradient
# ascent on the GAN value function; the generator uses the non-saturating loss.
# Deterministic: an LCG supplies all randomness so the run is reproducible.

def make_rng(seed):
    state = seed & 0xFFFFFFFF
    def rand():
        nonlocal state
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        return state / 0x7FFFFFFF
    return rand

def randn(rand):                       # Box-Muller from two uniforms
    u1 = max(rand(), 1e-12); u2 = rand()
    return math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-max(min(z, 30.0), -30.0)))

rand = make_rng(12345)
MU_DATA = 3.0
mu_g, w, b = 0.0, 0.0, 0.0             # generator mean and discriminator weights
lr_d, lr_g, batch = 0.05, 0.08, 64

for step in range(4000):
    # sample a real batch and a fake batch
    reals = [MU_DATA + randn(rand) for _ in range(batch)]
    zs = [randn(rand) for _ in range(batch)]
    fakes = [mu_g + z for z in zs]

    # --- discriminator ascends V: wants D(real)->1, D(fake)->0 ---
    gw = gb = 0.0
    for x in reals:
        d = sigmoid(w * x + b); gw += (1 - d) * x; gb += (1 - d)
    for x in fakes:
        d = sigmoid(w * x + b); gw += -d * x; gb += -d
    w += lr_d * gw / (2 * batch); b += lr_d * gb / (2 * batch)

    # --- generator (non-saturating): maximize log D(G(z)), mu_g via chain rule ---
    gmu = 0.0
    for z in zs:
        x = mu_g + z; d = sigmoid(w * x + b); gmu += (1 - d) * w
    mu_g += lr_g * gmu / batch

    if step % 800 == 0:
        print(f"step {step:4d}  mu_g={mu_g:6.3f}  (target {MU_DATA})")

print(f"final mu_g={mu_g:.3f}  target={MU_DATA}  |gap|={abs(mu_g - MU_DATA):.3f}")
```

## code.javascript
```javascript
// 1D toy GAN: data ~ N(mu_data,1); generator G(z)=mu_g+z learns the scalar mu_g;
// logistic discriminator D(x)=sigmoid(w*x+b). Generator uses the non-saturating
// loss. Deterministic via an LCG so the convergence is reproducible.

function makeRng(seed) {
  let state = seed >>> 0;
  return () => { state = (1103515245 * state + 12345) & 0x7fffffff; return state / 0x7fffffff; };
}
function randn(rand) {
  const u1 = Math.max(rand(), 1e-12), u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
const sigmoid = z => 1 / (1 + Math.exp(-Math.max(Math.min(z, 30), -30)));

const rand = makeRng(12345);
const MU_DATA = 3.0;
let muG = 0, w = 0, b = 0;
const lrD = 0.05, lrG = 0.08, batch = 64;

for (let step = 0; step < 4000; step++) {
  const reals = Array.from({ length: batch }, () => MU_DATA + randn(rand));
  const zs = Array.from({ length: batch }, () => randn(rand));
  const fakes = zs.map(z => muG + z);

  let gw = 0, gb = 0;
  for (const x of reals) { const d = sigmoid(w * x + b); gw += (1 - d) * x; gb += (1 - d); }
  for (const x of fakes) { const d = sigmoid(w * x + b); gw += -d * x; gb += -d; }
  w += lrD * gw / (2 * batch); b += lrD * gb / (2 * batch);

  let gmu = 0;
  for (const z of zs) { const x = muG + z; const d = sigmoid(w * x + b); gmu += (1 - d) * w; }
  muG += lrG * gmu / batch;

  if (step % 800 === 0) console.log(`step ${step}  muG=${muG.toFixed(3)}  (target ${MU_DATA})`);
}
console.log(`final muG=${muG.toFixed(3)}  target=${MU_DATA}  |gap|=${Math.abs(muG - MU_DATA).toFixed(3)}`);
```

## code.java
```java
public class ToyGan {
    static long state;
    static double rand() { state = (1103515245L * state + 12345L) & 0x7fffffffL; return state / (double) 0x7fffffffL; }
    static double randn() {
        double u1 = Math.max(rand(), 1e-12), u2 = rand();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    static double sigmoid(double z) { return 1.0 / (1.0 + Math.exp(-Math.max(Math.min(z, 30), -30))); }

    public static void main(String[] args) {
        state = 12345L;
        final double MU_DATA = 3.0;
        double muG = 0, w = 0, b = 0;
        double lrD = 0.05, lrG = 0.08; int batch = 64;

        for (int step = 0; step < 4000; step++) {
            double[] reals = new double[batch], zs = new double[batch], fakes = new double[batch];
            for (int i = 0; i < batch; i++) reals[i] = MU_DATA + randn();
            for (int i = 0; i < batch; i++) { zs[i] = randn(); fakes[i] = muG + zs[i]; }

            double gw = 0, gb = 0;
            for (double x : reals) { double d = sigmoid(w * x + b); gw += (1 - d) * x; gb += (1 - d); }
            for (double x : fakes) { double d = sigmoid(w * x + b); gw += -d * x; gb += -d; }
            w += lrD * gw / (2 * batch); b += lrD * gb / (2 * batch);

            double gmu = 0;
            for (double z : zs) { double x = muG + z; double d = sigmoid(w * x + b); gmu += (1 - d) * w; }
            muG += lrG * gmu / batch;

            if (step % 800 == 0)
                System.out.printf("step %4d  muG=%6.3f  (target %.1f)%n", step, muG, MU_DATA);
        }
        System.out.printf("final muG=%.3f  target=%.1f  |gap|=%.3f%n", muG, MU_DATA, Math.abs(muG - MU_DATA));
    }
}
```

## code.cpp
```cpp
#include <cstdio>
#include <cmath>
#include <algorithm>

static unsigned long long g_state;
double rnd() { g_state = (1103515245ULL * g_state + 12345ULL) & 0x7fffffffULL; return g_state / (double) 0x7fffffffULL; }
double randn() {
    double u1 = std::max(rnd(), 1e-12), u2 = rnd();
    return std::sqrt(-2 * std::log(u1)) * std::cos(2 * M_PI * u2);
}
double sigmoid(double z) { return 1.0 / (1.0 + std::exp(-std::max(std::min(z, 30.0), -30.0))); }

int main() {
    g_state = 12345ULL;
    const double MU_DATA = 3.0;
    double muG = 0, w = 0, b = 0;
    double lrD = 0.05, lrG = 0.08; int batch = 64;

    for (int step = 0; step < 4000; step++) {
        double reals[64], zs[64], fakes[64];
        for (int i = 0; i < batch; i++) reals[i] = MU_DATA + randn();
        for (int i = 0; i < batch; i++) { zs[i] = randn(); fakes[i] = muG + zs[i]; }

        double gw = 0, gb = 0;
        for (int i = 0; i < batch; i++) { double d = sigmoid(w * reals[i] + b); gw += (1 - d) * reals[i]; gb += (1 - d); }
        for (int i = 0; i < batch; i++) { double d = sigmoid(w * fakes[i] + b); gw += -d * fakes[i]; gb += -d; }
        w += lrD * gw / (2 * batch); b += lrD * gb / (2 * batch);

        double gmu = 0;
        for (int i = 0; i < batch; i++) { double x = muG + zs[i]; double d = sigmoid(w * x + b); gmu += (1 - d) * w; }
        muG += lrG * gmu / batch;

        if (step % 800 == 0)
            std::printf("step %4d  muG=%6.3f  (target %.1f)\n", step, muG, MU_DATA);
    }
    std::printf("final muG=%.3f  target=%.1f  |gap|=%.3f\n", muG, MU_DATA, std::fabs(muG - MU_DATA));
    return 0;
}
```
