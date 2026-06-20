export const REGULARIZATION_EXTRA = [
  {
    slug: 'weight-decay-l1-l2',
    title: 'Weight decay (L1 and L2)',
    oneLiner: 'Add a price tag to large weights. The model learns to spend its capacity only where it pays off.',
    difficulty: 'foundation',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'The penalty idea',
        body: `A model that fits the training data perfectly is not the goal — a model that fits the *unseen* data is. The gap between the two is overfitting, and one of its clearest fingerprints is enormous weight values. When a network drives a few weights up to \\(\\pm 50\\) to thread the noise in the training set, those same weights amplify noise at test time and the model falls apart.

Weight decay attacks this directly. Instead of minimising the data loss \\(L_{\\text{data}}(\\theta)\\) alone, you minimise the data loss *plus a penalty on the size of the weights*:

\\[
L(\\theta) = L_{\\text{data}}(\\theta) + \\lambda \\, R(\\theta)
\\]

The coefficient \\(\\lambda\\) is the price per unit of weight magnitude. Set it to zero and you recover plain training. Crank it up and the optimiser is increasingly unwilling to grow any weight unless the data loss rewards it enough to cover the penalty. The result is a model that uses its capacity sparingly — large weights survive only where they genuinely reduce the data loss, and everything else gets pulled toward zero.

The two standard choices for \\(R(\\theta)\\) are the squared L2 norm and the L1 norm, and the difference between them is not cosmetic — it changes the *shape* of the solution you end up with.`,
      },
      {
        kind: 'prose',
        heading: 'L2: shrink everything smoothly',
        body: `**L2 regularisation** (also called ridge, and the thing most people mean when they say "weight decay") penalises the squared magnitude of the weights:

\\[
R(\\theta) = \\tfrac{1}{2} \\sum_i \\theta_i^2 = \\tfrac{1}{2} \\| \\theta \\|_2^2
\\]

The gradient of that penalty is just \\(\\lambda \\theta\\), so the parameter update becomes

\\[
\\theta \\leftarrow \\theta - \\eta \\big( \\nabla L_{\\text{data}} + \\lambda \\theta \\big) = (1 - \\eta \\lambda)\\, \\theta - \\eta \\nabla L_{\\text{data}}
\\]

Read that last form carefully. Every step, *before* the data gradient is even applied, each weight is multiplied by \\((1 - \\eta \\lambda)\\) — a number slightly less than one. The weight **decays** toward zero by a constant fraction each step. That is literally where the name "weight decay" comes from: the L2 penalty turns into a multiplicative shrink on every parameter.

Because the penalty is quadratic, the pull toward zero is *proportional to the weight*. A weight of \\(10\\) feels a pull of \\(10\\lambda\\); a weight of \\(0.1\\) feels a pull of \\(0.1\\lambda\\). Large weights are punished hardest, small weights barely at all. The effect is to shrink the whole weight vector smoothly toward the origin without forcing any individual weight all the way to zero. You end up with many small, diffuse weights rather than a few huge ones.`,
      },
      {
        kind: 'prose',
        heading: 'L1: drive weights exactly to zero',
        body: `**L1 regularisation** (lasso) penalises the absolute magnitude instead:

\\[
R(\\theta) = \\sum_i | \\theta_i | = \\| \\theta \\|_1
\\]

The gradient of \\(|\\theta_i|\\) is \\(\\operatorname{sign}(\\theta_i)\\) — it is \\(+\\lambda\\) when the weight is positive and \\(-\\lambda\\) when negative, *regardless of how large the weight is*. So the update subtracts a **constant** amount each step, pushing every weight toward zero at the same fixed rate. A weight of \\(10\\) and a weight of \\(0.01\\) both feel a pull of exactly \\(\\lambda\\).

That constant pull has a striking consequence: weights that the data loss does not actively defend get pushed all the way to *exactly* zero and stay there. The penalty does not care that a weight is already tiny — it keeps subtracting \\(\\lambda\\) until the weight hits zero, at which point the data gradient would have to overcome a fixed threshold to revive it. The result is a **sparse** weight vector: most entries are precisely \\(0\\), a few are nonzero. This is feature selection for free — L1 tells you which inputs the model decided it could ignore entirely.

Mechanically this is **soft-thresholding**. Because \\(|\\theta_i|\\) is non-differentiable at zero, its subgradient there is the whole interval \\([-\\lambda, +\\lambda]\\). A weight is held at exactly zero whenever the data-loss gradient on it is smaller in magnitude than \\(\\lambda\\): the constant L1 pull simply cancels it, and the subgradient absorbs the difference. Only when the data gradient *exceeds* the threshold \\(\\lambda\\) does the weight come off zero — and even then it emerges shrunk by \\(\\lambda\\). The closed form is \\(\\theta_i \\leftarrow \\operatorname{sign}(g_i)\\,\\max(0, |g_i| - \\lambda)\\), the soft-threshold operator. L2's pull, by contrast, scales with the weight itself and vanishes as the weight approaches zero, so it asymptotes toward but never reaches the axis — it shrinks, never zeroes.

The geometric picture is the classic one: the L1 constraint region is a diamond (a rotated square) with sharp corners on the axes, while the L2 region is a smooth circle. The data-loss contours touch the diamond at a corner — where one coordinate is zero — far more often than they touch the smooth circle at an axis. Corners create sparsity; smoothness does not.`,
      },
      {
        kind: 'viz',
        component: 'WeightDecayContourViz',
        heading: 'Watch the optimum slide as the penalty tightens',
      },
      {
        kind: 'prose',
        heading: 'Worked example: ridge on a tiny regression',
        body: `Make it concrete. Fit \\(y = w x\\) to a single noisy point \\((x, y) = (2, 6)\\) with squared-error data loss and an L2 penalty:

\\[
L(w) = \\tfrac{1}{2}(w x - y)^2 + \\tfrac{\\lambda}{2} w^2
\\]

The data alone wants \\(w = y / x = 3\\). Take the derivative and set it to zero to find where the *penalised* loss is minimised:

\\[
\\frac{dL}{dw} = x(wx - y) + \\lambda w = 0 \\;\\Rightarrow\\; w = \\frac{xy}{x^2 + \\lambda} = \\frac{12}{4 + \\lambda}
\\]

Now plug in values for \\(\\lambda\\):

- \\(\\lambda = 0\\): \\(w = 12/4 = 3\\). No penalty, the data wins outright.
- \\(\\lambda = 1\\): \\(w = 12/5 = 2.4\\). The penalty has shrunk the fit by 20 percent.
- \\(\\lambda = 4\\): \\(w = 12/8 = 1.5\\). Half the unregularised value.
- \\(\\lambda = 100\\): \\(w = 12/104 \\approx 0.115\\). Almost flattened to zero.

The pattern is exactly what the theory promised: ridge shrinks the solution smoothly toward zero as \\(\\lambda\\) grows, but never *reaches* zero for any finite \\(\\lambda\\). Run the same problem with an L1 penalty \\(\\lambda |w|\\) and the answer is \\(w = \\max\\!\\big(0,\\ (xy - \\lambda)/x^2\\big) = \\max(0, (12 - \\lambda)/4)\\) — which hits *exactly* zero the moment \\(\\lambda \\ge 12\\), and stays there. Same data, two penalties, two qualitatively different shrinkage rules.`,
      },
      {
        kind: 'ascii',
        heading: 'L1 vs L2 at a glance',
        body: `Penalty      R(theta)        gradient        weight pull        result
-----------  --------------  --------------  -----------------  ----------------
L2 (ridge)   0.5 * sum w^2   lambda * w      proportional to w  small dense weights
L1 (lasso)   sum |w|         lambda*sign(w)  constant           exact zeros (sparse)

update with L2:  w <- (1 - eta*lambda) * w  -  eta * grad_data
update with L1:  w <- w - eta*lambda*sign(w) -  eta * grad_data

pick L2 when: you want every feature to contribute a little (default for nets)
pick L1 when: you want feature selection / a sparse, interpretable model
pick both:    elastic net = lambda1*|w| + lambda2*w^2`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Ridge vs lasso shrinkage in NumPy',
        body: `import numpy as np

x, y = 2.0, 6.0          # one noisy data point; data alone wants w = 3

def fit_l2(lam):
    return x * y / (x ** 2 + lam)            # closed form for ridge

def fit_l1(lam):
    return max(0.0, (x * y - lam) / x ** 2)  # soft-threshold for lasso

for lam in [0, 1, 4, 12, 100]:
    print(f"lambda={lam:>4}  ridge w={fit_l2(lam):.3f}  lasso w={fit_l1(lam):.3f}")

# lambda=   0  ridge w=3.000  lasso w=3.000
# lambda=   1  ridge w=2.400  lasso w=2.750
# lambda=   4  ridge w=1.500  lasso w=2.000
# lambda=  12  ridge w=0.750  lasso w=0.000   <- L1 hits exact zero here
# lambda= 100  ridge w=0.115  lasso w=0.000
#
# ridge: smooth shrink, never exactly zero. lasso: hard cutoff to zero.`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: applying weight decay to biases and normalisation parameters.** A common mistake is to throw L2 at *every* parameter in the model, including bias terms and BatchNorm/LayerNorm scale-and-shift parameters. Those parameters are not capacity that overfits — a bias just recentres an activation, and a norm's gamma/beta rescale a distribution. Decaying them toward zero fights the very normalisation you added and can hurt accuracy. **Fix:** exclude biases and norm parameters from the decay group. In PyTorch, build two parameter groups — one with \`weight_decay=lambda\` for weight matrices, one with \`weight_decay=0\` for everything one-dimensional. Most reference training scripts for transformers do exactly this.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**L2 penalty and "weight decay" are only identical for plain SGD.** With adaptive optimisers like Adam, adding \\(\\tfrac{\\lambda}{2}\\|\\theta\\|^2\\) to the loss is *not* the same as multiplying weights by \\((1-\\eta\\lambda)\\), because Adam rescales the combined gradient by its running variance — so the penalty gets divided by the gradient magnitude too. **AdamW** fixes this by decoupling the decay: it applies the multiplicative shrink directly to the weights, outside the adaptive rescaling. If you are using Adam and want honest weight decay, use AdamW.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Work these by hand, then check with the code block above.

1. Using the ridge closed form \\(w = xy / (x^2 + \\lambda)\\) with \\(x = 2, y = 6\\), find the \\(\\lambda\\) that shrinks the fit to exactly half the unregularised value (\\(w = 1.5\\)). *(Answer: \\(\\lambda = 4\\), since \\(12/(4+\\lambda) = 1.5 \\Rightarrow 4 + \\lambda = 8\\).)*

2. For the L1 soft-threshold \\(w = \\max(0, (xy - \\lambda)/x^2)\\), at what \\(\\lambda\\) does the lasso weight first hit zero? Verify it matches the table. *(Answer: \\(\\lambda = xy = 12\\).)*

3. Take the L2 update \\(w \\leftarrow (1 - \\eta\\lambda) w\\) with no data gradient, \\(\\eta = 0.1\\), \\(\\lambda = 0.5\\), starting from \\(w = 4\\). Compute the weight after 3 steps. *(Each step multiplies by \\(0.95\\): \\(4 \\to 3.8 \\to 3.61 \\to 3.43\\).)*

4. Explain in one sentence why L1 produces exact zeros but L2 does not, in terms of how the *pull* scales with the weight's current size.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Goodfellow, Bengio, Courville — Deep Learning, Chapter 7 (Regularization)](https://www.deeplearningbook.org/contents/regularization.html) — the canonical treatment of L1/L2 as constrained optimisation and the geometry of the diamond vs the circle.
- [Loshchilov & Hutter — "Decoupled Weight Decay Regularization" (AdamW)](https://arxiv.org/abs/1711.05101) — why L2-in-the-loss and weight decay diverge under Adam, and the fix.`,
      },
    ],
  },
  {
    slug: 'early-stopping',
    title: 'Early stopping',
    oneLiner: 'Stop training the moment the validation loss turns around. The cheapest regulariser there is.',
    difficulty: 'foundation',
    readMinutes: 8,
    sections: [
      {
        kind: 'prose',
        heading: 'The two curves that disagree',
        body: `Train any over-parameterised model long enough and you will watch two loss curves slowly part ways. The **training loss** keeps falling — the model is getting better and better at the exact examples it has seen. The **validation loss**, measured on held-out data the optimiser never touches, falls at first too, bottoms out, and then begins to *rise*. From that turning point onward the model is no longer learning the signal; it is memorising the noise in the training set, and every extra step makes it worse at the thing you actually care about.

Early stopping is the obvious response: keep an eye on the validation loss, and stop training at the point where it was lowest. You do not need a fancier loss function, an extra penalty term, or a change to the architecture. You just refuse to keep walking downhill on the training loss once the validation loss tells you the downhill is taking you the wrong way.

It is the cheapest regulariser in machine learning — it costs one held-out split and a counter — and on real problems it is often the single most effective one. Almost every serious training run uses it, frequently in combination with weight decay and dropout.`,
      },
      {
        kind: 'prose',
        heading: 'Why it counts as regularisation',
        body: `It is not obvious at first that "train for fewer steps" belongs in the same family as L2 and dropout. The connection is that stopping early *limits how far the weights can travel from their initial values*, and that limit behaves like a constraint on weight magnitude.

Initialise the weights small and near zero, as everyone does. Each gradient step moves them a little. After only a few steps the weights are still close to the origin — they have not had time to grow large. Training longer is the only way for a weight to reach a big value, because each step can only change it by \\(\\eta\\) times a gradient. So *time* and *distance travelled in weight space* are coupled: stop early and you have implicitly capped how large the weights can be.

For a simple quadratic loss this can be made exact. Gradient descent run for \\(T\\) steps from a zero initialisation reaches a solution that is provably close to the L2-regularised solution with a penalty strength \\(\\lambda \\approx 1/(\\eta T)\\). Train twice as long and you halve the effective \\(\\lambda\\); stop twice as early and you double it. Early stopping is, to first order, L2 regularisation with the number of steps as the knob instead of an explicit coefficient. The big practical difference: instead of guessing \\(\\lambda\\) up front, you let the validation curve *tell you* when the implicit penalty is right.`,
      },
      {
        kind: 'viz',
        component: 'EarlyStoppingViz',
        heading: 'Drag the stop marker and watch the overfitting gap open',
      },
      {
        kind: 'prose',
        heading: 'Patience: not the first wiggle, the real turn',
        body: `Validation loss is noisy. It does not glide to a minimum and turn cleanly upward — it jitters, dips, recovers, dips again. If you stopped at the very first step where validation loss ticked up, you would stop constantly and far too early, killing runs that were about to improve.

The fix is **patience**: a counter for how many evaluations in a row you are willing to tolerate *without* a new best before you give up. The recipe is mechanical. Track the best validation loss seen so far and the weights that achieved it. After each evaluation, if the current loss beats the best, record it and reset the patience counter to zero. If it does not, increment the counter. When the counter reaches the patience limit, stop — and **restore the weights from the best checkpoint**, not the final ones, because the final ones are by definition worse.

Patience trades wall-clock against the risk of stopping on a fluke. A patience of \\(0\\) stops at the first non-improvement (jittery, fires too soon). A patience of \\(50\\) lets the model wander for fifty evaluations before conceding (robust, but you burn compute on a model that has likely already peaked). Typical values sit between \\(5\\) and \\(20\\) evaluations, scaled to how often you evaluate. The companion knob is **min-delta**: how much better counts as "better", so that a microscopic improvement does not reset the counter and keep a dead run alive.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: tracing the patience counter',
        body: `Suppose you evaluate validation loss once per epoch and set patience \\(= 3\\), min-delta \\(= 0\\). Here is a sequence of validation losses and exactly what the early-stopping logic does each epoch:

- Epoch 1: \\(0.90\\). New best (\\(0.90\\)). Save weights. Counter \\(= 0\\).
- Epoch 2: \\(0.72\\). New best (\\(0.72\\)). Save weights. Counter \\(= 0\\).
- Epoch 3: \\(0.61\\). New best (\\(0.61\\)). Save weights. Counter \\(= 0\\).
- Epoch 4: \\(0.63\\). No improvement. Counter \\(= 1\\).
- Epoch 5: \\(0.60\\). New best (\\(0.60\\)). Save weights. Counter \\(= 0\\).
- Epoch 6: \\(0.64\\). No improvement. Counter \\(= 1\\).
- Epoch 7: \\(0.66\\). No improvement. Counter \\(= 2\\).
- Epoch 8: \\(0.65\\). No improvement. Counter \\(= 3\\) → **stop**.

Training halts after epoch 8. Crucially, you do *not* keep the epoch-8 weights (loss \\(0.65\\)); you reload the **epoch-5 checkpoint** (loss \\(0.60\\)), the best ever seen. Notice the dip at epoch 4 did not stop the run — patience absorbed that single wiggle and the model genuinely improved at epoch 5. Without patience, epoch 4's tick-up would have ended training one epoch before the actual best. That is the whole point of the counter: it distinguishes a momentary fluctuation from a sustained reversal.`,
      },
      {
        kind: 'ascii',
        heading: 'Early-stopping loop (pseudocode)',
        body: `best_loss   = +infinity
best_weights = None
counter      = 0
PATIENCE     = 10
MIN_DELTA    = 1e-4

for epoch in range(max_epochs):
    train_one_epoch(model)
    val_loss = evaluate(model, val_set)

    if val_loss < best_loss - MIN_DELTA:
        best_loss    = val_loss
        best_weights = copy(model.weights)   # checkpoint the BEST, not the last
        counter      = 0
    else:
        counter += 1
        if counter >= PATIENCE:
            break                            # sustained non-improvement -> stop

model.weights = best_weights                 # restore the best checkpoint`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'A minimal early-stopping monitor',
        body: `import copy

class EarlyStopper:
    def __init__(self, patience=10, min_delta=1e-4):
        self.patience, self.min_delta = patience, min_delta
        self.best = float("inf")
        self.best_state = None
        self.counter = 0

    def step(self, val_loss, model):
        if val_loss < self.best - self.min_delta:
            self.best = val_loss
            self.best_state = copy.deepcopy(model.state_dict())  # keep best weights
            self.counter = 0
            return False                  # keep training
        self.counter += 1
        return self.counter >= self.patience  # True -> stop now

# usage
stopper = EarlyStopper(patience=10)
for epoch in range(1000):
    train_one_epoch(model)
    if stopper.step(evaluate(model, val_set), model):
        break
model.load_state_dict(stopper.best_state)     # restore the best checkpoint`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: monitoring the training loss instead of a held-out split.** Early stopping only works because the validation set is data the optimiser never sees. If you watch the *training* loss, it falls monotonically forever — it will never turn around, so your stopper never fires and you overfit anyway. Worse is the subtle version: tuning your patience and min-delta against the *test* set, then reporting test numbers. That leaks the test set into your stopping decision and inflates your reported accuracy. **Fix:** keep three splits — train, validation, test. Stop on validation, report on test, and touch the test set exactly once.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Save the best checkpoint, not the last one.** The single most common implementation bug is letting training finish and then using whatever weights happen to be in memory — which are the weights *after* the validation loss already started climbing. Always snapshot the weights at each new best and reload them when you stop. The few extra megabytes of a checkpoint are nothing next to shipping a model that is several epochs past its peak.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. With patience \\(= 2\\), min-delta \\(= 0\\), walk this validation sequence and say which epoch training stops on and which checkpoint is restored: \\(1.0,\\ 0.8,\\ 0.85,\\ 0.78,\\ 0.79,\\ 0.80\\). *(Best is \\(0.78\\) at epoch 4; counter hits 2 after epochs 5 and 6, so it stops after epoch 6 and restores the epoch-4 weights.)*

2. Using the rule of thumb \\(\\lambda_{\\text{eff}} \\approx 1/(\\eta T)\\), if you trained for \\(T = 1000\\) steps at \\(\\eta = 0.01\\), what implicit L2 penalty did early stopping impose? *(\\(\\lambda \\approx 1/(0.01 \\cdot 1000) = 0.1\\).)*

3. Explain why setting min-delta too large (say \\(0.1\\) on a loss that only ever improves by \\(0.01\\) per epoch) makes early stopping fire almost immediately.

4. You have train/val/test splits. Name the one operation you are allowed to do with the test set, and at what point in the workflow.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Goodfellow, Bengio, Courville — Deep Learning, Section 7.8 (Early Stopping)](https://www.deeplearningbook.org/contents/regularization.html) — the formal equivalence between early stopping and L2 regularisation on a quadratic loss.
- [Prechelt — "Early Stopping — But When?"](https://link.springer.com/chapter/10.1007/978-3-642-35289-8_5) — the classic study comparing stopping criteria and patience strategies in practice.`,
      },
    ],
  },
  {
    slug: 'data-augmentation',
    title: 'Data augmentation',
    oneLiner: 'Teach the model what should not change the answer by showing it transformed copies of the same example.',
    difficulty: 'foundation',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'More data, for free',
        body: `Overfitting is, at its root, a shortage of data relative to the model's capacity. A network with millions of parameters and only a few thousand training images has more than enough freedom to memorise every pixel, and memorisation is the enemy of generalisation. The cleanest cure is more data — but real labelled data is expensive and slow to collect.

Data augmentation manufactures more training data out of the data you already have, by applying *label-preserving transformations*. A photo of a cat, flipped left-to-right, is still a photo of a cat. Rotated five degrees, still a cat. Brightened, cropped slightly, shifted a few pixels — still a cat. Each transformation produces a new training example with the same label, and from the model's point of view it has just seen a fresh image it has never encountered before.

The deeper framing is the one worth remembering: augmentation is how you *tell the model which transformations should not change its answer*. A cat classifier should be **invariant** to horizontal flips, because a mirror-image cat is still a cat. By training on both the original and the flipped version with the same label, you bake that invariance into the weights without ever writing it into the architecture. Augmentation is a way of injecting prior knowledge about the task — "these changes are irrelevant to the label" — directly into the training set.`,
      },
      {
        kind: 'prose',
        heading: 'The label-preserving rule is everything',
        body: `The single constraint that governs all of data augmentation is that the transformation **must not change the correct label**. Get this right and augmentation helps; get it wrong and you are actively teaching the model falsehoods.

Horizontal flip of a cat: label preserved, a cat is symmetric enough that left and right do not matter. Horizontal flip of the handwritten digit "3": label *destroyed* — a mirrored 3 is not a 3, and might look like a malformed E. Rotating a natural photo by 10 degrees: usually fine. Rotating the digit "6" by 180 degrees: now it is a "9", and your label is a lie. Adjusting brightness on a street scene: fine. Adjusting brightness on a medical X-ray where intensity *is* the diagnostic signal: potentially catastrophic.

So the valid augmentations are *domain-specific*, and choosing them is a modelling decision, not a default. For natural images the standard menu is: random horizontal flip, small random rotations, random crops and resizes, colour jitter (brightness, contrast, saturation), and small translations. For audio: time stretching, pitch shifting, adding background noise. For text: synonym replacement, back-translation, random word dropout. For tabular data, augmentation is much harder precisely because there is rarely an obvious transformation that preserves the label.

The mental test before adding any augmentation: *if I showed a human this transformed example, would they still give the same answer?* If yes, it is safe. If they might hesitate or flip their answer, the augmentation is corrupting your labels.`,
      },
      {
        kind: 'viz',
        component: 'DataAugmentationViz',
        heading: 'One sample, many views — the label never moves',
      },
      {
        kind: 'prose',
        heading: 'Worked example: how much extra data?',
        body: `Suppose you have \\(1{,}000\\) labelled images and you compose a pipeline of independent random augmentations applied fresh each time an image is loaded:

- Random horizontal flip: 2 outcomes (flipped or not).
- Random rotation drawn from a continuous range \\(\\pm 15°\\): effectively unlimited distinct outputs.
- Random crop to 90% of the image at a random position: many distinct crops.
- Colour jitter with continuous brightness/contrast factors: again, effectively continuous.

Because the rotation, crop, and jitter parameters are sampled from continuous ranges, the model essentially *never sees the exact same input twice*. Across an entire training run of, say, 100 epochs over 1,000 base images, the model is shown 100,000 augmented examples and almost none of them are pixel-identical. The effective dataset is enormously larger than the 1,000 originals — not by an integer factor, but unbounded.

A sharper way to see the regularising effect: consider only the flip. Without it, the model can learn a feature like "left ear is brighter than right ear" and exploit that quirk of your particular photos. With random flipping, that feature is useless — half the time the example is mirrored, so "left" and "right" carry no reliable signal. The model is *forced* to learn features that survive the flip, which are exactly the features that generalise. Augmentation does not just add examples; it deletes the model's ability to rely on spurious, non-invariant cues.`,
      },
      {
        kind: 'ascii',
        heading: 'Augmentation menu by domain',
        body: `Domain    Safe transforms                              Watch out for
--------  -------------------------------------------  --------------------------------
Images    h-flip, small rotate, crop, color jitter     v-flip + digits/text, 6 <-> 9
Audio     time-stretch, pitch-shift, add noise         shifting speech past phoneme
Text      synonym swap, back-translation, word dropout  negation words ("not"), entities
Medical   small rotate, mild noise, elastic warp       brightness on X-rays (intensity=signal)
Tabular   SMOTE, feature noise (rarely)                most transforms break label

rule:  if a human would still give the SAME label after the transform -> safe
       if a human might change the label              -> corrupts your data`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'A torchvision augmentation pipeline',
        body: `from torchvision import transforms

# applied fresh every time an image is loaded -> the model rarely sees the same input twice
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # random crop + resize
    transforms.RandomHorizontalFlip(p=0.5),               # cat-mirror is still a cat
    transforms.ColorJitter(brightness=0.2, contrast=0.2), # lighting invariance
    transforms.RandomRotation(degrees=15),                # small, label-preserving tilt
    transforms.ToTensor(),
])

# CRUCIAL: validation/test get NO random augmentation -- only deterministic resize.
val_tf = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
])

# train_loader uses train_tf; val_loader uses val_tf. Never randomly augment eval data.`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: augmenting the validation and test sets.** Augmentation is a *training-time* technique. If you apply random flips and crops to your validation set, the validation loss becomes a noisy moving target — the same model scores differently each pass because the eval images keep changing — and you can no longer trust it for model selection or early stopping. **Fix:** use a deterministic transform pipeline for eval (resize + centre-crop only), with all randomness stripped out. The one exception is *test-time augmentation*, where you deliberately average predictions over several augmented copies of each test image to boost accuracy — but that is an explicit, separate technique, not the default.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Augmentation strength is a hyperparameter, and too much hurts.** It is tempting to pile on aggressive rotations, heavy colour distortion, and large crops, reasoning that more variety is always better. Past a point you are showing the model examples so distorted that the label is barely supported by the pixels, and training loss stops falling because the task became impossible. Start with mild, obviously-safe transforms, and increase strength only if the train/validation gap says you are still overfitting.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. For each transform, say whether it preserves the label and why: (a) horizontal flip of a stop sign, (b) vertical flip of the digit "8", (c) vertical flip of the digit "2", (d) 90-degree rotation of a chest X-ray. *(a: yes, sign is symmetric enough; b: yes, an 8 is roughly symmetric top-bottom; c: no, a flipped 2 is not a 2; d: no, anatomy has a fixed orientation.)*

2. You train for 50 epochs on 2,000 images with a pipeline whose rotation and crop are sampled from continuous ranges. Roughly how many *pixel-identical* repeats does the model see? Explain. *(Essentially zero — continuous sampling makes each presentation unique.)*

3. Explain, in terms of invariance, why random horizontal flipping forces the model to ignore "is the bright region on the left or the right" as a feature.

4. Your validation accuracy fluctuates wildly between epochs even though the model is stable. Name the most likely augmentation bug and its fix.`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Shorten & Khoshgoftaar — "A survey on Image Data Augmentation for Deep Learning"](https://journalofbigdata.springeropen.com/articles/10.1186/s40537-019-0197-0) — a broad, practical catalogue of augmentation techniques and when each helps.
- [Cubuk et al. — "AutoAugment: Learning Augmentation Strategies from Data"](https://arxiv.org/abs/1805.09501) — how augmentation policies can themselves be searched and tuned rather than hand-picked.`,
      },
    ],
  },
  {
    slug: 'label-smoothing',
    title: 'Label smoothing',
    oneLiner: 'Stop asking the model to be 100% certain. Soften the targets and the overconfidence goes away.',
    difficulty: 'intermediate',
    readMinutes: 8,
    sections: [
      {
        kind: 'prose',
        heading: 'The problem with one-hot targets',
        body: `Train a classifier with cross-entropy against a **one-hot** target and you are giving the model an impossible instruction. The target for the correct class is exactly \\(1\\), and for every wrong class exactly \\(0\\). To drive the cross-entropy loss toward zero, the model must push the softmax probability of the true class toward \\(1\\) — which requires the corresponding logit to run off toward \\(+\\infty\\) relative to the others. The loss is never *quite* minimised; the gradient keeps pushing the correct logit higher and the rest lower, forever, with no equilibrium.

The consequence is a model that becomes pathologically **overconfident**. It outputs probabilities like \\(0.9999\\) for its top guess even on examples it has no business being sure about, because the training objective rewarded ever-larger logit gaps without limit. Overconfidence is bad for two concrete reasons. First, the predicted probabilities stop being **calibrated** — a "99% confident" prediction is wrong far more than 1% of the time, which is dangerous anywhere downstream code trusts the probability. Second, the enormous logit gaps are a form of overfitting: the model has memorised "this exact input maps to this class with total certainty", which does not transfer to slightly different test inputs.

Label smoothing is the fix, and it is almost trivial to implement: stop asking for certainty.`,
      },
      {
        kind: 'prose',
        heading: 'Softening the target',
        body: `Instead of a hard one-hot target, label smoothing uses a **soft** target that reserves a small slice of probability mass for the wrong classes. With \\(K\\) classes and a smoothing parameter \\(\\varepsilon\\) (commonly \\(0.1\\)), the target for the true class drops from \\(1\\) to \\(1 - \\varepsilon\\), and the leftover \\(\\varepsilon\\) is spread evenly across all \\(K\\) classes:

\\[
y_k^{\\text{LS}} = (1 - \\varepsilon)\\, y_k^{\\text{one-hot}} + \\frac{\\varepsilon}{K}
\\]

So the true class gets target \\((1 - \\varepsilon) + \\varepsilon/K\\) and every other class gets \\(\\varepsilon/K\\). The model is now being asked to predict, say, \\(0.9\\) for the right answer instead of \\(1.0\\), and a small nonzero probability for everything else instead of \\(0\\).

That tiny change rewires the incentives. There is now a *finite* optimal logit configuration — the model is no longer rewarded for pushing the correct logit to infinity, because the target itself is bounded away from \\(1\\). The loss has a genuine minimum at finite logits, the gaps between classes stay bounded, and the resulting probabilities are far better calibrated. Intuitively, you have told the model: "be confident, but leave a little room for doubt, because your labels are not perfect and your inputs are noisy." That is almost always true, and admitting it produces a model that generalises better.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: the smoothed target and its loss',
        body: `Take a 5-class problem (\\(K = 5\\)) with smoothing \\(\\varepsilon = 0.1\\), and suppose the true class is class 2. The hard one-hot target is \\([0, 0, 1, 0, 0]\\). Apply the formula \\(y_k^{\\text{LS}} = (1-\\varepsilon)\\,y_k + \\varepsilon/K\\):

- True class (class 2): \\((1 - 0.1)\\cdot 1 + 0.1/5 = 0.9 + 0.02 = 0.92\\).
- Each wrong class: \\((1 - 0.1)\\cdot 0 + 0.1/5 = 0.02\\).

So the smoothed target is \\([0.02,\\ 0.02,\\ 0.92,\\ 0.02,\\ 0.02]\\). Check that it still sums to \\(1\\): \\(0.92 + 4 \\times 0.02 = 0.92 + 0.08 = 1.0\\). Good — it is still a valid probability distribution, just a softer one.

Now compare the *floor* of the loss under each scheme. With a one-hot target, perfect prediction gives cross-entropy \\(0\\), reachable only at infinite logits. With the smoothed target, even a "perfect" model that matches the soft target exactly pays a residual cross-entropy equal to the entropy of the soft distribution:

\\[
H = -\\big(0.92 \\ln 0.92 + 4 \\cdot 0.02 \\ln 0.02\\big) \\approx -(0.92 \\cdot (-0.083) + 0.08 \\cdot (-3.91)) \\approx 0.077 + 0.313 = 0.39
\\]

The loss bottoms out at about \\(0.39\\) instead of \\(0\\). That nonzero floor is the whole mechanism: the model has no incentive to drive logits to infinity chasing a zero it can never reach. It settles at finite, well-separated, calibrated logits — which is exactly the behaviour we wanted.`,
      },
      {
        kind: 'ascii',
        heading: 'Hard vs smoothed targets (K=5, eps=0.1, true class = 2)',
        body: `class:            0      1      2      3      4     sum
one-hot target:   0.00   0.00   1.00   0.00   0.00   1.0
smoothed target:  0.02   0.02   0.92   0.02   0.02   1.0

true-class target = (1 - eps) + eps/K = 0.9 + 0.02 = 0.92
wrong-class target = eps/K             = 0.10/5  = 0.02

effect: loss floor moves from 0 (infinite logits) to ~0.39 (finite logits)
typical eps: 0.1 for image classification; smaller (0.05) when classes are very many`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Building smoothed targets and the loss',
        body: `import numpy as np

def smooth_labels(true_class, K, eps=0.1):
    target = np.full(K, eps / K)          # every class starts at eps/K
    target[true_class] += (1.0 - eps)     # true class gets the extra (1-eps)
    return target

def cross_entropy(target, probs):
    return -np.sum(target * np.log(probs + 1e-12))

t = smooth_labels(true_class=2, K=5, eps=0.1)
print(t)                                  # [0.02 0.02 0.92 0.02 0.02], sums to 1.0

# loss floor: even a model matching the soft target exactly pays H(target)
print(round(cross_entropy(t, t), 3))      # ~0.39, NOT zero

# in PyTorch this is built in:
#   loss = torch.nn.CrossEntropyLoss(label_smoothing=0.1)
# no need to construct soft targets by hand.`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: leaving label smoothing on when you need to read off true probabilities.** Label smoothing deliberately *compresses* the logit gaps, which is great for accuracy and calibration but means the raw softmax outputs are no longer the model's honest estimate of class probabilities — they are systematically pulled toward uniform. If a downstream system needs well-calibrated probabilities for ranking, thresholding, or knowledge distillation, the smoothed model's outputs can mislead. **Fix:** either calibrate the outputs post-hoc (temperature scaling on a validation set), or train without smoothing when faithful probabilities matter more than top-1 accuracy. Know which one your application needs before turning it on.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Smoothing is per-task; \\(\\varepsilon = 0.1\\) is a default, not a law.** The right amount of smoothing depends on how noisy your labels are and how many classes you have. With thousands of classes, spreading \\(\\varepsilon/K\\) across all of them puts almost nothing on each wrong class, so the effect weakens — some practitioners use a slightly larger \\(\\varepsilon\\) there. With very clean labels and few classes, heavy smoothing can leave accuracy on the table. Treat \\(\\varepsilon\\) as a hyperparameter to sweep, not a constant to copy.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. For a 10-class problem with \\(\\varepsilon = 0.1\\), compute the smoothed target value for the true class and for each wrong class. *(True: \\(0.9 + 0.1/10 = 0.91\\); wrong: \\(0.1/10 = 0.01\\). Check: \\(0.91 + 9 \\times 0.01 = 1.0\\).)*

2. With \\(K = 2\\) and \\(\\varepsilon = 0.2\\), what soft target does a positive example get? *(True class: \\(0.8 + 0.2/2 = 0.9\\); other class: \\(0.1\\).)*

3. Explain why a one-hot cross-entropy loss has no finite minimiser in logit space, while a smoothed loss does.

4. Your model trained with label smoothing reports 96% accuracy, but a downstream module that trusts its "0.99 confidence" predictions is behaving oddly. What is the likely cause, and what is one fix?`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Szegedy et al. — "Rethinking the Inception Architecture" (introduces label smoothing)](https://arxiv.org/abs/1512.00567) — Section 7 is the original proposal and its motivation.
- [Müller, Kornblith & Hinton — "When Does Label Smoothing Help?"](https://arxiv.org/abs/1906.02629) — a careful study of its effect on calibration, accuracy, and knowledge distillation.`,
      },
    ],
  },
  {
    slug: 'mixup-interpolation',
    title: 'Mixup',
    oneLiner: 'Train on blends of two examples and the matching blend of their labels. The model learns to behave linearly in between.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'Training on examples that do not exist',
        body: `Every regulariser so far has kept the training examples themselves intact and changed something around them — the penalty, the stopping time, the targets. Mixup does something stranger: it trains the model on inputs that were never collected, by *averaging two real examples together*.

Take two training pairs, \\((x_A, y_A)\\) and \\((x_B, y_B)\\), drawn at random from the batch. Pick a mixing weight \\(\\lambda \\in [0, 1]\\). Build a brand-new training example by blending both the inputs and the labels with the *same* weight:

\\[
\\tilde{x} = \\lambda\\, x_A + (1 - \\lambda)\\, x_B, \\qquad \\tilde{y} = \\lambda\\, y_A + (1 - \\lambda)\\, y_B
\\]

If \\(x_A\\) is a photo of a cat and \\(x_B\\) a photo of a dog, then \\(\\tilde{x}\\) at \\(\\lambda = 0.5\\) is a ghostly half-cat-half-dog image, and its target is the soft label \\([0.5, 0.5]\\) — "half cat, half dog". You feed that to the network and train on it exactly like a normal example. The mixing weight \\(\\lambda\\) is drawn fresh for every pair from a \\(\\text{Beta}(\\alpha, \\alpha)\\) distribution, where small \\(\\alpha\\) (around \\(0.2\\)) keeps \\(\\lambda\\) near \\(0\\) or \\(1\\) most of the time — so most mixed examples are *mostly* one of the two originals, with occasional aggressive blends.

The instruction to the model is precise: a halfway input should produce a halfway prediction. The network is no longer free to do anything it likes between the data points; it is being told that the region *between* two examples should interpolate linearly between their answers.`,
      },
      {
        kind: 'prose',
        heading: 'Why straight lines between points are the whole point',
        body: `Forget the formula for a moment and picture the input space as a flat sheet with your training points scattered across it, each one a coloured dot — blue for cat, red for dog. A neural network draws a decision boundary, a wiggly fence, separating the colours. The trouble is that without any constraint the network can make that fence do *anything* in the empty gaps between your dots, because no training example lives there to object. It can bulge the cat region into a thin tendril that snakes right up against a dog, leaving a razor-thin margin. Those thin margins are exactly where the model is brittle: a tiny nudge to an input shoves it across the fence and flips the prediction.

Mixup fills the empty gaps. By drawing a straight line in input space from a cat to a dog and demanding that the prediction slide smoothly from "cat" to "dog" as you walk along it, you are telling the network: *do not do anything sudden in here*. The blended example at the midpoint is not allowed to be confidently "cat" — its target is \\([0.5, 0.5]\\), so the model is penalised for being certain in the no-man's-land between classes. The effect is to *straighten out* the model's behaviour between examples. Where an unconstrained network might carve a jagged, overconfident boundary, mixup pulls it toward a gentle, almost-linear transition.

Think of it as physical tension. Each pair of mixed points is a rubber band stretched between two real examples, and the rubber band pulls the prediction surface toward the straight-line interpolation of the two labels. Add thousands of these bands across all pairs and the surface relaxes into something smooth. Smooth surfaces have wide margins; wide margins generalise and resist small perturbations. That is the entire mechanism — you are not adding information about cats or dogs, you are adding a *prior that the world is locally linear between examples*, and that prior happens to be a very good regulariser.

A second payoff falls out for free: the soft targets discourage overconfidence the same way label smoothing does. The model rarely sees a clean one-hot target, so it never learns to slam its logits to infinity, and its probabilities stay better calibrated.`,
      },
      {
        kind: 'viz',
        component: 'MixupBlendViz',
        heading: 'Drag λ to crossfade two classes — the label moves in lockstep with the pixels',
      },
      {
        kind: 'prose',
        heading: 'The loss rewrite that makes it cheap',
        body: `You do not have to construct soft-label vectors by hand. Because cross-entropy is linear in the target, the loss on a mixed example splits cleanly into a \\(\\lambda\\)-weighted sum of two ordinary losses:

\\[
\\mathcal{L}(\\tilde{x}, \\tilde{y}) = \\lambda \\, \\text{CE}\\big(f(\\tilde{x}),\\, y_A\\big) + (1 - \\lambda)\\, \\text{CE}\\big(f(\\tilde{x}),\\, y_B\\big)
\\]

So in code you mix only the *inputs*, run one forward pass on \\(\\tilde{x}\\), then compute the standard hard-label loss against \\(y_A\\) and against \\(y_B\\) and combine them with weights \\(\\lambda\\) and \\(1-\\lambda\\). No soft-target tensors, no change to the loss function itself.

The cost is essentially nothing. There is exactly one forward and one backward pass per mixed example — the same as ordinary training — plus one cheap elementwise blend of the inputs and a second loss term. There is no extra parameter, no extra memory beyond the second label index, and no change at inference time: mixup is a *training-only* recipe, and at test time you feed the model real, unmixed inputs exactly as usual. The only hyperparameter is \\(\\alpha\\), the Beta concentration that controls how aggressive the blends get.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Mixup in a training step',
        body: `import numpy as np
import torch

def mixup_batch(x, y, alpha=0.2):
    # x: (N, ...) inputs, y: (N,) integer labels
    lam = np.random.beta(alpha, alpha)        # mostly near 0 or 1 for small alpha
    perm = torch.randperm(x.size(0))          # pair each example with another
    x_mixed = lam * x + (1.0 - lam) * x[perm] # blend the inputs
    return x_mixed, y, y[perm], lam           # keep BOTH labels + the weight

def mixup_loss(logits, y_a, y_b, lam, criterion):
    # cross-entropy is linear in the target -> just blend the two losses
    return lam * criterion(logits, y_a) + (1.0 - lam) * criterion(logits, y_b)

# inside the loop:
x_mixed, y_a, y_b, lam = mixup_batch(x, y, alpha=0.2)
logits = model(x_mixed)                        # one forward pass, same cost as usual
loss = mixup_loss(logits, y_a, y_b, lam, torch.nn.CrossEntropyLoss())
loss.backward()
# at TEST time: feed real x, no mixing. mixup is training-only.`,
      },
      {
        kind: 'ascii',
        heading: 'What mixup does, at a glance',
        body: `step             operation
---------------  --------------------------------------------------------
1. sample lam    lam ~ Beta(alpha, alpha)   (alpha~0.2 -> usually near 0/1)
2. pick a pair   permute the batch; pair x[i] with x[perm[i]]
3. blend inputs  x~ = lam*x_A + (1-lam)*x_B
4. blend loss    L  = lam*CE(f(x~), y_A) + (1-lam)*CE(f(x~), y_B)

cost: 1 fwd + 1 bwd (same as normal) + one blend + one extra CE term
test time: NO mixing -- feed real inputs

alpha small (0.1-0.4): gentle, near-original blends  -> safe default
alpha large (>1):      heavy 50/50 blends            -> can underfit`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: assuming a linear pixel blend is meaningful for every data type.** Mixup averages raw inputs. For natural images this produces a plausible ghosted overlay and works beautifully. For inputs where a linear average is nonsense — one-hot categorical features, token-id sequences, or data with hard structural constraints — averaging two examples can yield a point that lies far off the data manifold, and training on it teaches the model about a region it will never encounter. **Fix:** for structured or discrete data, mix in a *learned feature space* instead of input space (manifold mixup blends hidden activations), or use a domain-appropriate variant rather than blending raw inputs.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Mix the labels, never just the inputs.** The single most common implementation bug is blending \\(x_A\\) and \\(x_B\\) but training against the hard label \\(y_A\\) alone, because the second label got dropped somewhere in the data pipeline. That teaches the model that a half-dog image is fully a cat — actively wrong supervision that hurts more than no mixup at all. The input weight and the label weight must be the *same* \\(\\lambda\\); if one is mixed, both must be. Always carry both labels and the weight through to the loss.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: a single mixed pair',
        body: `Take a 3-class problem. Example A is class 0 with one-hot \\(y_A = [1, 0, 0]\\); example B is class 2 with \\(y_B = [0, 0, 1]\\). Draw \\(\\lambda = 0.7\\).

The mixed input is \\(\\tilde{x} = 0.7\\, x_A + 0.3\\, x_B\\) — a blend that is 70% the first image, 30% the second. The mixed target is

\\[
\\tilde{y} = 0.7\\,[1, 0, 0] + 0.3\\,[0, 0, 1] = [0.7,\\ 0,\\ 0.3].
\\]

Suppose the model outputs probabilities \\(\\hat{p} = [0.6, 0.1, 0.3]\\). The blended loss is

\\[
\\mathcal{L} = 0.7 \\cdot (-\\ln 0.6) + 0.3 \\cdot (-\\ln 0.3) = 0.7 \\cdot 0.511 + 0.3 \\cdot 1.204 \\approx 0.358 + 0.361 = 0.72.
\\]

Notice what is being asked: the model is rewarded for putting \\(0.7\\) on class 0 and \\(0.3\\) on class 2 — *not* for being certain about either. If it had output a confident \\([0.99, 0.005, 0.005]\\) it would have been heavily penalised on the class-2 term, because the target insists on \\(0.3\\) there. The loss only bottoms out when the prediction matches the interpolated target, which is precisely how mixup forces the smooth, linear-in-between behaviour.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. With \\(y_A = [1,0]\\), \\(y_B = [0,1]\\) and \\(\\lambda = 0.25\\), write the mixed target \\(\\tilde{y}\\). *(\\(\\tilde{y} = [0.25, 0.75]\\) — the example is mostly B.)*

2. Explain in one sentence why \\(\\text{Beta}(0.2, 0.2)\\) is preferred over a uniform \\(\\lambda\\): what does drawing \\(\\lambda\\) near \\(0\\) or \\(1\\) most of the time buy you? *(Most mixed examples stay close to a real example, so you regularise the in-between gaps without destroying the signal that 50/50 blends would.)*

3. A teammate reports that mixup *hurt* their model trained on one-hot categorical tabular features. Name the likely cause and one fix. *(Averaging one-hot inputs produces off-manifold points; mix in feature space or skip mixup for those columns.)*

4. Show that for a 2-class problem, \\(\\lambda\\, \\text{CE}(f, y_A) + (1-\\lambda)\\,\\text{CE}(f, y_B)\\) equals the cross-entropy of \\(f\\) against the soft target \\(\\lambda y_A + (1-\\lambda) y_B\\). *(Both expand to \\(-\\sum_k [\\lambda y_{A,k} + (1-\\lambda) y_{B,k}] \\ln f_k\\) by linearity.)*`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Zhang et al. — "mixup: Beyond Empirical Risk Minimization"](https://arxiv.org/abs/1710.09412) — the original paper, including the linear-behaviour-between-examples argument.
- [Verma et al. — "Manifold Mixup: Better Representations by Interpolating Hidden States"](https://arxiv.org/abs/1806.05236) — mixing in learned feature space rather than raw inputs.`,
      },
    ],
  },
  {
    slug: 'stochastic-depth',
    title: 'Stochastic depth (DropPath)',
    oneLiner: 'Randomly delete whole residual blocks during training. The network trains short and tests deep.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'Dropping layers, not neurons',
        body: `Dropout zeroes out individual *neurons*. Stochastic depth scales the idea all the way up: during training it randomly drops *entire residual blocks*, replacing each one with the identity function so the signal flows straight past as if the block were not there. It only works because of the residual structure. A residual block computes

\\[
x_{\\ell+1} = x_\\ell + f_\\ell(x_\\ell),
\\]

where \\(f_\\ell\\) is the block's transformation (a couple of conv layers, say) and the \\(x_\\ell\\) term is the skip connection that carries the input forward unchanged. Stochastic depth multiplies the residual branch by a Bernoulli gate \\(b_\\ell \\in \\{0, 1\\}\\):

\\[
x_{\\ell+1} = x_\\ell + b_\\ell \\cdot f_\\ell(x_\\ell).
\\]

When the coin comes up \\(b_\\ell = 0\\), the whole transformation \\(f_\\ell\\) is skipped and the block collapses to \\(x_{\\ell+1} = x_\\ell\\) — the pure identity. The gradient for that block's parameters is zero on this pass, so it simply does not train this step. When \\(b_\\ell = 1\\) the block behaves normally. Each forward pass draws a fresh set of gates, so each pass trains a *different, shorter sub-network* sampled from the full deep one. This trick is often called **DropPath** when it gates the residual *path* of a block.

The survival probability is not the same for every block. The standard schedule keeps early blocks almost always alive and makes the keep-probability fall *linearly with depth*, so the deepest blocks are dropped most often. The intuition is that early layers learn general, reusable features you always want present, while deep layers are more specialised and more redundant — exactly the ones you can afford to drop.`,
      },
      {
        kind: 'prose',
        heading: 'A 110-layer net that is really 50 layers deep on average',
        body: `Why would deleting random chunks of your model help? Start with the problem it solves. Very deep networks are powerful but painful: they overfit, they take forever to train, and the gradient has to survive a long chain of multiplications to reach the early layers. Stochastic depth attacks all three at once, and the cleanest way to see it is to count *expected depth*.

Suppose your network has \\(L\\) residual blocks, and block \\(\\ell\\) survives with probability \\(p_\\ell\\). On any given forward pass, the number of blocks that actually run is a random sum, and its average is just \\(\\sum_\\ell p_\\ell\\). With a linear schedule from \\(p = 1\\) at the input down to \\(p = 0.5\\) at the output, that average works out to roughly \\(0.75 L\\) — so a 110-block network behaves, on average, like a network only about 80 blocks deep during training. The deeper the schedule's drop, the shorter the *expected* network you are actually training, even though the *capacity* of the full network is still there waiting at test time.

Now picture the geometry of it. A plain deep network is one rigid tower; the gradient has to climb every single floor to reach the ground. With stochastic depth, on each step the tower randomly loses floors and the surviving floors form a shorter tower. A block near the bottom that is, say, three floors up *this* pass gets a strong, undiluted gradient, because there are only three sets of weights between it and the loss instead of a hundred. Across many passes every block experiences a mix of short and long paths, and the early blocks in particular get far more direct gradient signal than they ever would in the full-height tower. That is why stochastic depth trains *faster* and reaches the bottom layers better: you are constantly handing the early layers short gradient paths.

There is a third lens, and it is the one that ties stochastic depth to the rest of this pillar. Each distinct set of surviving blocks is a *different network*. Over training you implicitly sample and train an exponentially large family of sub-networks that all share weights — exactly the ensemble argument behind dropout, just at the granularity of whole blocks instead of single units. At test time you keep every block but scale each residual branch by its survival probability \\(p_\\ell\\), so the expected contribution matches training. The result is a single network that behaves like an average over a huge ensemble of shallower ones, which is precisely the kind of averaging that reduces variance and regularises.`,
      },
      {
        kind: 'viz',
        component: 'StochasticDepthViz',
        heading: 'Run forward passes — watch blocks drop with depth and the signal skip through the identity',
      },
      {
        kind: 'prose',
        heading: 'The test-time rescale, in numbers',
        body: `At test time you want determinism — no random dropping — but you must account for the fact that during training each block's residual was present only a fraction \\(p_\\ell\\) of the time. So you keep every block but multiply its residual branch by \\(p_\\ell\\):

\\[
\\text{train: } x_{\\ell+1} = x_\\ell + b_\\ell\\, f_\\ell(x_\\ell), \\qquad \\text{test: } x_{\\ell+1} = x_\\ell + p_\\ell\\, f_\\ell(x_\\ell).
\\]

This is the same expected-value bookkeeping as inverted dropout. During training the *expected* output of the block is \\(x_\\ell + p_\\ell f_\\ell(x_\\ell)\\) because \\(\\mathbb{E}[b_\\ell] = p_\\ell\\); scaling by \\(p_\\ell\\) at test time reproduces that expectation deterministically, so the statistics the downstream layers learned to expect are preserved.

Concretely, with a linear schedule over \\(L = 4\\) blocks from \\(p_0 = 1.0\\) down to \\(p_3 = 0.5\\): the survival probabilities are \\([1.0,\\ 0.83,\\ 0.67,\\ 0.5]\\), the expected depth is \\(1.0 + 0.83 + 0.67 + 0.5 = 3.0\\) blocks out of 4, and at test time block 3's residual is scaled by \\(0.5\\) while block 0's is left untouched. The cost during training is *negative* — you skip the forward and backward compute for every dropped block, so stochastic depth makes very deep networks train measurably faster, not slower.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'A DropPath residual block',
        body: `import torch
import torch.nn as nn

class StochasticDepthBlock(nn.Module):
    def __init__(self, fn, survival_prob):
        super().__init__()
        self.fn = fn                       # the residual transformation f_l
        self.p = survival_prob             # keep-probability for this block

    def forward(self, x):
        if not self.training:
            return x + self.p * self.fn(x)         # test: scale residual by p
        if torch.rand(1).item() < self.p:
            return x + self.fn(x)                  # block kept: run it normally
        return x                                   # block dropped: pure identity

def linear_schedule(num_blocks, p_last=0.5):
    # early blocks survive ~always; deep blocks drop most
    return [1.0 - (i / (num_blocks - 1)) * (1.0 - p_last)
            for i in range(num_blocks)]

probs = linear_schedule(4, p_last=0.5)   # [1.0, 0.833, 0.667, 0.5]
expected_depth = sum(probs)              # 3.0 of 4 blocks, on average`,
      },
      {
        kind: 'ascii',
        heading: 'Stochastic depth vs dropout vs the identity skip',
        body: `                    drops what        train-time effect      test time
------------------  ----------------  ---------------------  ------------------
dropout             single neurons    masks activations      scale acts by p
stochastic depth    whole res-blocks  block -> identity      scale residual by p

residual block:   x_{l+1} = x_l + b_l * f_l(x_l)
  b_l = 1  -> normal block
  b_l = 0  -> x_{l+1} = x_l   (the skip connection IS the network here)

linear schedule (L blocks, p_last=0.5):  p_l = 1 - (l/(L-1))*(1 - p_last)
expected depth = sum(p_l)   (e.g. ~0.75*L  ->  shorter average network)

bonus: dropped blocks cost ZERO compute -> deep nets train FASTER`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: applying stochastic depth to non-residual blocks.** The technique relies entirely on the skip connection: when the block is dropped, the identity path \\(x_\\ell\\) must still carry the signal forward. If you gate a plain (non-residual) layer to zero, you do not get the identity — you get *nothing*, a dead activation that kills the forward signal and the gradient for everything after it. **Fix:** only drop the *residual branch* of a residual block, never a standalone layer. The form \\(x + b\\cdot f(x)\\) is what makes a dropped block collapse to the identity rather than to zero.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Forgetting the test-time rescale silently shifts every downstream activation.** If you train with random dropping but at test time run \\(x + f(x)\\) without the \\(p_\\ell\\) factor, every kept block contributes more than it did on average during training, so the activation magnitudes the later layers expect are wrong and accuracy drops for no obvious reason. Either scale the residual by \\(p_\\ell\\) at inference, or — as some implementations do — divide by \\(p_\\ell\\) during training (the "inverted" form) so test time needs no rescale at all. Pick one convention and apply it consistently.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: expected depth of a schedule',
        body: `Take \\(L = 6\\) blocks with a linear keep-probability schedule from \\(p_0 = 1.0\\) to \\(p_5 = 0.5\\). The formula \\(p_\\ell = 1 - \\frac{\\ell}{L-1}(1 - p_{\\text{last}})\\) gives, for \\(\\ell = 0..5\\):

\\[
p = [1.00,\\ 0.90,\\ 0.80,\\ 0.70,\\ 0.60,\\ 0.50].
\\]

The expected number of blocks that run on any pass is the sum:

\\[
\\mathbb{E}[\\text{depth}] = 1.00 + 0.90 + 0.80 + 0.70 + 0.60 + 0.50 = 4.5.
\\]

So this 6-block network trains as if it were, on average, 4.5 blocks deep — a 25% reduction in effective depth, with the cut concentrated in the later blocks. Push \\(p_{\\text{last}}\\) down to \\(0.2\\) and the schedule becomes \\([1.0, 0.84, 0.68, 0.52, 0.36, 0.2]\\), summing to \\(3.6\\) — a much more aggressive shrink that trains faster and regularises harder, at the risk of underfitting if the network was not deep enough to spare those blocks. The single knob \\(p_{\\text{last}}\\) trades regularisation strength against capacity, and deeper networks tolerate a more aggressive (lower) \\(p_{\\text{last}}\\).`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. For \\(L = 5\\) blocks with \\(p_0 = 1.0\\) and \\(p_4 = 0.6\\), list the linear survival probabilities and compute the expected depth. *(\\(p = [1.0, 0.9, 0.8, 0.7, 0.6]\\); expected depth \\(= 4.0\\) of 5.)*

2. Explain in one sentence why a dropped *residual* block is harmless but a dropped *plain* block would break the forward pass. *(A residual block's skip connection still carries \\(x\\) forward when the branch is dropped; a plain block has no skip, so dropping it outputs nothing.)*

3. You trained with stochastic depth but forgot the test-time rescale and accuracy fell. What is the fix, in terms of \\(p_\\ell\\)? *(At test time multiply each block's residual branch by its survival probability \\(p_\\ell\\), or use the inverted convention that scales during training.)*

4. Why does stochastic depth give early layers a stronger gradient signal than a plain deep network? *(On passes where deep blocks are dropped, the path from an early block to the loss is shorter, so its gradient passes through fewer multiplications and is less attenuated.)*`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Huang et al. — "Deep Networks with Stochastic Depth"](https://arxiv.org/abs/1603.09382) — the original method, the linear survival schedule, and the ensemble interpretation.
- [Larsson et al. — "FractalNet: Ultra-Deep Neural Networks without Residuals" (drop-path)](https://arxiv.org/abs/1605.07648) — the path-dropping variant that the DropPath name comes from.`,
      },
    ],
  },
  {
    slug: 'adversarial-robustness',
    title: 'Adversarial robustness',
    oneLiner: 'Tiny, deliberately-chosen perturbations flip a confident prediction. Training against them hardens the model.',
    difficulty: 'advanced',
    readMinutes: 10,
    sections: [
      {
        kind: 'prose',
        heading: 'The imperceptible change that fools the model',
        body: `Take an image a network classifies as "panda" with 99% confidence. Add a carefully-chosen perturbation so small that to a human the image looks identical, and the same network now says "gibbon" with 99% confidence. The perturbation is not random noise — random noise barely moves the prediction. It is the *worst-case* perturbation, computed by asking the model itself which direction most increases its loss, then taking a small step that way.

The recipe is the **Fast Gradient Sign Method (FGSM)**. You already compute the gradient of the loss with respect to the *weights* during training; here you compute the gradient of the loss with respect to the *input* instead, and step the input in the direction that raises the loss:

\\[
x' = x + \\varepsilon \\cdot \\operatorname{sign}\\big(\\nabla_x \\mathcal{L}(f(x), y)\\big).
\\]

The \\(\\operatorname{sign}(\\cdot)\\) takes only the *direction* of each coordinate's gradient, \\(+1\\) or \\(-1\\), and \\(\\varepsilon\\) sets how far you move along it. Because every pixel changes by exactly \\(\\pm\\varepsilon\\), the total distortion measured in the L-infinity norm is exactly \\(\\varepsilon\\) — a tight, uniform budget. A typical \\(\\varepsilon\\) of \\(8/255\\) on an 8-bit image changes each pixel by at most 8 levels out of 256, which is visually invisible yet routinely enough to flip the label.

These crafted inputs are called **adversarial examples**, and their existence is unsettling. A model can hit superhuman accuracy on clean data and still be flipped by perturbations no human would even notice. That gap between clean accuracy and worst-case accuracy is what adversarial robustness is about.`,
      },
      {
        kind: 'prose',
        heading: 'Why a microscopic step can flip the answer',
        body: `The geometry is the key, and it is more intuitive than the phenomenon sounds. Picture the model's decision boundary as a surface separating "panda" from "gibbon" in input space, and your image as a single point sitting on the panda side. The question is: how far is that point from the boundary, and in which direction is the boundary closest?

If the boundary ran perpendicular to every axis and your point sat comfortably in the middle of a wide panda region, you would have to move a long way to cross it. But in high-dimensional input spaces — a modest image has tens of thousands of pixels — points sit much closer to decision boundaries than your intuition from two or three dimensions suggests, and the boundary is rarely perpendicular to the axes. The gradient \\(\\nabla_x \\mathcal{L}\\) points in the single direction that climbs the loss fastest, which is essentially the direction *straight at the nearest boundary*. The FGSM step walks the point precisely that way.

Here is the part that makes it so cheap to fool a model. Locally, a neural network is close to linear, and for a linear score \\(w^\\top x\\) the change in score from a perturbation \\(\\delta\\) is \\(w^\\top \\delta\\). If you are allowed to spend a budget \\(\\varepsilon\\) per coordinate (the L-infinity ball), the perturbation that maximises that change is \\(\\delta = \\varepsilon\\,\\operatorname{sign}(w)\\), and the resulting score change is \\(\\varepsilon \\sum_i |w_i| = \\varepsilon \\|w\\|_1\\). The crucial observation is that this grows with the *number of dimensions*: across thousands of pixels, thousands of tiny, individually-imperceptible nudges all aligned with the gradient *add up* to a large shift in the score, even though each pixel barely moved and the L-infinity size of the whole perturbation stayed at \\(\\varepsilon\\). The attack does not need a big move on any one pixel; it needs a small, coordinated move on *all* of them.

That is the whole picture. The point barely moves in any human-visible sense — every pixel changes by an invisible amount — yet because the move is perfectly aligned with the direction the model is most sensitive to, and because there are so many pixels to spend the budget across, the score crosses the boundary and the label flips. Random noise fails precisely because it is *not* aligned: its contributions to the score cancel out instead of adding up.`,
      },
      {
        kind: 'viz',
        component: 'AdversarialPerturbationViz',
        heading: 'Grow ε along the gradient sign — the point barely moves yet crosses the boundary',
      },
      {
        kind: 'prose',
        heading: 'From one step to many: PGD, and training against the attacker',
        body: `FGSM takes a single step. A stronger attack takes many small steps, re-computing the gradient each time and projecting back into the \\(\\varepsilon\\)-ball whenever it tries to leave — this is **Projected Gradient Descent (PGD)**, the standard benchmark attack:

\\[
x^{t+1} = \\Pi_{\\|x' - x\\|_\\infty \\le \\varepsilon}\\Big( x^t + \\eta \\cdot \\operatorname{sign}\\big(\\nabla_x \\mathcal{L}(f(x^t), y)\\big) \\Big),
\\]

where \\(\\Pi\\) clips each coordinate back to within \\(\\varepsilon\\) of the original. PGD finds much more damaging perturbations than FGSM because it can follow the curved loss surface rather than committing to one straight step.

The defence flips the attack into the training objective. Instead of minimising the loss on clean inputs, **adversarial training** minimises the loss on the *worst-case* perturbed input inside the budget — a min-max problem:

\\[
\\min_\\theta\\ \\mathbb{E}_{(x,y)}\\Big[ \\max_{\\|\\delta\\|_\\infty \\le \\varepsilon}\\ \\mathcal{L}\\big(f_\\theta(x + \\delta),\\, y\\big) \\Big].
\\]

In practice you implement the inner \\(\\max\\) by running PGD on each batch to generate adversarial examples, then take a normal gradient step on the model weights to classify *those* correctly. The model is forced to be right not just on the data points but on a small ball around each one — which is exactly a smoothness/robustness constraint, and that is why adversarial training belongs in a chapter on regularisation. It penalises the model for having a steep decision boundary anywhere near the training data, pushing the boundary away from every example and flattening the loss surface in the input neighbourhood.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'FGSM and a PGD adversarial-training step',
        body: `import torch
import torch.nn.functional as F

def fgsm(model, x, y, eps):
    x = x.clone().detach().requires_grad_(True)
    loss = F.cross_entropy(model(x), y)
    grad = torch.autograd.grad(loss, x)[0]        # gradient wrt the INPUT
    return (x + eps * grad.sign()).detach()       # one step along the sign

def pgd(model, x, y, eps, alpha, steps):
    x_adv = x.clone().detach()
    for _ in range(steps):
        x_adv.requires_grad_(True)
        loss = F.cross_entropy(model(x_adv), y)
        grad = torch.autograd.grad(loss, x_adv)[0]
        x_adv = x_adv.detach() + alpha * grad.sign()
        delta = torch.clamp(x_adv - x, -eps, eps)  # project back into the eps-ball
        x_adv = torch.clamp(x + delta, 0, 1)       # keep a valid image
    return x_adv.detach()

# adversarial training step: solve the inner max with PGD, then update weights
x_adv = pgd(model, x, y, eps=8/255, alpha=2/255, steps=7)
loss = F.cross_entropy(model(x_adv), y)            # train on the worst case
loss.backward(); optimizer.step()`,
      },
      {
        kind: 'ascii',
        heading: 'Attack budgets and the robustness trade-off',
        body: `attack   steps   what it does
-------  ------  -----------------------------------------------
FGSM     1       x' = x + eps * sign(grad_x loss)
PGD      k       k small signed steps, project into eps-ball each time

perturbation budget:  ||x' - x||_inf <= eps   (max change PER pixel)
  eps = 8/255  -> at most 8 of 256 levels per pixel -> invisible to humans

why random noise fails:   contributions to the score cancel  (sum ~ 0)
why FGSM works:           contributions all aligned -> sum ~ eps*||w||_1

adversarial training (min-max):
  min_theta  E[ max_{||d||<=eps}  L(f(x+d), y) ]
       ^outer: update weights      ^inner: PGD finds worst-case d

trade-off:  more robust  ->  usually LOWER clean accuracy  +  ~k x slower`,
      },
      {
        kind: 'callout',
        tone: 'tip',
        body: `**Trap: declaring victory after defending against FGSM only.** A model trained against single-step FGSM often looks robust against FGSM yet collapses completely under a multi-step PGD attack — a failure mode called *gradient masking* or *obfuscated gradients*, where the model has merely made its gradient unhelpful to a one-step attacker without becoming genuinely robust. **Fix:** always evaluate robustness with a strong, multi-step attack (PGD with many steps and several random restarts, or a standardised suite like AutoAttack). Robustness reported against a weak attack is not robustness; it is a measurement artifact.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Robustness costs clean accuracy and compute, and \\(\\varepsilon\\) defines the threat model.** Adversarial training reliably lowers accuracy on clean, unperturbed inputs — there is a well-documented trade-off between standard accuracy and robust accuracy, because forcing flat predictions in a ball around each point removes capacity the model would otherwise spend fitting the clean data. It is also roughly \\(k\\times\\) slower for \\(k\\)-step PGD, since every training batch now runs an inner attack loop. And the whole guarantee is *only* meaningful relative to the \\(\\varepsilon\\) and norm you trained against: a model robust to L-infinity \\(\\varepsilon = 8/255\\) can still be broken by a larger budget or a different norm (L2, rotations, patches). State the threat model explicitly.`,
      },
      {
        kind: 'prose',
        heading: 'Worked example: a linear model crosses the boundary',
        body: `Make the geometry concrete with a linear classifier in two dimensions: \\(\\text{score}(x) = w^\\top x\\) with \\(w = [0.8, 0.6]\\), and the predicted class is \\(\\operatorname{sign}(\\text{score})\\). Take a clean point \\(x = [-0.55, 0.95]\\). Its score is

\\[
0.8(-0.55) + 0.6(0.95) = -0.44 + 0.57 = 0.13 > 0 \\Rightarrow \\text{class }+.
\\]

The point is correctly on the positive side, but only just — its score is a thin \\(0.13\\) above zero. Now apply FGSM. For a correctly-classified positive example, the direction that *increases* the loss is the direction that *decreases* the score, which is \\(-\\operatorname{sign}(w) = [-1, -1]\\). With budget \\(\\varepsilon = 0.1\\):

\\[
x' = x + \\varepsilon \\cdot [-1, -1] = [-0.65,\\ 0.85].
\\]

The new score is \\(0.8(-0.65) + 0.6(0.85) = -0.52 + 0.51 = -0.01 < 0\\) — the label has **flipped** to class \\(-\\). The point moved by exactly \\(0.1\\) in each coordinate, an L-infinity distance of \\(0.1\\), yet the score swung by \\(\\varepsilon\\,\\|w\\|_1 = 0.1(0.8 + 0.6) = 0.14\\), more than enough to cross from \\(+0.13\\) to below zero. Notice the score change \\(0.14\\) is larger than either individual coordinate's contribution — the budget spent on *both* aligned coordinates added up. That additive effect, multiplied across thousands of dimensions in a real image, is why the attack is so cheap.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `1. With \\(w = [1, -1]\\) and clean point \\(x = [0.3, 0.4]\\), compute the score, identify the predicted class, then build the FGSM perturbation and the perturbed point at \\(\\varepsilon = 0.2\\). *(Score \\(= 0.3 - 0.4 = -0.1 < 0\\Rightarrow\\) class \\(-\\). To raise the loss on a correctly-classified negative example, push the score back up toward the boundary, i.e. move along \\(+\\operatorname{sign}(w) = [+1, -1]\\), giving \\(\\delta = \\varepsilon[+1,-1] = [0.2,-0.2]\\), \\(x' = [0.5, 0.2]\\), new score \\(= 0.5 - 0.2 = 0.3 > 0\\) — the label flips to \\(+\\).)*

2. Explain in one sentence why random noise of the same L-infinity size as an FGSM perturbation usually fails to flip the label. *(Random noise is not aligned with \\(w\\), so its per-coordinate score contributions cancel rather than add up.)*

3. A paper reports 95% accuracy under FGSM but 3% under PGD. Name the phenomenon and what it tells you. *(Gradient masking / obfuscated gradients — the FGSM number is an artifact; the model is not genuinely robust.)*

4. The score change under FGSM is \\(\\varepsilon \\|w\\|_1\\). Explain why this means the attack gets *easier* as input dimension grows, holding \\(\\varepsilon\\) fixed. *(More coordinates means a larger \\(\\|w\\|_1\\) sum, so the same per-pixel budget produces a bigger total score swing.)*`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Goodfellow, Shlens & Szegedy — "Explaining and Harnessing Adversarial Examples" (FGSM)](https://arxiv.org/abs/1412.6572) — the linear-explanation argument and the original FGSM attack.
- [Madry et al. — "Towards Deep Learning Models Resistant to Adversarial Attacks" (PGD)](https://arxiv.org/abs/1706.06083) — the min-max formulation of adversarial training and PGD as the canonical attack.`,
      },
    ],
  },
];
