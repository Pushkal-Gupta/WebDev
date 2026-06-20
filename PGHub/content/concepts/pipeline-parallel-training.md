---
slug: pipeline-parallel-training
module: sd-microservices
title: Pipeline-Parallel Training
subtitle: Split the model into stages along the layer dimension, stream micro-batches through them assembly-line style.
difficulty: Advanced
position: 81
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism — Huang et al."
    url: "https://arxiv.org/abs/1811.06965"
    type: paper
  - title: "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM (1F1B interleaved) — Narayanan et al."
    url: "https://arxiv.org/abs/2104.04473"
    type: paper
  - title: "HuggingFace Transformers — Methods and tools for multi-GPU training"
    url: "https://huggingface.co/docs/transformers/perf_train_gpu_many"
    type: docs
status: published
---

## intro
Pipeline parallelism splits the model along the layer dimension. Stage 0 holds layers 1-12, stage 1 holds layers 13-24, and so on across as many devices as needed. Activations flow forward from stage to stage; gradients flow backward in reverse. The trick that makes this fast is micro-batching: chop one mini-batch into M small micro-batches and stream them through the stages so every device is busy almost all of the time.

## whyItMatters
Pipeline parallelism is the lever that lets you train a model that does not fit on one GPU's memory, even if the largest single tensor still fits. GPipe (Google, 2018) and PipeDream / Megatron-LM 1F1B (Microsoft and NVIDIA) are the canonical schedules; every multi-billion-parameter LLM training run uses some flavor of pipeline parallelism stacked with tensor and data parallelism (the "3D parallelism" of DeepSpeed and Megatron). Interview answers that only mention data parallelism reveal the candidate has never had to train a model larger than memory.

## intuition
Imagine you have a 48-layer transformer and four GPUs. Cut the model into four stages of 12 layers each and place one stage on each GPU. The first forward call sends activations 0 -> 1 -> 2 -> 3; the backward then sends gradients 3 -> 2 -> 1 -> 0. Naively, this is a model-parallel waste: while stage 0 is computing the forward, stages 1, 2, 3 are idle. While stage 3 is computing the backward, stages 0, 1, 2 are idle. Utilization is ~25%, plus the latency cost of activation transfer between devices.

The fix is micro-batching. Split the mini-batch of size B into M micro-batches of size B/M. As soon as stage 0 finishes the forward on micro-batch 1, it ships activations to stage 1 and immediately starts the forward on micro-batch 2. Stage 1 starts on micro-batch 1 while stage 0 is busy with micro-batch 2. After a warm-up period of M-1 ticks, every stage is busy every tick — the assembly line is full. This is the GPipe schedule. The remaining inefficiency is the warm-up and cool-down "bubbles" at the start and end of the pipeline, where some stages are still idle; the bubble fraction is (P-1)/M for P stages and M micro-batches. Choose M >> P and the bubble is small.

A cleverer schedule is **1F1B (one forward, one backward)** from PipeDream. Once a stage has done a forward on a micro-batch, it does the backward on an earlier micro-batch before starting the next forward. This bounds the number of in-flight activations per stage to P, dramatically cutting activation memory compared to GPipe (which holds all M micro-batches' activations on stage 0). Megatron-LM's "interleaved 1F1B" goes further: each device owns several non-contiguous chunks of layers, and the chunks rotate, halving the bubble at the cost of more inter-stage messages.

## visualization
```
GPipe schedule, P=4 stages, M=4 micro-batches (F = forward, B = backward, '.' = idle):

         time ->
stage 0  F1 F2 F3 F4 .  .  .  B4 B3 B2 B1
stage 1  .  F1 F2 F3 F4 .  B4 B3 B2 B1 .
stage 2  .  .  F1 F2 F3 F4 B4 B3 B2 B1 .  .
stage 3  .  .  .  F1 F2 F3 F4 B4 B3 B2 B1 .  .  .
                                  ^^^^^^^ pipeline drain
         ^^^^^^^^^^ pipeline fill (the "bubble")
         steady state in the middle: every stage busy every tick.
```

## bruteForce
The naive alternative is plain layer-wise model parallelism without micro-batching: stage 0 runs the full mini-batch forward, then stage 1, then stage 2, then stage 3, then the backward unwinds the same way. Each stage does its job once per step, the others are idle, and utilization is roughly 1/P. For P=8 that is 12.5% GPU efficiency — you bought 8 GPUs to get the throughput of 1. Acceptable only when the model truly does not fit and you cannot use tensor parallel or ZeRO.

## optimal
**1F1B with interleaved stages** is the production default for large LLM training. The schedule:

1. Cut the model into P stages along the depth dimension. With interleaving, each stage holds V "virtual" chunks of layers spread through the network, giving P*V chunks total. V=2 or V=4 is typical.
2. Cut the mini-batch into M micro-batches with M >> P (M = 64 or 128 is common).
3. Each stage executes the loop: pop a micro-batch from its forward queue, do the forward, push activations to the next stage; pop an earlier micro-batch from its backward queue, do the backward, push gradients to the previous stage. Alternate one forward and one backward per stage tick.
4. After all M micro-batches have completed forward and backward on every stage, accumulate the per-micro-batch gradients into one mini-batch gradient and run the optimizer step.

Why 1F1B beats GPipe in practice: GPipe holds M micro-batches' activations on stage 0 simultaneously, so activation memory is O(M * activations_per_stage). 1F1B caps in-flight micro-batches per stage at P, so activation memory is O(P * activations_per_stage). For M=64, P=4 that is a 16x reduction. Interleaved 1F1B then shrinks the bubble from (P-1)/M to (P-1)/(M*V).

Implementation details:
- **Activation checkpointing** inside each stage trades recompute for memory: only save activations at stage boundaries, recompute the internal forward during the backward.
- **Bidirectional point-to-point sends** (NCCL `ncclSend` / `ncclRecv`) move activations and gradients. With NVLink they overlap with compute.
- **Gradient accumulation** is implicit — the M per-micro-batch gradients sum into a single mini-batch gradient before the optimizer step.
- **3D parallelism** stacks pipeline parallel (depth), tensor parallel (per-layer width), and data parallel (replicas). Megatron-LM's published 1T-parameter run used PP=64, TP=8, DP=many.

The schedule is the algorithm; the algorithm is dictated by what the hardware lets you keep busy. Cut by depth, stream by micro-batch, schedule 1F1B, interleave for the bubble — that is the whole recipe.

## complexity
Compute per micro-batch per stage: O(layers_per_stage * micro_batch_size). End-to-end mini-batch wall time: (M + P - 1) * t_stage with naive GPipe, where t_stage is one micro-batch's per-stage forward+backward; the bubble fraction is (P-1)/M of total time. Interleaved 1F1B shrinks the bubble fraction to (P-1)/(M*V). Per-stage activation memory: O(M) on GPipe, O(P) on 1F1B. Inter-stage communication: O(activation_size_at_boundary) per micro-batch per pipeline hop.

## pitfalls
- Choosing too few micro-batches. M = P means a 50% bubble; M >> P (16x or more) is required to make pipeline parallel pay off.
- Forgetting activation checkpointing. Storing activations for every micro-batch on every stage will OOM long before compute saturates.
- Putting BatchNorm or LayerNorm across stage boundaries. Layer-internal normalization is fine, but cross-stage statistics require an extra collective that breaks the pipeline schedule.
- Mismatched recompute and forward. If activation checkpointing recomputes a layer with a different RNG state (dropout, stochastic depth) the gradient is wrong; seed RNG per micro-batch and per stage.
- Imbalanced stages. If one stage is 2x the FLOPs of the others, it bottlenecks every tick and the rest of the pipeline waits on it; balance by parameter count *and* FLOPs, not just layer count.
- Pipeline-parallel with tiny mini-batches (B < P micro-batches) — you cannot even fill the pipe; switch to tensor parallel or ZeRO instead.

## interviewTips
- Open with the picture: split by layer, stream micro-batches, schedule 1F1B. The interviewer wants to see you can describe the assembly-line analogy concretely.
- Be explicit about the bubble: (P-1)/M for GPipe, (P-1)/(M*V) for interleaved 1F1B. Bringing real numbers signals you have measured this.
- Mention 3D parallelism (PP * TP * DP) — pipeline parallel is rarely used alone at scale, and showing you know how it composes with the other two is the senior-engineer move.

## code.python
```python
# Sketch of a 1F1B pipeline schedule. PyTorch's torch.distributed.pipeline.sync
# or DeepSpeed's PipelineEngine implement this for real.

def pipeline_1f1b(stages, micro_batches, num_stages):
    fwd_queue = [[] for _ in range(num_stages)]
    bwd_queue = [[] for _ in range(num_stages)]
    # Warm-up: each stage runs forwards until the pipe is full.
    for i in range(num_stages):
        for j in range(num_stages - i):
            mb = micro_batches[i + j]
            act = stages[i].forward(mb)
            if i + 1 < num_stages:
                send(act, to=i + 1)
            fwd_queue[i].append(mb)

    # Steady state: each stage does one backward then one forward per tick.
    remaining = len(micro_batches) - num_stages
    for _ in range(remaining):
        for i in reversed(range(num_stages)):
            mb_bwd = bwd_queue[i].pop(0)
            grad = stages[i].backward(mb_bwd)
            if i > 0:
                send(grad, to=i - 1)
        for i in range(num_stages):
            mb_fwd = micro_batches[fwd_queue[i][-1] + 1]
            act = stages[i].forward(mb_fwd)
            if i + 1 < num_stages:
                send(act, to=i + 1)
            fwd_queue[i].append(mb_fwd)

    # Drain: only backwards remain.
    for _ in range(num_stages):
        for i in reversed(range(num_stages)):
            if not bwd_queue[i]:
                continue
            mb = bwd_queue[i].pop(0)
            grad = stages[i].backward(mb)
            if i > 0:
                send(grad, to=i - 1)

    for stage in stages:
        stage.optimizer_step()  # accumulated mini-batch gradient
```

## code.javascript
```javascript
// Pipeline-parallel sketch with a 1F1B schedule.
async function pipelineStep(stages, microBatches) {
  const P = stages.length;
  const M = microBatches.length;
  const inFlight = stages.map(() => []);

  // Warm-up: fill the pipeline.
  for (let i = 0; i < P; i++) {
    for (let j = 0; j < P - i; j++) {
      const mb = microBatches[i + j];
      const act = await stages[i].forward(mb);
      if (i + 1 < P) await sendTo(i + 1, act);
      inFlight[i].push(mb);
    }
  }
  // Steady state: 1 forward + 1 backward per stage per tick.
  for (let t = 0; t < M - P; t++) {
    for (let i = P - 1; i >= 0; i--) {
      const grad = await stages[i].backward(inFlight[i].shift());
      if (i > 0) await sendTo(i - 1, grad);
    }
    for (let i = 0; i < P; i++) {
      const next = microBatches[inFlight[i].length + P + t];
      const act = await stages[i].forward(next);
      if (i + 1 < P) await sendTo(i + 1, act);
      inFlight[i].push(next);
    }
  }
  // Drain and step.
  for (const s of stages) await s.optimizerStep();
}
```

## code.java
```java
// Pipeline schedule sketch (1F1B).
class PipelineTrainer {
    final List<Stage> stages;
    final int P;
    void runMiniBatch(List<MicroBatch> mbs) {
        Deque<MicroBatch>[] queues = new ArrayDeque[P];
        // Warm-up
        for (int i = 0; i < P; i++) {
            for (int j = 0; j < P - i; j++) {
                MicroBatch mb = mbs.get(i + j);
                Tensors act = stages.get(i).forward(mb);
                if (i + 1 < P) send(i + 1, act);
                queues[i].add(mb);
            }
        }
        // Steady state
        for (int t = 0; t < mbs.size() - P; t++) {
            for (int i = P - 1; i >= 0; i--) {
                Tensors g = stages.get(i).backward(queues[i].poll());
                if (i > 0) send(i - 1, g);
            }
            for (int i = 0; i < P; i++) {
                MicroBatch next = mbs.get(/* next index */ 0);
                Tensors act = stages.get(i).forward(next);
                if (i + 1 < P) send(i + 1, act);
                queues[i].add(next);
            }
        }
        for (Stage s : stages) s.optimizerStep();
    }
}
```

## code.cpp
```cpp
// 1F1B pipeline-parallel driver sketch.
void run_minibatch(std::vector<Stage>& stages,
                   std::vector<MicroBatch>& mbs) {
    const int P = stages.size();
    std::vector<std::deque<MicroBatch>> queues(P);

    // Warm-up: P-i forwards per stage i.
    for (int i = 0; i < P; ++i) {
        for (int j = 0; j < P - i; ++j) {
            auto act = stages[i].forward(mbs[i + j]);
            if (i + 1 < P) send(i + 1, act);
            queues[i].push_back(mbs[i + j]);
        }
    }
    // Steady state: alternate one backward per stage, then one forward per stage.
    for (size_t t = 0; t + P < mbs.size(); ++t) {
        for (int i = P - 1; i >= 0; --i) {
            auto grad = stages[i].backward(queues[i].front());
            queues[i].pop_front();
            if (i > 0) send(i - 1, grad);
        }
        for (int i = 0; i < P; ++i) {
            auto& mb = mbs[/* next index */ 0];
            auto act = stages[i].forward(mb);
            if (i + 1 < P) send(i + 1, act);
            queues[i].push_back(mb);
        }
    }
    for (auto& s : stages) s.optimizer_step();
}
```
