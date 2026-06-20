---
slug: mixed-precision-training
module: sd-microservices
title: Mixed-Precision Training
subtitle: Run forward and backward in FP16 or BF16, keep an FP32 master copy of the weights, scale the loss to save the tiny gradients.
difficulty: Advanced
position: 83
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Mixed Precision Training — Micikevicius et al. (ICLR 2018)"
    url: "https://arxiv.org/abs/1710.03740"
    type: paper
  - title: "NVIDIA Mixed Precision Training Documentation"
    url: "https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html"
    type: docs
  - title: "PyTorch DistributedDataParallel notes"
    url: "https://docs.pytorch.org/docs/stable/notes/ddp.html"
    type: docs
status: published
---

## intro
Mixed-precision training runs the heavy matmuls and convolutions in 16-bit floating point (FP16 or BF16) while keeping a 32-bit master copy of the weights for the optimizer step. Tensor Core hardware in V100, A100, H100, and TPU v3+ executes 16-bit matmuls 2-8x faster than FP32 and uses half the memory. Done right, it produces the same final accuracy as FP32 training. The two non-obvious pieces are loss scaling (FP16 only) and the FP32 master weights.

## whyItMatters
Every modern training stack defaults to mixed precision. PyTorch `torch.cuda.amp`, TensorFlow `mixed_float16`, JAX `bfloat16` policies, DeepSpeed and Megatron-LM all assume it. Without mixed precision, training GPT-3-class models on A100s would take 3-8x longer and the activations would not even fit in HBM. Any interview that touches GPU training cost — pretraining budget, memory math, throughput — depends on candidates knowing what mixed precision buys, what BF16 vs FP16 buys, and what loss scaling fixes.

## intuition
FP16 has a sign bit, 5 exponent bits, and 10 mantissa bits. Its dynamic range is roughly 6e-8 to 65504. Two failure modes hit you in training:

1. **Underflow** in gradients. Gradients near the end of training can be 1e-7 or smaller. Cast them to FP16 and they round to zero. The optimizer step then becomes a no-op for those parameters and convergence stalls.
2. **Overflow** in activations or losses. A loss above ~65000 wraps around to infinity in FP16; one bad batch and your gradients are all NaN.

The fix for (1) is **loss scaling**: multiply the loss by a constant S (typically 2^15 = 32768) before the backward pass. By the chain rule every gradient is also multiplied by S, lifting the tiny values into FP16's representable range. After the backward, you divide the gradients by S before the optimizer step. The numerical effect is identical to unscaled training, except the bits that would have been underflow zeros now carry signal. Dynamic loss scaling raises S until you see a NaN, then halves S — automating the tuning.

The fix for (2) is **master weights in FP32**. The optimizer keeps the canonical weights in FP32, but each forward casts them down to FP16 for the matmul. The Adam moments (which involve squares of gradients) also live in FP32, otherwise they underflow. After the optimizer step updates the FP32 master copy, the FP16 weights are re-derived as a downcast view. Memory cost: weights stored twice, but the FP32 copy is the one of record.

BF16 is the alternative. It keeps FP32's exponent range (8 bits, same dynamic range as FP32) but only 7 mantissa bits. Gradients underflow far less often, so **loss scaling is not needed** for BF16, and you can often skip the FP32 master weights (though optimizer moments still want FP32). BF16 is the default on A100 / H100 / TPU; FP16 lingers on V100 and older hardware that lacks BF16 silicon.

## visualization
```
mixed-precision step (FP16 path with loss scaling):

  FP32 master weights  ----cast down---->  FP16 weights
                                              |
                                              v
  input ----------> forward pass (FP16) ----> activations (FP16) ----> loss (FP32)
                                                                          |
                                                                          v
                                                                  loss * S (scale up)
                                                                          |
                                                                          v
                              backward pass (FP16) <--------- scaled loss
                                       |
                          FP16 gradients (lifted into range)
                                       |
                                  cast up to FP32
                                       |
                                divide by S (unscale)
                                       |
                                       v
                             Adam step on FP32 master weights ----> repeat
```

## bruteForce
The fallback is full FP32 training. Every weight, activation, gradient, and optimizer state lives in 32-bit float. Numerically the safest path — no loss scaling, no master copy gymnastics — but you pay double memory for everything and lose the 2-8x speedup from Tensor Core matmuls. A 7B model in pure FP32 needs roughly 28 GB just for the weights, plus 28 GB for gradients and 56 GB for Adam optimizer states, blowing past a single A100. Pure FP32 is fine for prototypes and small models; impossible for anything LLM-scale.

## optimal
**Automatic mixed precision with FP32 master weights + dynamic loss scaling (FP16) or BF16 with FP32 optimizer state.** The recipe codified in `torch.cuda.amp.autocast` + `GradScaler`:

1. **Master weights in FP32.** The model's `.parameters()` storage is FP32. These are what the optimizer actually steps on.
2. **Autocast region** wraps the forward pass. Inside, matmuls and convolutions execute in FP16/BF16. Operations that need numerical headroom — softmax, LayerNorm reduction, loss reduction, exponentials — stay in FP32. The list of "safe to downcast" vs "must stay FP32" ops is hard-coded into the framework.
3. **Loss scaling** (FP16 only). The scaler multiplies the loss by a running scale factor before `loss.backward()`. After the backward, the scaler divides the FP32-promoted gradients by the same factor and then calls `optimizer.step()`. If any gradient is inf or NaN, the scaler skips the step and halves the scale; if 2000 consecutive steps succeed, it doubles the scale.
4. **Optimizer moments in FP32.** Adam's m and v stay FP32 even if the master weights are BF16, because `v = beta2 * v + (1 - beta2) * g^2` underflows hard in lower precision.
5. **Gradient clipping after unscale.** Norm clipping must operate on unscaled FP32 gradients to give the correct norm.

For BF16, the recipe simplifies: the same autocast region, but no GradScaler. Sufficient dynamic range makes loss scaling unnecessary. BF16 master weights work for inference-style fine-tuning but introduce slow drift in long pretraining runs, so most LLM training keeps FP32 master copies even with BF16 autocast.

The throughput win comes from Tensor Cores: A100 hits 312 TFLOPS in FP16/BF16 versus 19.5 TFLOPS in FP32 (16x raw, ~3-4x end-to-end after memory bottlenecks). The memory win comes from halving activation footprint, which buys headroom for larger batch size or longer sequences. Combine with ZeRO and you get a multiplicative effect.

## complexity
Compute: matmuls and convs run at 2-8x FP32 throughput on Tensor Core hardware (A100: 16x raw FP16 / FP32 ratio, ~3x end-to-end). Memory: activations halve, gradients halve, FP16 weights halve; the FP32 master weights add overhead so net weight memory is 1.5x FP16-only but 0.75x of pure FP32. Convergence: matches FP32 within noise when loss scaling and master weights are configured correctly; diverges or stalls if either is missing.

## pitfalls
- Skipping the FP32 master weights. Storing weights in pure FP16 makes optimizer updates round to zero (1e-4 LR times a 1e-3 gradient is 1e-7, below FP16's smallest normal); training stalls silently.
- FP16 without loss scaling. Gradient underflow shows up as a flat loss curve after the first epoch. Always pair FP16 with `GradScaler` or its equivalent.
- Using FP16 LayerNorm or softmax reductions. The internal mean/variance sums exceed FP16 range; force these ops to FP32 (most frameworks do this automatically — verify yours does).
- Clipping gradients before unscaling. `torch.nn.utils.clip_grad_norm_` on scaled gradients gives a norm that is S times too large; the threshold is wrong and clipping does nothing.
- Casting BatchNorm running stats to FP16. Running means and variances drift over millions of steps and need FP32 precision; their parameters are cheap to keep in FP32.

## interviewTips
- Lead with the two halves: "Run matmuls in FP16 or BF16 for Tensor Core speed and half memory; keep an FP32 master copy and FP32 optimizer state so updates do not underflow."
- Distinguish FP16 from BF16: same width, BF16 trades mantissa for exponent so loss scaling is not required; FP16 needs dynamic loss scaling.
- Mention the specific things that must stay FP32: softmax reductions, LayerNorm statistics, loss reduction, optimizer moments. The interviewer is checking that you have actually debugged a NaN in mixed-precision training.

## code.python
```python
# PyTorch AMP: FP16 autocast + dynamic loss scaling + FP32 master weights.
import torch
from torch.cuda.amp import autocast, GradScaler

model = build_model().cuda()                     # FP32 master weights
opt = torch.optim.AdamW(model.parameters(), lr=1e-4)  # FP32 moments
scaler = GradScaler()                            # dynamic loss scaler

for batch in loader:
    opt.zero_grad(set_to_none=True)
    with autocast(dtype=torch.float16):          # matmuls / convs cast to FP16
        out = model(batch.x)
        loss = loss_fn(out, batch.y)             # cross-entropy stays FP32
    scaler.scale(loss).backward()                # backward in FP16, gradients lifted by S
    scaler.unscale_(opt)                         # divide gradients by S, promote to FP32
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # clip on unscaled grads
    scaler.step(opt)                             # skip step if any NaN
    scaler.update()                              # adjust S up/down
```

## code.javascript
```javascript
// Pseudo-code for a mixed-precision training step.
function mixedPrecisionStep(model, batch, scaler, opt) {
  const masterFP32 = model.weightsFP32;             // canonical copy
  syncWeightsToFP16(masterFP32, model.weightsFP16); // cast down for matmul
  // Forward + loss; matmuls run in FP16, softmax/LN reductions in FP32.
  const loss = autocast(() => model.forward(batch.x).crossEntropy(batch.y));
  const scaled = loss * scaler.scale;
  const gradsFP16 = backward(scaled);
  const gradsFP32 = promoteAndDivide(gradsFP16, scaler.scale);
  if (anyNanOrInf(gradsFP32)) {
    scaler.scale *= 0.5;                            // backoff, skip step
    return;
  }
  clipGradNorm(gradsFP32, 1.0);
  opt.step(masterFP32, gradsFP32);                  // Adam in FP32
  scaler.maybeBumpScale();                          // double after 2000 good steps
}
```

## code.java
```java
// Sketch of mixed-precision step: FP32 master, FP16 forward, scaled loss.
class MixedPrecisionTrainer {
    final Model model;                  // FP32 master weights
    final FP16View fp16Weights;         // downcast view, refreshed each step
    final Optimizer opt;                // FP32 moments
    float lossScale = 1 << 15;          // dynamic, starts at 32768

    void step(Batch batch) {
        fp16Weights.refreshFrom(model.weightsFP32());
        Tensor loss = model.forwardFP16(batch); // matmul Tensor Cores
        Tensor scaled = loss.mul(lossScale);
        Tensors gradsFP16 = scaled.backward();
        Tensors gradsFP32 = gradsFP16.toFP32().div(lossScale);
        if (gradsFP32.hasNanOrInf()) { lossScale /= 2; return; }
        gradsFP32.clipNorm(1.0f);
        opt.applyFP32(model.weightsFP32(), gradsFP32);
    }
}
```

## code.cpp
```cpp
// CUDA mixed-precision step using cuBLAS Tensor Core matmul (FP16 in, FP32 accum)
// + FP32 master weights + dynamic loss scaling.
void mixed_precision_step(Model& model, Batch& batch, float& loss_scale,
                          cudaStream_t stream) {
    cast_fp32_to_fp16(model.fp32_weights, model.fp16_weights, stream);
    auto loss = model.forward_fp16(batch, stream);          // FP32 accumulators
    auto scaled = loss * loss_scale;
    auto grads_fp16 = backward(scaled, stream);
    auto grads_fp32 = cast_to_fp32_and_div(grads_fp16, loss_scale, stream);
    if (has_nan_or_inf(grads_fp32, stream)) { loss_scale *= 0.5f; return; }
    clip_grad_norm(grads_fp32, 1.0f, stream);
    model.optimizer.step(model.fp32_weights, grads_fp32);   // FP32 Adam moments
}
```
