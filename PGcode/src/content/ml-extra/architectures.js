export const ARCHITECTURES_EXTRA = [
  {
    slug: 'gan-basics',
    title: 'Generative adversarial networks',
    oneLiner: 'Two networks play a game — one forges samples, the other spots fakes — and the forger gets good.',
    difficulty: 'intermediate',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'A game between a forger and a detective',
        body: `A generative adversarial network turns the problem of "learn to produce realistic data" into a two-player game. One player is the **generator** \\(G\\): it takes a random noise vector \\(z\\) drawn from a simple distribution — usually a standard Gaussian — and maps it to a sample \\(G(z)\\) that should look like it came from the real data. The other player is the **discriminator** \\(D\\): it takes a sample and outputs a single number in \\([0, 1]\\), its estimate of the probability that the sample is real rather than generated.

The two networks are trained against each other. The generator wants \\(D(G(z))\\) close to \\(1\\) — it wants its forgeries judged as real. The discriminator wants \\(D(x)\\) close to \\(1\\) on real data and \\(D(G(z))\\) close to \\(0\\) on fakes. Neither has a fixed target; each one's loss depends on the other's current skill. As the discriminator gets sharper at spotting fakes, the generator is forced to produce better ones, and the cycle repeats.

What makes this idea powerful is that the generator never sees a single real image directly. It only ever receives a gradient routed back through the discriminator — a signal that says "nudge your output in the direction that would have fooled the detective." There is no pixel-wise reconstruction target, no mean-squared error against a specific image. That is exactly why early GANs produced sharp, plausible samples while contemporary autoencoders produced blurry averages: a per-pixel loss rewards hedging toward the mean, an adversarial loss punishes anything that looks even slightly off the data manifold.

The equilibrium you are hoping for is the point where the generator's distribution matches the real data distribution so closely that the best the discriminator can do is guess — outputting \\(0.5\\) on everything. At that point the forger has won, which is the whole goal.`,
      },
      {
        kind: 'math',
        heading: 'The minimax objective',
        body: `The original GAN objective is a single value function that the two players push in opposite directions — the generator minimises it, the discriminator maximises it:

\\[
\\min_G \\max_D \\; \\mathbb{E}_{x \\sim p_{\\text{data}}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]
\\]

Read each term separately. The first, \\(\\mathbb{E}_{x}[\\log D(x)]\\), is large when the discriminator assigns high probability to real samples. The second, \\(\\mathbb{E}_{z}[\\log(1 - D(G(z)))]\\), is large when the discriminator assigns low probability to fakes. The discriminator maximises their sum; the generator can only affect the second term, and it wants to make \\(D(G(z))\\) large — driving \\(\\log(1 - D(G(z)))\\) down.

For a fixed generator, the optimal discriminator has a closed form:

\\[
D^*(x) = \\frac{p_{\\text{data}}(x)}{p_{\\text{data}}(x) + p_g(x)}
\\]

Substitute that back in and the generator's objective becomes minimising the **Jensen-Shannon divergence** between the real distribution \\(p_{\\text{data}}\\) and the generated distribution \\(p_g\\). The global optimum is \\(p_g = p_{\\text{data}}\\), where \\(D^* = \\tfrac{1}{2}\\) everywhere — the detective is reduced to a coin flip.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: the saturating-gradient fix',
        body: `Suppose early in training the generator is terrible, so the discriminator confidently calls every fake a fake: \\(D(G(z)) \\approx 0.05\\). Look at the generator's gradient under the original loss \\(\\log(1 - D(G(z)))\\). The function \\(\\log(1 - d)\\) has derivative \\(-1/(1 - d)\\); at \\(d = 0.05\\) that is \\(-1/0.95 \\approx -1.05\\). The gradient is small precisely when the generator is doing worst — exactly when you most need a strong learning signal. This is the **saturation** problem: the generator gets almost no gradient early on and can stall.

The standard fix is the **non-saturating loss**. Instead of minimising \\(\\log(1 - D(G(z)))\\), the generator maximises \\(\\log D(G(z))\\). Same fixed point — the generator still wants \\(D(G(z))\\) near \\(1\\) — but a different gradient profile. The derivative of \\(\\log d\\) is \\(1/d\\); at \\(d = 0.05\\) that is \\(1/0.05 = 20\\). The gradient is now large exactly when the generator is failing, so it learns fast out of the bad region. Concrete numbers: at \\(d = 0.05\\) the saturating gradient magnitude is \\(1.05\\) while the non-saturating one is \\(20\\) — nearly a 20x stronger signal. Once the generator improves and \\(d\\) climbs toward \\(0.5\\), the two losses behave similarly, so the fix costs nothing later.

This single change — maximise \\(\\log D(G(z))\\) rather than minimise \\(\\log(1 - D(G(z)))\\) — is in nearly every GAN implementation you will ever read, and it is the first thing to check if your generator refuses to learn in the opening epochs.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: one GAN training step',
        body: `# one alternating update of D then G
for x_real in dataloader:                 # x_real: batch of real samples
    z = sample_noise(batch, z_dim)        # z ~ N(0, I)
    x_fake = G(z).detach()                # stop grad into G for the D step

    # --- discriminator step: real -> 1, fake -> 0 ---
    d_loss = -log(D(x_real)) - log(1 - D(x_fake))
    d_loss.backward(); opt_D.step(); opt_D.zero_grad()

    # --- generator step: non-saturating, fake -> 1 ---
    z = sample_noise(batch, z_dim)
    g_loss = -log(D(G(z)))                 # maximise log D(G(z))
    g_loss.backward(); opt_G.step(); opt_G.zero_grad()

# tip: keep D and G roughly balanced; if D wins instantly, G never learns.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: ignoring mode collapse.** A GAN can drive its loss down while the generator only ever produces one or a few outputs — say, the single most convincing digit instead of all ten. The discriminator is fooled, the loss looks fine, but the generator has collapsed onto a narrow slice of the data. The minimax loss does **not** directly penalise this: matching one mode perfectly can fool a discriminator that has not yet learned to count modes. Watch sample diversity, not just the loss curve. Fixes include minibatch discrimination, unrolled GANs, and switching to the Wasserstein objective, which gives a smoother distance that correlates with sample quality.`,
      },
      {
        kind: 'prose',
        heading: 'Why GANs are hard to train, and what Wasserstein fixed',
        body: `The adversarial game has no single loss that always goes down. Training is a search for a **Nash equilibrium** between two networks, and the dynamics can oscillate, diverge, or collapse. Three failure modes dominate. First, **mode collapse** — the generator covers only part of the data, as above. Second, **vanishing discriminator gradients** — if the discriminator becomes near-perfect, the Jensen-Shannon divergence it implicitly measures saturates and stops providing useful gradient to the generator, because two distributions with little overlap have a flat divergence almost everywhere. Third, **instability** — small changes in either network can swing the balance, so the loss curves are noisy and rarely monotone.

The **Wasserstein GAN** (WGAN) reframes the objective around the earth-mover distance \\(W(p_{\\text{data}}, p_g)\\) instead of Jensen-Shannon. Intuitively, earth-mover distance is the minimum cost of transporting probability mass from one distribution's shape into the other's; crucially it stays meaningful even when the two distributions barely overlap, so the gradient never goes flat. The discriminator is replaced by a **critic** that outputs an unbounded real score rather than a probability, trained to satisfy a Lipschitz constraint — originally via weight clipping, later via a gradient penalty (WGAN-GP). The payoff is a loss that actually correlates with sample quality, so for the first time you can read the loss curve and trust it.

Even with these fixes, GANs remain finicky relative to likelihood-based models. They produce no explicit density — you cannot ask "how probable is this sample" — and they need careful balancing of the two networks' capacities and learning rates. That is precisely why diffusion models, which trade the adversarial game for a stable denoising objective, have displaced GANs for many large-scale image tasks. Still, GANs remain fast at sampling (one forward pass versus dozens of denoising steps) and the adversarial idea reappears everywhere: image-to-image translation, super-resolution, and as a perceptual loss component inside other models.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Take a generator producing fakes the discriminator currently scores at \\(D(G(z)) = 0.2\\). Compute the gradient magnitude the generator receives under (a) the saturating loss \\(\\log(1 - D(G(z)))\\) and (b) the non-saturating loss \\(\\log D(G(z))\\), using the derivatives \\(-1/(1 - d)\\) and \\(1/d\\). Which is larger, and by what factor? Then answer in one sentence: at what value of \\(d\\) do the two gradient magnitudes become equal, and what does that point mean for which loss helps more early versus late in training?`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `Goodfellow et al., "Generative Adversarial Networks" (2014): the original paper, still the clearest statement of the game — https://arxiv.org/abs/1406.2661. Arjovsky et al., "Wasserstein GAN" (2017) for the earth-mover reframing — https://arxiv.org/abs/1701.07875, and Gulrajani et al., "Improved Training of Wasserstein GANs" (2017) for the gradient penalty — https://arxiv.org/abs/1704.00028.`,
      },
    ],
  },
  {
    slug: 'normalizing-flows',
    title: 'Normalizing flows',
    oneLiner: 'Stack invertible transforms to bend a simple Gaussian into any distribution — with exact likelihoods.',
    difficulty: 'advanced',
    readMinutes: 12,
    sections: [
      {
        kind: 'prose',
        heading: 'Reshaping a Gaussian, reversibly',
        body: `A normalizing flow builds a complex distribution by starting from a simple one — usually a standard Gaussian \\(z \\sim \\mathcal{N}(0, I)\\) — and pushing it through a sequence of **invertible** transformations. Each transform bends and stretches the probability mass a little; stack enough of them and the simple ball of Gaussian noise becomes the intricate shape of real data. Because every transform is invertible and differentiable, you can run the chain in both directions: forward to sample, backward to compute the exact probability of any data point.

That last property is what sets flows apart. A GAN gives you samples but no density; a VAE gives you only a lower bound on the density. A normalizing flow gives you the **exact log-likelihood** of any input, computed in closed form. You can ask "how probable is this image under my model" and get a real number, which makes flows natural for anomaly detection, density estimation, and any task where you need a calibrated probability rather than just a plausible sample.

The catch is the invertibility requirement. Every layer must be a bijection — a one-to-one map you can run backward — and the determinant of its Jacobian must be cheap to compute, because that determinant is exactly the factor by which the transform stretches or shrinks volume, and you need it to keep probabilities normalised. Most of the engineering in flow models is about designing layers that are expressive enough to be useful yet structured enough that the inverse and the Jacobian determinant stay tractable. The two classic answers — coupling layers and autoregressive transforms — are clever tricks for getting both at once.`,
      },
      {
        kind: 'math',
        heading: 'The change-of-variables formula',
        body: `The entire framework rests on one identity from calculus. If \\(x = f(z)\\) for an invertible, differentiable \\(f\\), then the density of \\(x\\) relates to the density of \\(z\\) by:

\\[
p_x(x) = p_z(z) \\left| \\det \\frac{\\partial f^{-1}}{\\partial x} \\right| = p_z(f^{-1}(x)) \\left| \\det \\frac{\\partial f^{-1}(x)}{\\partial x} \\right|
\\]

Taking logs and working with the forward map's Jacobian \\(J_f\\), the log-density of a data point is:

\\[
\\log p_x(x) = \\log p_z(z) - \\log \\left| \\det J_f(z) \\right|, \\qquad z = f^{-1}(x)
\\]

The \\(\\log p_z(z)\\) term is trivial — it is just the standard Gaussian log-density. The whole difficulty is the **log-determinant of the Jacobian**. For a general dense transform on \\(d\\) dimensions, computing a determinant costs \\(O(d^3)\\), which is hopeless for images. When you chain \\(K\\) transforms \\(f = f_K \\circ \\cdots \\circ f_1\\), the log-determinants simply add up:

\\[
\\log \\left| \\det J_f \\right| = \\sum_{k=1}^{K} \\log \\left| \\det J_{f_k} \\right|
\\]

so the problem reduces to designing a single layer whose Jacobian determinant is cheap, then stacking it.`,
      },
      {
        kind: 'prose',
        heading: 'Coupling layers: triangular Jacobians for free',
        body: `The breakthrough in RealNVP is the **affine coupling layer**, which makes the Jacobian triangular so its determinant is just the product of the diagonal. Split the input vector \\(x\\) into two halves, \\(x_a\\) and \\(x_b\\). Pass the first half through unchanged, and use it to scale and shift the second half:

\\[
y_a = x_a, \\qquad y_b = x_b \\odot \\exp(s(x_a)) + t(x_a)
\\]

Here \\(s\\) and \\(t\\) are arbitrary neural networks — they can be as deep and nonlinear as you like, because they only ever appear inside the exponent and the shift, never inside something you must invert. The inverse is immediate: \\(x_a = y_a\\) and \\(x_b = (y_b - t(y_a)) \\odot \\exp(-s(y_a))\\). You run the same networks \\(s\\) and \\(t\\) forward in both directions; nothing needs to be inverted analytically.

Now the Jacobian. Because \\(y_a\\) depends only on \\(x_a\\) and \\(y_b\\) depends on both, the Jacobian is **lower-triangular**, and its determinant is the product of diagonal entries. The diagonal block for \\(y_a\\) is the identity, and the diagonal for \\(y_b\\) is \\(\\exp(s(x_a))\\), so:

\\[
\\log \\left| \\det J \\right| = \\sum_i s(x_a)_i
\\]

The log-determinant is just the sum of the scale network's outputs — \\(O(d)\\) to compute, no matrix operations at all. The one limitation is obvious: a single coupling layer never transforms \\(x_a\\). So flows alternate which half is held fixed (or apply a fixed permutation between layers), guaranteeing every dimension gets transformed after enough layers.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: a 2D affine coupling step',
        body: `Take a 2D point \\(x = (x_1, x_2) = (1.0, 2.0)\\), split as \\(x_a = x_1\\), \\(x_b = x_2\\). Suppose the conditioning networks evaluated at \\(x_a = 1.0\\) give scale \\(s(x_a) = 0.5\\) and shift \\(t(x_a) = -0.3\\). The forward transform:

- \\(y_a = x_a = 1.0\\) (passed through unchanged).
- \\(y_b = x_b \\cdot \\exp(0.5) + (-0.3) = 2.0 \\cdot 1.6487 - 0.3 = 3.2974 - 0.3 = 2.9974\\).

So \\(y = (1.0, 2.997)\\). The log-determinant of this layer is just \\(s(x_a) = 0.5\\), meaning the transform locally expanded volume by \\(\\exp(0.5) \\approx 1.65\\).

Now verify invertibility. Given \\(y = (1.0, 2.9974)\\), recover \\(x\\): \\(x_a = y_a = 1.0\\), so we recompute \\(s(1.0) = 0.5\\) and \\(t(1.0) = -0.3\\) — the same values, because they depend only on the untouched half. Then \\(x_b = (y_b - t) \\cdot \\exp(-s) = (2.9974 + 0.3) \\cdot \\exp(-0.5) = 3.2974 \\cdot 0.6065 = 2.0\\). We recovered \\((1.0, 2.0)\\) exactly. To get the log-likelihood of the original point under a standard Gaussian base, you would compute \\(\\log \\mathcal{N}(z; 0, I)\\) at \\(z = f^{-1}(x)\\) and subtract the summed log-determinants — here the \\(0.5\\) from this single layer.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: affine coupling forward and inverse',
        body: `def coupling_forward(x_a, x_b, s_net, t_net):
    s = s_net(x_a)                 # scale  (log-space)
    t = t_net(x_a)                 # shift
    y_b = x_b * exp(s) + t
    log_det = sum(s)               # O(d), triangular Jacobian
    return x_a, y_b, log_det       # y_a == x_a

def coupling_inverse(y_a, y_b, s_net, t_net):
    s = s_net(y_a)                 # same nets, same inputs
    t = t_net(y_a)
    x_b = (y_b - t) * exp(-s)
    return y_a, x_b                # exact reconstruction

# stack many layers, permuting which half is fixed between them.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: forgetting the Jacobian term in the loss.** It is tempting to train a flow by maximising \\(\\log p_z(f^{-1}(x))\\) alone — pushing data toward the Gaussian center. That collapses the model: with no \\(-\\log|\\det J|\\) penalty, the flow learns to shrink all volume toward the origin (a near-zero-determinant map) which inflates \\(\\log p_z\\) without modelling the data at all. The volume-change term is what stops the transform from cheating by squashing everything. Always include both terms: \\(\\log p_x(x) = \\log p_z(z) - \\log|\\det J_f|\\). If your flow's samples look like a tight blob around the mean, a missing or mis-signed Jacobian term is the first suspect.`,
      },
      {
        kind: 'prose',
        heading: 'Where flows sit among generative models',
        body: `Normalizing flows occupy a distinct corner of the generative landscape defined by one trade-off: they insist on exact, tractable likelihood, and they pay for it with architectural constraints. Every layer must be invertible with a cheap Jacobian, which rules out the unconstrained, arbitrarily-shaped layers that GANs and diffusion models enjoy. In practice this means flows need many layers to reach the expressiveness a GAN gets from fewer, and the requirement that the latent space have the same dimension as the data (no bottleneck — invertibility forbids it) makes high-resolution images expensive.

Compared to the alternatives: a **VAE** also has a latent variable and a tractable training objective, but only optimises a lower bound on the likelihood and produces somewhat blurry samples from its Gaussian decoder. A **GAN** produces sharp samples but gives no likelihood at all and trains unstably. A **diffusion model** gives high sample quality and a tractable bound, but sampling is slow (many denoising steps). A normalizing flow uniquely gives the exact likelihood and single-pass sampling, at the cost of the invertibility straitjacket and typically lower sample quality than diffusion at the same compute.

That exact-likelihood property is why flows persist even where they do not win on raw image fidelity. They power **density estimation** and **out-of-distribution detection** (a low log-likelihood flags an anomaly), they appear as flexible **posteriors in variational inference** (replacing the VAE's simple Gaussian \\(q\\) with a flow that can match complex posteriors), and continuous-time variants (neural ODEs, FFJORD) connect them to the same differential-equation machinery underlying modern diffusion. The clean math — one change-of-variables identity, stacked — also makes them a favorite teaching model for how invertibility buys you exact probabilities.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A 2D affine coupling layer holds \\(x_a = x_1\\) fixed and transforms \\(x_b = x_2\\) with scale \\(s(x_a) = -0.4\\) and shift \\(t(x_a) = 1.0\\). For the input \\(x = (0.5, 3.0)\\): (a) compute the output \\(y_b\\), (b) state the layer's log-determinant, (c) say whether this layer locally expanded or shrank volume and by what factor, and (d) recover \\(x_b\\) from \\(y_b\\) to confirm the inverse. Then explain in one sentence why a flow built only of coupling layers that always hold the *first* half fixed would fail to model the data, and what single architectural addition fixes it.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `Dinh et al., "Density estimation using Real NVP" (2016) for affine coupling layers — https://arxiv.org/abs/1605.08803. Kingma & Dhariwal, "Glow: Generative Flow with Invertible 1x1 Convolutions" (2018) — https://arxiv.org/abs/1807.03039. For a unifying survey, Papamakarios et al., "Normalizing Flows for Probabilistic Modeling and Inference" (2019) — https://arxiv.org/abs/1912.02762.`,
      },
    ],
  },
  {
    slug: 'autoregressive-models',
    title: 'Autoregressive models',
    oneLiner: 'Factor a joint distribution into a chain of conditionals and predict one token at a time — the recipe behind every LLM.',
    difficulty: 'intermediate',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'One token at a time',
        body: `An autoregressive model generates a sequence by predicting each element conditioned on everything that came before it. To write a sentence, it predicts the first word, then the second word given the first, then the third given the first two, and so on to the end. To generate an image pixel by pixel (PixelCNN) or an audio waveform sample by sample (WaveNet), the same rule applies: every element is a prediction conditioned on the prefix.

This is not a heuristic — it is an exact factorisation of any joint distribution. The probability of a whole sequence is the product of the probability of each element given its predecessors. No approximation, no lower bound: if you can model each conditional well, you have modeled the full joint distribution exactly. That is the quiet superpower of the autoregressive approach and the reason it underlies essentially every large language model in production. GPT, Llama, and their kin are autoregressive transformers trained to predict the next token, nothing more exotic than that.

The trade-off is structural. Generation is inherently **sequential**: you cannot produce element \\(t\\) until you have element \\(t-1\\), because element \\(t-1\\) is part of the conditioning context. Sampling a 1000-token response means 1000 forward passes through the network, one after another, and that latency is the headline cost of autoregressive generation. Training, by contrast, is fully **parallel** — every position's target is already known from the data, so you can compute all the conditionals at once. This asymmetry, parallel to train and serial to sample, is the defining operational fact of the entire model family.`,
      },
      {
        kind: 'math',
        heading: 'The chain rule of probability',
        body: `Every autoregressive model is an application of the chain rule of probability. For a sequence \\(x = (x_1, x_2, \\ldots, x_T)\\), the joint distribution factors exactly as:

\\[
p(x_1, \\ldots, x_T) = \\prod_{t=1}^{T} p(x_t \\mid x_1, \\ldots, x_{t-1})
\\]

This holds for any joint distribution and any ordering — it is an identity, not a modelling assumption. The model's job is to learn each conditional \\(p(x_t \\mid x_{<t})\\), typically as a neural network that reads the prefix \\(x_{<t}\\) and outputs a distribution over the next element (a softmax over the vocabulary for text).

Training maximises the log-likelihood of the data, which by the chain rule decomposes into a sum of per-position cross-entropy terms:

\\[
\\log p(x) = \\sum_{t=1}^{T} \\log p(x_t \\mid x_{<t})
\\]

Because every \\(x_t\\) in the training data is observed, all \\(T\\) terms can be computed in a single parallel forward pass — this is **teacher forcing**: the model conditions on the true prefix, not its own predictions, while training. The loss is the average next-token cross-entropy, and its exponential is the **perplexity**, the standard report metric. A perplexity of \\(20\\) means the model is, on average, as uncertain as if it were choosing uniformly among 20 equally likely next tokens.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: a tiny next-token distribution',
        body: `Suppose a language model has read the prefix "the cat sat on the" and produces logits over a four-word vocabulary \\(\\{\\text{mat}, \\text{hat}, \\text{floor}, \\text{cat}\\}\\) of \\((2.0, 1.0, 0.5, -1.0)\\). Convert to probabilities with the softmax. First exponentiate: \\(e^{2.0} = 7.389\\), \\(e^{1.0} = 2.718\\), \\(e^{0.5} = 1.649\\), \\(e^{-1.0} = 0.368\\). Sum \\(= 12.124\\). Divide:

- \\(p(\\text{mat}) = 7.389 / 12.124 = 0.609\\)
- \\(p(\\text{hat}) = 2.718 / 12.124 = 0.224\\)
- \\(p(\\text{floor}) = 1.649 / 12.124 = 0.136\\)
- \\(p(\\text{cat}) = 0.368 / 12.124 = 0.030\\)

If the true next word in the training data is "mat", the cross-entropy loss at this position is \\(-\\log p(\\text{mat}) = -\\log 0.609 = 0.496\\) nats. Training nudges the logits to raise \\(p(\\text{mat})\\), shrinking that loss.

At generation time you choose how to sample from this distribution. **Greedy** decoding always picks "mat" (highest probability), which is deterministic but repetitive. **Temperature** sampling divides the logits by \\(T\\) before softmax: at \\(T = 0.5\\) the logits become \\((4.0, 2.0, 1.0, -2.0)\\), sharpening the distribution toward "mat"; at \\(T = 2.0\\) they become \\((1.0, 0.5, 0.25, -0.5)\\), flattening it toward uniform and increasing diversity. **Top-p (nucleus)** sampling keeps the smallest set of words whose probabilities sum past \\(p\\) — at \\(p = 0.9\\) here that is \\(\\{\\text{mat}, \\text{hat}, \\text{floor}\\}\\) (sum \\(0.969\\)), dropping the unlikely "cat" before sampling. These knobs trade coherence against variety and are pure inference-time choices — the trained model is identical.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: training vs sampling',
        body: `# TRAINING: parallel, teacher-forced
logits = model(x[:-1])                 # one pass over the whole sequence
loss   = cross_entropy(logits, x[1:])  # predict each next token at once
loss.backward()                        # all T positions in parallel

# SAMPLING: serial, one token at a time
context = [BOS]
for step in range(max_len):
    logits = model(context)[-1]        # distribution for the NEXT token
    probs  = softmax(logits / temperature)
    nxt    = sample_top_p(probs, p=0.9)
    context.append(nxt)
    if nxt == EOS: break               # cannot parallelise: needs prev token`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: exposure bias.** During training the model always conditions on the *true* prefix (teacher forcing), but at generation it conditions on its *own* previously sampled tokens. If it makes one off-distribution choice, the next step now conditions on a prefix it never saw in training, and errors can compound — the model drifts into degenerate loops or nonsense. This gap between train-time and inference-time conditioning is called **exposure bias**. It is why greedy decoding on long sequences often degenerates into repetition, and part of why sampling strategies (top-p, repetition penalties) and techniques like scheduled sampling exist. Do not assume low training loss guarantees coherent long-form generation; evaluate actual sampled outputs.`,
      },
      {
        kind: 'prose',
        heading: 'From RNNs to transformers, and the inference cost',
        body: `The autoregressive idea is older than the transformer. Early models implemented the conditional \\(p(x_t \\mid x_{<t})\\) with **recurrent networks**, which compress the entire prefix into a fixed-size hidden state passed forward step by step. RNNs are serial both to train and to sample, and the fixed-size state struggles to retain information from far back in the sequence — the long-range dependency problem that LSTMs and GRUs only partly relieved. **Convolutional** autoregressive models (WaveNet, PixelCNN) used masked, dilated convolutions to widen the receptive field while keeping training parallel, a real improvement for audio and images.

The **transformer** changed the economics. Self-attention lets every position attend directly to every earlier position, so the path length between any two tokens is constant rather than linear, and a **causal mask** (each position may only attend to itself and earlier ones) enforces the autoregressive constraint while keeping training fully parallel. This is exactly why decoder-only transformers became the universal architecture for language: parallel training over long contexts, plus direct access to the whole prefix, plus the clean next-token objective.

At inference the sequential bottleneck returns, and the dominant engineering response is the **KV cache**. When generating token \\(t\\), the keys and values for all earlier positions were already computed at earlier steps; caching them means each new token costs one incremental attention step rather than reprocessing the whole prefix, turning naive \\(O(T^2)\\) per-token work into \\(O(T)\\). Even so, you still pay one forward pass per token, which is why latency scales with output length and why techniques like speculative decoding (draft cheaply, verify in parallel) exist purely to claw back that serial cost. The factorisation that makes the model exact is the same factorisation that makes it slow to sample.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A model outputs logits \\((1.0, 0.0, -1.0)\\) over a vocabulary \\(\\{A, B, C\\}\\). (a) Compute the softmax probabilities (use \\(e^{1} = 2.718\\), \\(e^0 = 1\\), \\(e^{-1} = 0.368\\)). (b) If the true next token is \\(B\\), what is the cross-entropy loss at this position? (c) Recompute the probabilities at temperature \\(T = 0.5\\) and state whether the distribution sharpened or flattened. (d) Under top-p sampling with \\(p = 0.7\\), which tokens survive the nucleus? Then answer in one sentence: why can training compute the loss for all positions in one pass while sampling cannot?`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `Vaswani et al., "Attention Is All You Need" (2017) for the transformer and causal masking — https://arxiv.org/abs/1706.03762. van den Oord et al., "WaveNet" (2016) for autoregressive audio — https://arxiv.org/abs/1609.03499, and "Pixel Recurrent Neural Networks" (2016) for autoregressive images — https://arxiv.org/abs/1601.06759. Holtzman et al., "The Curious Case of Neural Text Degeneration" (2019) motivates nucleus sampling — https://arxiv.org/abs/1904.09751.`,
      },
    ],
  },
  {
    slug: 'mixture-of-experts',
    title: 'Mixture of experts',
    oneLiner: 'Route each token to a few specialist subnetworks — grow total parameters without growing per-token compute.',
    difficulty: 'advanced',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'Many experts, a few consulted per token',
        body: `A mixture of experts replaces one big dense layer with many smaller **expert** subnetworks plus a lightweight **router** that decides which experts each input should consult. Crucially, only a handful of experts run for any given input — the rest sit idle. This decouples two quantities that are tied together in a dense model: the **total** number of parameters and the number of parameters **active** per token. You can have a trillion total parameters but activate only a few billion for each token, paying compute proportional to what is active, not what exists.

The intuition is specialisation. In a dense feed-forward layer, every weight processes every token, so the layer must be a jack-of-all-trades. In an MoE layer, the router can send code-like tokens to experts that have specialised in code, prose-like tokens to experts good at prose, and so on. Each expert sees a narrower slice of the data distribution and can become genuinely good at it, while the network as a whole holds far more knowledge than any single dense layer of comparable per-token cost could.

This is why frontier-scale models increasingly use MoE layers in place of the dense feed-forward blocks of a transformer. The attention layers stay dense; the FFN blocks become sparse mixtures. The payoff is a model that is large in capacity (good at storing knowledge) yet cheap in per-token FLOPs (fast and affordable to run), and the whole design hinges on the router learning a sensible assignment of tokens to experts. Get the routing right and you get the capacity of a giant model at the cost of a small one; get it wrong and you waste the experts entirely.`,
      },
      {
        kind: 'math',
        heading: 'Top-k gating',
        body: `The router is a small learned function — usually a single linear layer — that maps each input token \\(x\\) to a score for every expert. Let there be \\(N\\) experts with router weight matrix \\(W_g\\). The gate logits and their softmax are:

\\[
g(x) = \\operatorname{softmax}(W_g\\, x) \\in \\mathbb{R}^N
\\]

Plain mixture-of-experts would weight all \\(N\\) experts by \\(g(x)\\) and sum, which is dense — no savings. The sparse version keeps only the **top-\\(k\\)** experts (commonly \\(k = 1\\) or \\(k = 2\\)) and zeros the rest. With \\(\\mathcal{T}\\) the set of top-\\(k\\) expert indices for this token, the layer output is:

\\[
y = \\sum_{i \\in \\mathcal{T}} \\frac{g_i(x)}{\\sum_{j \\in \\mathcal{T}} g_j(x)} \\, E_i(x)
\\]

where \\(E_i\\) is the \\(i\\)-th expert network and the gate weights are renormalised over the chosen experts so they sum to one. Only \\(k\\) of the \\(N\\) experts are evaluated, so the compute is \\(k/N\\) of a dense layer over all experts, while the parameter count is the full \\(N\\) experts. With \\(N = 64\\) experts and \\(k = 2\\), each token touches \\(2/64 \\approx 3\\%\\) of the expert parameters yet the model can store knowledge across all 64.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: routing one token through four experts',
        body: `Take a layer with \\(N = 4\\) experts and top-\\(k = 2\\) routing. A token \\(x\\) produces router logits \\((3.0, 1.0, 2.0, -1.0)\\) for experts \\((E_1, E_2, E_3, E_4)\\). The top-2 by logit are \\(E_1\\) (3.0) and \\(E_3\\) (2.0); \\(E_2\\) and \\(E_4\\) are dropped and never run.

Renormalise the gate over just the chosen pair. Softmax over the two surviving logits: \\(e^{3.0} = 20.09\\), \\(e^{2.0} = 7.39\\), sum \\(= 27.48\\). So the weights are \\(g_1 = 20.09 / 27.48 = 0.731\\) and \\(g_3 = 7.39 / 27.48 = 0.269\\). The layer output is \\(y = 0.731 \\, E_1(x) + 0.269 \\, E_3(x)\\) — a blend dominated by expert 1, with expert 3 contributing about a quarter.

Count the compute. Only \\(E_1\\) and \\(E_3\\) executed, so this token cost \\(2/4 = 50\\%\\) of the FLOPs a dense "run all four" mixture would have cost, even though the layer holds all four experts' parameters. Scale that ratio up — at \\(N = 128\\), \\(k = 2\\) the active fraction is \\(2/128 \\approx 1.6\\%\\), which is where the dramatic capacity-per-FLOP gains come from. Note also that the choice of which experts run depends entirely on \\(x\\): a different token would produce different logits and likely route to a different pair, which is exactly the specialisation the design is after.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: a sparse MoE layer',
        body: `def moe_layer(x, router, experts, k=2):
    logits = router(x)                 # [N] one score per expert
    topk_idx = argtopk(logits, k)      # indices of the k best experts
    topk_w   = softmax(logits[topk_idx])  # renormalise over chosen k

    y = 0
    for w, i in zip(topk_w, topk_idx):
        y += w * experts[i](x)         # only k experts actually run
    return y

# load-balancing auxiliary loss, summed over experts i:
#   aux = alpha * N * sum_i (frac_tokens_to_i * mean_router_prob_i)
# pushes the router to spread tokens evenly across experts.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: ignoring load balancing.** Left to its own devices, the router tends to collapse — it learns to send most tokens to a few favourite experts, which then get all the gradient and improve fastest, attracting even more tokens in a runaway loop. The other experts starve, never train, and the model's effective capacity shrinks to those few. This is **router collapse**, and the standard remedy is an **auxiliary load-balancing loss** that penalises uneven token distribution, nudging the router to spread tokens across all experts. A related practical knob is **expert capacity**: each expert processes at most a fixed number of tokens per batch, and tokens beyond that are dropped (skipped via the residual). Set capacity too low and you silently drop tokens; ignore the balancing loss and most experts go to waste. Always monitor per-expert token counts during training.`,
      },
      {
        kind: 'prose',
        heading: 'The systems reality: why MoE is hard in practice',
        body: `On paper MoE is free capacity; in practice the savings come with a systems bill that shapes every real deployment. The first cost is **memory**. Active FLOPs scale with \\(k\\), but every expert's parameters must still live somewhere — a trillion-parameter MoE needs a trillion parameters of storage and bandwidth even if each token touches a sliver. That memory must be sharded across many accelerators (**expert parallelism**: different experts on different devices), and routing a token to its chosen experts means sending its activations across the network to wherever those experts live. The resulting **all-to-all communication** — every device shipping tokens to every other device that holds a needed expert — is the dominant bottleneck and the reason MoE training is a distributed-systems problem as much as a modelling one.

The second cost is **load imbalance at the hardware level**, distinct from router collapse. Even a well-balanced router produces uneven batches: in any given step some experts receive more tokens than others, and accelerators run in lockstep, so the slowest (most loaded) expert sets the pace while others idle. Expert capacity factors cap this by dropping overflow tokens, trading a little accuracy for predictable, padded batch shapes the hardware can schedule efficiently. Getting this balance right — capacity factor, number of experts, \\(k\\), and the balancing-loss weight — is most of the tuning effort.

The trade-off summary: MoE buys you more knowledge per FLOP and faster inference at a fixed quality bar, at the cost of higher memory footprint, heavier inter-device communication, more complex distributed training, and routing instabilities you must actively manage. For very large models served at scale the trade is usually worth it, which is why Switch Transformer, GLaM, Mixtral, and several frontier models adopt it. For small models that fit on one device, a dense layer is simpler and often just as good — the win only materialises once the model is large enough that activating all parameters per token is the binding constraint.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `An MoE layer has \\(N = 8\\) experts and uses top-\\(k = 2\\) routing. (a) A token's router logits put experts 5 and 2 on top with logits \\(2.0\\) and \\(0.5\\); compute the renormalised gate weights for the two chosen experts (use \\(e^{2.0} = 7.389\\), \\(e^{0.5} = 1.649\\)). (b) What fraction of the total expert FLOPs does each token use compared to running all 8 experts densely? (c) If the model has 8 experts of 1B parameters each plus 0.5B shared parameters, state the total parameter count and the per-token active parameter count. Then explain in one sentence what router collapse is and why an auxiliary load-balancing loss prevents it.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `Shazeer et al., "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer" (2017), the modern foundation — https://arxiv.org/abs/1701.06538. Fedus et al., "Switch Transformers" (2021) for top-1 routing at scale — https://arxiv.org/abs/2101.03961. Jiang et al., "Mixtral of Experts" (2024) for a widely-deployed open MoE — https://arxiv.org/abs/2401.04088.`,
      },
    ],
  },
];
