---
slug: data-parallel-training
module: sd-microservices
title: Data-Parallel Training
subtitle: Replicate the model across N workers, shard the batch, all-reduce the gradients each step.
difficulty: Advanced
position: 80
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "PyTorch DistributedDataParallel — notes"
    url: "https://docs.pytorch.org/docs/stable/notes/ddp.html"
    type: docs
  - title: "Bringing HPC Techniques to Deep Learning (ring all-reduce) — Andrew Gibiansky"
    url: "https://andrew.gibiansky.com/blog/machine-learning/baidu-allreduce/"
    type: blog
  - title: "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour — Goyal et al."
    url: "https://arxiv.org/abs/1706.02677"
    type: paper
  - title: "Collective operation — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Collective_operation"
    type: wiki
status: published
---

## intro
Data parallelism is the default lever for scaling neural-net training across many GPUs. Every worker holds a full copy of the model, each consumes a different slice of the global batch, and after the backward pass the workers run an all-reduce so every replica sees the averaged gradient. One optimizer step later, the replicas stay bit-for-bit identical and the next iteration begins. The pattern looks simple; the engineering is in the all-reduce.

## whyItMatters
Every modern training stack — PyTorch DDP, TensorFlow MirroredStrategy, JAX pjit data axes, Horovod, DeepSpeed ZeRO — is data-parallel at its core. It is the cheapest way to multiply throughput when the model fits on one device, and it is the foundation that pipeline parallelism, tensor parallelism, and ZeRO sharding stack on top of. Interview answers that conflate data parallelism with model parallelism, or that hand-wave the gradient sync, immediately signal the candidate has never actually scaled a training job past a single box.

## intuition
Picture the training loop as a state machine that repeats {forward, backward, step}. On one GPU, each iteration sees a mini-batch of size B and updates the weights once. If you have N GPUs, the obvious move is to feed each GPU a slice of size B/N (so the global batch is still B) and have each compute its own gradient on its own slice. The gradients on each replica are *different* — they were computed on different data — but if you average them, you recover the gradient you would have gotten on the full batch B running on a single device. Average means call all-reduce with op=SUM and divide by N.

The reason this works is linearity of the gradient: grad(loss(batch_1) + loss(batch_2)) = grad(loss(batch_1)) + grad(loss(batch_2)). The forward and backward are embarrassingly parallel across the batch dimension; only the gradient reduction couples the workers. So data parallelism keeps the workers fully busy on compute, and pays a fixed communication tax of one all-reduce of size |params| per training step.

The replicas must stay synchronized — if one drifts, the next forward pass uses different weights on different workers and your loss curve goes haywire. The synchronization is enforced two ways: each worker starts from the same broadcast init, and each step ends with a bit-exact all-reduce on every parameter's gradient. If the all-reduce is deterministic and floating-point reductions are done in the same order, the optimizer step produces identical weights everywhere. That is what "synchronous data parallel" means.

The two knobs you tune are global batch size (B = per_device_batch_size * N) and learning rate. Goyal et al. (2017) showed that linearly scaling the learning rate with batch size lets you train ImageNet in an hour with 256 GPUs without losing accuracy, modulo a warmup phase to avoid instability at the start.

## visualization
```
iter k:                                  worker 0      worker 1      worker 2      worker 3
   forward+backward on local shard  ->   grad_0        grad_1        grad_2        grad_3
                                            \            \            /            /
                                             \            \          /            /
                                              `----- all-reduce(SUM) ------'
                                              avg_grad   avg_grad   avg_grad   avg_grad
   optimizer.step()                       ->   w_new       w_new       w_new       w_new
                                              (identical on every worker, by construction)
```

## bruteForce
The naive approach is a parameter server: a designated coordinator owns the weights, every worker computes a local gradient and ships it to the coordinator, the coordinator averages, applies the step, and broadcasts new weights back. It works, but the coordinator's network link is the bottleneck — bandwidth scales as O(N * |params|) on the one machine that owns the parameters. At N = 64 GPUs and |params| = 1 GB this saturates instantly.

## optimal
The canonical answer is **synchronous data parallelism with ring all-reduce**, which is what PyTorch DDP, Horovod, and NCCL implement.

Ring all-reduce treats the N workers as a logical ring. Each gradient tensor is split into N chunks of equal size. The algorithm runs in two phases:
1. **Scatter-reduce** (N-1 steps): in step i, each worker sends one chunk to its neighbour and receives a chunk from the opposite neighbour, adding it into its local copy. After N-1 steps, each worker holds one chunk that is the full reduced sum.
2. **All-gather** (N-1 steps): each worker rotates its reduced chunk around the ring. After N-1 more steps, every worker holds every reduced chunk.

The per-step communication cost is O(|params| / N), and across all 2(N-1) steps the total bytes moved per worker is 2 * |params| * (N-1)/N — which approaches 2 * |params| as N grows. **The cost is independent of N.** That is the magic: doubling the GPU count does not double the network bill per worker. Compare to the parameter server's O(N * |params|) and the win is decisive at scale.

Implementation details that matter:
- **Bucketing**: DDP groups parameters into buckets of ~25 MB and launches one all-reduce per bucket. This overlaps comms with compute: while the backward is still running on layer 8, the all-reduce for layer 20's bucket is already in flight.
- **Gradient hooks on the backward pass**: as each parameter's gradient is produced, it is enqueued for reduction. The optimizer step waits only on the final bucket.
- **NCCL** is the backend on NVIDIA hardware; it uses NVLink + InfiniBand and lays out the ring to match the actual interconnect topology.
- **Init broadcast** ensures all replicas start from byte-identical weights.

Async parameter-server variants exist (stale gradients, Hogwild, EASGD) but synchronous DDP is the production default — it is deterministic, debuggable, and converges with the same hyperparameters as single-GPU training scaled by the linear-LR rule.

## complexity
Compute per worker per step: O(forward + backward on B/N samples) = linear-scaled wall time as N grows, modulo the all-reduce overhead. Communication per worker per step: O(|params|) bytes regardless of N (ring all-reduce is bandwidth-optimal). Memory per worker: full model + full optimizer state + activations for B/N samples — data parallelism does not reduce memory per device. Convergence: same step count to reach a target loss as single-GPU training at global batch B, assuming the linear-LR rule and warmup.

## pitfalls
- Forgetting to scale the learning rate when you change N. Doubling N (and thus global batch) without doubling the LR usually slows convergence to a crawl.
- Treating data parallel as a memory-saving trick. Every replica holds the full model and full optimizer state. To shrink per-device memory you need ZeRO, tensor parallel, or pipeline parallel.
- Calling `model.forward()` outside the DDP wrapper on rank 0 only — the autograd graph never registers the hooks and the all-reduce never fires.
- Drift from non-deterministic ops. BatchNorm with per-replica statistics, dropout with un-synced RNG, or floating-point reductions in non-deterministic order can desync replicas; over thousands of steps the divergence shows up as a NaN or accuracy gap.
- BatchNorm computing statistics on only the local shard (B/N samples). Use SyncBatchNorm so the mean/var are reduced across all replicas, otherwise small per-device batches hurt accuracy.

## interviewTips
- Lead with the right picture: "Every GPU holds the full model, processes a different slice of the batch, all-reduces gradients each step, and applies an identical optimizer step." That single sentence answers half the question.
- Be ready to explain ring all-reduce and why its per-worker cost is independent of N. The interviewer is checking that you have actually scaled past one box.
- Mention the linear-LR scaling rule and the warmup trick from the "ImageNet in 1 Hour" paper — it shows you understand the optimization side, not just the systems side.

## code.python
```python
# Synchronous data parallel with PyTorch DDP.
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def train(local_rank: int, world_size: int):
    dist.init_process_group("nccl", rank=local_rank, world_size=world_size)
    torch.cuda.set_device(local_rank)

    model = build_model().to(local_rank)
    model = DDP(model, device_ids=[local_rank], bucket_cap_mb=25)
    opt = torch.optim.SGD(model.parameters(), lr=0.1 * world_size)  # linear scale

    loader = build_distributed_loader(world_size, local_rank, batch_per_gpu=128)
    for batch in loader:
        x, y = batch
        opt.zero_grad(set_to_none=True)
        loss = model(x.to(local_rank)).cross_entropy(y.to(local_rank))
        loss.backward()         # backward triggers per-bucket all-reduce hooks
        opt.step()              # every replica now applies the identical update
    dist.destroy_process_group()
```

## code.javascript
```javascript
// Pseudo-code: data-parallel training across N workers using ring all-reduce.
async function dataParallelStep(model, batchShard, workers, ring) {
  const localGrad = await model.backward(model.forward(batchShard));
  const avgGrad = await ringAllReduce(localGrad, ring, /*op*/ 'sum');
  for (const k of Object.keys(avgGrad)) avgGrad[k] /= workers.length;
  model.optimizerStep(avgGrad);
}

async function ringAllReduce(tensor, ring, op) {
  const chunks = splitIntoChunks(tensor, ring.size);
  // Scatter-reduce: N-1 rotations, each adds neighbour's chunk into local copy.
  for (let step = 0; step < ring.size - 1; step++) {
    const sendIdx = (ring.rank - step + ring.size) % ring.size;
    const recvIdx = (ring.rank - step - 1 + ring.size) % ring.size;
    await ring.sendRecv(chunks[sendIdx], chunks[recvIdx], op);
  }
  // All-gather: another N-1 rotations to broadcast reduced chunks.
  for (let step = 0; step < ring.size - 1; step++) {
    const sendIdx = (ring.rank - step + 1 + ring.size) % ring.size;
    const recvIdx = (ring.rank - step + ring.size) % ring.size;
    await ring.sendRecv(chunks[sendIdx], chunks[recvIdx], 'copy');
  }
  return concatChunks(chunks);
}
```

## code.java
```java
// Sketch: synchronous data-parallel trainer using an all-reduce collective.
class DataParallelTrainer {
    final Model model;
    final Optimizer opt;
    final Collective coll; // wraps NCCL-like all-reduce
    final int worldSize;

    void step(Batch shard) {
        Tensors grad = model.backward(model.forward(shard));
        Tensors avg = coll.allReduce(grad, Op.SUM);
        avg.scale(1.0 / worldSize);
        opt.apply(avg); // identical update on every worker
    }
}
```

## code.cpp
```cpp
// Sketch using NCCL all-reduce after a local backward pass.
void train_step(Model& model, Optimizer& opt, ncclComm_t comm,
                cudaStream_t stream, const Batch& shard, int world_size) {
    auto grad = model.backward(model.forward(shard));
    for (auto& [name, g] : grad.tensors()) {
        ncclAllReduce(g.data(), g.data(), g.numel(),
                      ncclFloat, ncclSum, comm, stream);
    }
    cudaStreamSynchronize(stream);
    grad.scale(1.0f / world_size);
    opt.step(grad); // bit-identical update on every rank
}
```
