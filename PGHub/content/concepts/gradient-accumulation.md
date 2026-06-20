---
slug: gradient-accumulation
module: sd-microservices
title: Gradient Accumulation
subtitle: When the target batch will not fit in memory, run N small forward/backward passes and step once on their summed gradient.
difficulty: Intermediate
position: 84
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "HuggingFace Accelerate — Gradient Accumulation"
    url: "https://huggingface.co/docs/accelerate/usage_guides/gradient_accumulation"
    type: docs
  - title: "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour — Goyal et al."
    url: "https://arxiv.org/abs/1706.02677"
    type: paper
  - title: "PyTorch DistributedDataParallel notes (no_sync context manager)"
    url: "https://docs.pytorch.org/docs/stable/notes/ddp.html"
    type: docs
status: published
---

## intro
Gradient accumulation simulates a large batch size when the physical batch does not fit in GPU memory. Instead of one forward/backward/step at batch B, run N forward/backwards at micro-batch B/N and sum the gradients into the same buffer, then run one optimizer step. The math is identical to a single step at batch B (with the loss averaged correctly), and the memory footprint is that of a single micro-batch. It is the cheapest scaling lever in the training toolbox.

## whyItMatters
Every modern training recipe — from a hobbyist fine-tuning Llama-7B on one consumer GPU to GPT-4-scale pretraining — uses gradient accumulation to hit a target global batch size that the hardware cannot fit in one shot. Effective batch size is a primary hyperparameter (it governs the learning-rate schedule, the optimizer's signal-to-noise ratio, and convergence dynamics) and gradient accumulation lets you decouple it from per-device memory. Any interview probing distributed training will check that the candidate knows how to handle a micro-batch of 1 with a target batch of 1024 — gradient accumulation is the answer.

## intuition
Gradients of a sum equal the sum of gradients: grad(L(b1) + L(b2) + ... + L(bN)) = grad(L(b1)) + grad(L(b2)) + ... + grad(L(bN)). One backward pass on a batch of size B = N * b produces exactly the same gradient as N backward passes on batches of size b, each accumulated into the same parameter `.grad` buffer. The optimizer cannot tell the difference.

PyTorch (and most modern frameworks) keep gradients in a persistent `.grad` tensor on each parameter. Each `loss.backward()` call **adds** to `.grad` rather than overwriting it; `optimizer.zero_grad()` is what resets it. The trick is to:

1. Forward + backward on micro-batch 1, do **not** call zero_grad. The gradient lands in `.grad`.
2. Forward + backward on micro-batch 2. The new gradients are added to the existing `.grad`. Same for 3, ..., N.
3. Call `optimizer.step()` once. The step uses the accumulated sum (or average, depending on how you scaled the loss).
4. Call `optimizer.zero_grad()` to reset for the next macro-step.

The one numerical subtlety is how the loss is averaged. If your loss function uses `reduction='mean'`, each micro-batch's loss is already divided by b, and accumulating N of them gives sum_i mean_i which is N * true_mean. You must divide by N (or scale each micro-batch's loss by 1/N) to recover the true mean. For `reduction='sum'`, the accumulated gradient is the genuine sum and you divide once at the end if your hyperparameters expect a mean.

The pattern composes with everything else. In data-parallel training, gradient accumulation has a subtle interaction: every backward triggers an all-reduce. If you accumulate N micro-batches and let each one all-reduce, you pay N times the comm cost for no extra signal. The fix is the `no_sync()` context manager (PyTorch DDP) or its equivalent — skip the all-reduce on the first N-1 micro-batches, then sync on the last one.

## visualization
```
gradient accumulation, N=4 micro-batches, target global batch = 4*b:

  tick 0:  forward(mb_0)  ->  backward(mb_0)  ->  .grad += g_0   (no step, no zero_grad)
  tick 1:  forward(mb_1)  ->  backward(mb_1)  ->  .grad += g_1
  tick 2:  forward(mb_2)  ->  backward(mb_2)  ->  .grad += g_2
  tick 3:  forward(mb_3)  ->  backward(mb_3)  ->  .grad += g_3
                                                    |
                                          .grad = g_0 + g_1 + g_2 + g_3
                                                    |
                                                    v
                                     optimizer.step()    -> single update
                                     optimizer.zero_grad() -> reset
  net effect: one optimizer step on the gradient of a batch of size 4*b.
```

## bruteForce
The fallback is "just lower the batch size and step every micro-batch." Each forward/backward triggers an immediate optimizer step on a small-batch gradient. The math is no longer the same as training at batch B — the optimizer takes 4x more steps at 1/4 the batch, and the noise statistics of SGD shift. For small models with stable losses this is fine; for transformer pretraining or anything sensitive to batch-noise hyperparameters (BatchNorm statistics, large-batch LR rules, Adam moment estimation) it changes convergence behavior and forces a hyperparameter re-tune.

## optimal
**Accumulate N micro-batch gradients in-place, then call optimizer.step() once.** The reference pattern:

1. Choose target global batch B and physical micro-batch size b such that b fits in memory; set N = B / b.
2. Average the loss over the micro-batch (`reduction='mean'`) and divide by N so the accumulated sum equals the mean over the global batch.
3. Loop: `loss.backward()` for each micro-batch without zeroing grads.
4. After N micro-batches, optionally `clip_grad_norm_` on the accumulated gradient (clip operates on the full-batch gradient, not the per-micro-batch one).
5. `optimizer.step()`, then `optimizer.zero_grad(set_to_none=True)`.

For data-parallel training, wrap the first N-1 backwards in `model.no_sync()` so DDP skips the all-reduce; the Nth backward runs the all-reduce normally. This cuts comm cost by N. HuggingFace Accelerate's `accelerator.accumulate(model)` context manager does this automatically.

A subtle correctness note for variable-length micro-batches: when token counts differ across micro-batches (causal LM with padding), dividing each micro-batch's loss by its own token count and then summing gives the wrong global average. The fix is to gather the total non-padded token count across all micro-batches first, then divide each micro-batch's `reduction='sum'` loss by that total before backward. Skipping this step inflates the gradient on micro-batches with short sequences and silently distorts pretraining loss.

Activation checkpointing pairs naturally with gradient accumulation: recompute activations in the backward pass, drop them from memory after each micro-batch. The two combined let you train models 4-10x larger than would otherwise fit, at the cost of one extra forward per micro-batch.

## complexity
Compute: identical to one large-batch forward+backward — N micro-batches at cost b each total to one batch of size B. No saving, no waste. Memory: O(activations for one micro-batch) instead of O(activations for the full batch) — the whole point. Communication (DDP): one all-reduce per macro-step instead of N, when `no_sync()` is used. Wall-clock: matches large-batch training plus a tiny per-micro-batch loop overhead.

## pitfalls
- Forgetting to scale the loss by 1/N. Each micro-batch's `loss.mean()` is divided by b, and summing N of them gives N * true_mean; the gradient is N times too large.
- Calling `zero_grad()` between micro-batches. Erases the accumulated gradients and turns gradient accumulation into plain small-batch training.
- Letting DDP all-reduce on every micro-batch. Wastes N-1 all-reduces' worth of bandwidth; wrap the first N-1 in `model.no_sync()`.
- Variable-length sequence handling (causal LM). Dividing each micro-batch's loss by its own token count before summing weights short sequences too heavily; gather total non-padded tokens first, then divide once.
- Forgetting that BatchNorm statistics depend on the micro-batch size, not the accumulated batch. If your model uses BN, gradient accumulation does not give you the BN behavior of a large batch — switch to SyncBN, GroupNorm, or LayerNorm instead.
- Calling `clip_grad_norm_` per micro-batch instead of after accumulation. The norm of the partial gradient is meaningless; clip the accumulated full-batch gradient before the optimizer step.

## interviewTips
- Open with the math: "Gradient of a sum equals sum of gradients, so N small backwards into the same `.grad` buffer plus one optimizer step matches one large-batch step exactly."
- Mention the loss scaling: divide by N (or use `reduction='sum'` and divide once) so the accumulated gradient is the *mean* over the full batch, not N times the mean.
- Drop the DDP detail: `no_sync()` on the first N-1 backwards, sync on the last. That single sentence demonstrates you have actually run gradient accumulation in a distributed setting.

## code.python
```python
# Gradient accumulation with DDP + AMP.
import torch
from torch.cuda.amp import autocast, GradScaler

accum_steps = 8
scaler = GradScaler()

for macro_step, batches in enumerate(grouped(loader, accum_steps)):
    opt.zero_grad(set_to_none=True)
    for i, batch in enumerate(batches):
        sync_now = (i == accum_steps - 1)        # all-reduce only on the last micro-batch
        ctx = nullcontext() if sync_now else model.no_sync()
        with ctx, autocast(dtype=torch.float16):
            loss = model(batch.x).cross_entropy(batch.y) / accum_steps
        scaler.scale(loss).backward()             # adds into .grad
    scaler.unscale_(opt)
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    scaler.step(opt)
    scaler.update()
```

## code.javascript
```javascript
// Pseudo-code: accumulate gradients over N micro-batches.
async function macroStep(model, opt, microBatches) {
  const N = microBatches.length;
  opt.zeroGrad();
  for (let i = 0; i < N; i++) {
    const syncNow = (i === N - 1);
    await maybeNoSync(model, !syncNow);          // skip DDP all-reduce
    const loss = await model.forward(microBatches[i]).then(o => o.crossEntropy()) / N;
    await model.backward(loss);                  // adds into .grad
  }
  clipGradNorm(model.parameters(), 1.0);
  opt.step();
}
```

## code.java
```java
// Macro-step driver that accumulates N micro-batch gradients.
class AccumulatingTrainer {
    final Model model;
    final Optimizer opt;
    final int accumSteps;
    void macroStep(List<MicroBatch> batches) {
        opt.zeroGrad();
        for (int i = 0; i < batches.size(); i++) {
            boolean syncNow = (i == batches.size() - 1);
            try (var ignored = syncNow ? null : model.noSync()) {
                Tensor loss = model.forward(batches.get(i))
                                   .crossEntropy()
                                   .div(accumSteps);   // scale by N
                loss.backward();                       // adds into .grad
            }
        }
        model.clipGradNorm(1.0);
        opt.step();
    }
}
```

## code.cpp
```cpp
// Gradient accumulation driver with DDP no-sync on the first N-1 micro-batches.
void macro_step(Model& model, Optimizer& opt,
                std::vector<MicroBatch>& mbs, cudaStream_t stream) {
    const int N = mbs.size();
    opt.zero_grad(stream);
    for (int i = 0; i < N; ++i) {
        const bool sync_now = (i == N - 1);
        auto guard = sync_now ? NoSyncGuard{} : model.no_sync();
        auto loss = model.forward(mbs[i], stream).cross_entropy() / float(N);
        loss.backward(stream);                         // adds into .grad
    }
    model.clip_grad_norm(1.0f, stream);
    opt.step(stream);                                  // one optimizer update
}
```
