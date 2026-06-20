---
slug: tensor-parallel-training
module: sd-microservices
title: Tensor-Parallel Training
subtitle: Shard each layer's weight matrix across GPUs, with an all-reduce inside every forward and backward.
difficulty: Advanced
position: 82
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism — Shoeybi et al."
    url: "https://arxiv.org/abs/1909.08053"
    type: paper
  - title: "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM — Narayanan et al."
    url: "https://arxiv.org/abs/2104.04473"
    type: paper
  - title: "HuggingFace Transformers — multi-GPU training methods (tensor parallel section)"
    url: "https://huggingface.co/docs/transformers/perf_train_gpu_many"
    type: docs
status: published
---

## intro
Tensor parallelism cuts each individual layer's weight matrix across multiple GPUs. Instead of replicating the model (data parallel) or splitting it by depth (pipeline parallel), tensor parallel splits *within* a single matrix multiply. A linear layer y = x W becomes two matmuls on two GPUs whose partial results are combined with an all-reduce. Megatron-LM pioneered the row/column splitting recipe for transformer MLP and self-attention blocks; it is the inner ring of every billion-parameter LLM training stack.

## whyItMatters
When a single layer's weight matrix is too large to fit on one GPU (a 175B-parameter transformer has FFN matrices around 50 K x 50 K), data parallel and pipeline parallel are not enough — you need to slice the matrix itself. Megatron-LM's intra-layer parallelism, combined with NVLink for the per-step all-reduce, is what made GPT-3 / PaLM / LLaMA-class training tractable. Any senior interview that touches LLM infrastructure will probe this. Candidates who can name "row parallel followed by column parallel inside the MLP, one all-reduce per block" stand out instantly.

## intuition
Take a linear layer y = x W where x is shape (b, h) and W is shape (h, h). On one GPU this is a single matmul. With 2-way tensor parallel, you have two options for splitting W:

**Column-parallel**: split W into two halves along the *output* dimension: W = [W1 | W2], each W_i has shape (h, h/2). Each GPU computes y_i = x W_i locally, producing a (b, h/2) tile of the output. To combine, the GPUs *all-gather* the two halves — but if the next op is also column-parallel, you can skip the gather and pass the sharded output forward.

**Row-parallel**: split W along the *input* dimension: W = [W1; W2]^T stacked, each W_i has shape (h/2, h). You must also shard x along the hidden dim: x = [x1 | x2]. Each GPU computes a *partial* sum y_i = x_i W_i, both shape (b, h). To get the real y you all-reduce: y = sum(y_i).

The Megatron recipe for the transformer MLP is: column-parallel the first linear (h -> 4h), keep the sharded activations through GELU (it is elementwise so no comm), then row-parallel the second linear (4h -> h) which ends in one all-reduce. The two linears require **one all-reduce per forward and one per backward** per MLP block. The same recipe applies to self-attention: column-parallel Q, K, V projections (split by attention heads — embarrassingly natural), row-parallel the output projection, one all-reduce per attention forward + one per backward.

The activations stay sharded *between* the column-parallel output and the row-parallel input, so you never materialize the full intermediate tensor on any single GPU. That is the memory win — the largest layer in your model just got divided by N.

## visualization
```
2-way tensor parallel transformer MLP block (column-parallel into row-parallel):

  GPU 0:   x  --(col-parallel W1_a)--> z_a  --GELU--> a_a  --(row-parallel W2_a)--> y_a (partial)
  GPU 1:   x  --(col-parallel W1_b)--> z_b  --GELU--> a_b  --(row-parallel W2_b)--> y_b (partial)
                                                                                    \   /
                                                                                 all-reduce(SUM)
                                                                                     |
                                                                                     y (full)

  comm cost per block per direction: 1 all-reduce of size (b * h) on N tensor-parallel ranks.
  activations a_a, a_b are HALF-WIDTH on each GPU — never materialized full anywhere.
```

## bruteForce
The naive alternative when a layer is too big is to swap layer weights in and out of GPU memory between steps. CPU-offload, ZeRO-stage-3, or just chunking the matmul along the batch dimension all let you run the layer on a single GPU at the cost of PCIe-bandwidth swaps every step. They keep the math identical but pay a brutal latency tax; for the inner loop of LLM pretraining this is unacceptable. Tensor parallel solves the same problem with a single fast NVLink all-reduce instead of a slow PCIe shuffle.

## optimal
**Megatron-style tensor parallelism on transformer MLP + attention blocks**, paired with NVLink-connected GPUs.

The full recipe:

1. **MLP block** (h -> 4h -> h): column-parallel split the first linear so each rank owns a slice of the 4h hidden dimension; activations stay sharded across the GELU; row-parallel split the second linear so each rank multiplies its activation slice by its row slice of W2 and the partial sums are all-reduced into the final output. Total comm: 1 all-reduce forward, 1 all-reduce backward (the backward all-reduce comes from the column-parallel's input gradient).
2. **Self-attention**: split heads across ranks. Each rank owns h/N attention heads' Q, K, V projections (column-parallel by head, which is the natural axis since heads do not interact during softmax). Each rank computes its heads' attention output independently. Then the output projection is row-parallel and ends in one all-reduce. Comm: 1 all-reduce per direction per attention block, same as the MLP.
3. **LayerNorm and embeddings**: replicate LayerNorm (it is cheap and the parameters are tiny); the embedding lookup is column-parallel by vocab, with an all-reduce only at the loss layer.

The choice of all-reduce *inside* every layer means tensor parallelism is sensitive to interconnect latency. NVLink at ~600 GB/s makes this fast; cross-node (InfiniBand at ~50 GB/s) is 10x slower and tensor parallelism degrades sharply. The practical rule: **tensor-parallel within a node, pipeline-parallel across nodes, data-parallel across replicas.** Megatron's 1T-param run used TP=8 (one DGX node), PP=64 (across nodes), DP across replicas.

Memory cost per rank for an N-way TP layer: weights / N, activations between col- and row-parallel are h/N wide, optimizer state / N. For Adam with fp32 master weights this is huge — TP=8 cuts an 80 GB layer's footprint to 10 GB per GPU, putting it within reach of an A100. The bandwidth cost is bounded by the all-reduce: one (b * seq * h) reduction per block per direction, well within NVLink's ceiling for typical (b, seq, h).

The implementation tradeoff is whether to materialize the bigger of the two activations: GeMM kernels are most efficient on contiguous tiles, so most frameworks (Megatron-LM, vLLM-style serving) keep the column-output activation sharded and shove the all-reduce only at the row-output's tail. Done right, the all-reduce overlaps with the next layer's compute and the wall-clock overhead is single-digit percent.

## complexity
Compute per layer per rank: O(layer_flops / N). Communication per layer per direction: O(b * seq * h) bytes per all-reduce, one per forward, one per backward, repeated for both the MLP and attention block per transformer layer. Memory per rank: O(weights / N + activations / N + optimizer_state / N) — the cleanest of the parallelism scaling laws. Effective scaling holds up to the point where the per-step all-reduce overwhelms compute; on NVLink this is typically TP <= 8.

## pitfalls
- Putting tensor-parallel ranks on different nodes. The per-layer all-reduce over InfiniBand kills throughput; TP must stay on intra-node NVLink.
- Splitting LayerNorm or RMSNorm across ranks. They are cheap to replicate, and splitting them adds a per-step all-reduce for nothing.
- Forgetting the backward all-reduce. The column-parallel layer's input gradient needs an all-reduce too (gradient of `x = sum_i x @ W_i^T`); skip it and your model diverges.
- Random number generators desyncing between TP ranks. Dropout in particular: if rank 0 and rank 1 use different RNG seeds, the dropout masks differ and the row-parallel sum is wrong. Either replicate the RNG state or place dropout *after* the all-reduce.
- Vocabulary parallelism without all-reduce at the loss. Sharding the embedding output column-wise and computing the softmax locally without summing the partition function gives the wrong loss.

## interviewTips
- Say "row-parallel after column-parallel inside the MLP, one all-reduce per direction." That phrasing alone signals you have read the Megatron paper.
- Be ready to explain why TP stays intra-node: the per-layer all-reduce needs NVLink-class bandwidth, not InfiniBand.
- Mention 3D parallelism — TP for intra-layer width, PP for depth, DP for replicas — and the canonical Megatron 1T-param config (TP=8, PP=64, DP=across replicas).

## code.python
```python
# Sketch of Megatron-style row/column parallel linear layers.
import torch
import torch.distributed as dist
import torch.nn as nn

class ColumnParallelLinear(nn.Module):
    def __init__(self, in_dim, out_dim, tp_group):
        super().__init__()
        self.tp = tp_group
        self.tp_size = dist.get_world_size(tp_group)
        self.weight = nn.Parameter(
            torch.empty(in_dim, out_dim // self.tp_size)
        )  # local shard along OUTPUT dim
    def forward(self, x):                       # x: (b, in_dim) full on every rank
        return x @ self.weight                  # (b, out_dim / tp_size) sharded

class RowParallelLinear(nn.Module):
    def __init__(self, in_dim, out_dim, tp_group):
        super().__init__()
        self.tp = tp_group
        self.tp_size = dist.get_world_size(tp_group)
        self.weight = nn.Parameter(
            torch.empty(in_dim // self.tp_size, out_dim)
        )  # local shard along INPUT dim
    def forward(self, x):                       # x: (b, in_dim / tp_size) sharded
        partial = x @ self.weight                # (b, out_dim) partial sum
        dist.all_reduce(partial, op=dist.ReduceOp.SUM, group=self.tp)
        return partial                          # (b, out_dim) full on every rank

class MegatronMLP(nn.Module):
    def __init__(self, h, tp_group):
        super().__init__()
        self.fc1 = ColumnParallelLinear(h, 4 * h, tp_group)
        self.fc2 = RowParallelLinear(4 * h, h, tp_group)
    def forward(self, x):
        return self.fc2(torch.nn.functional.gelu(self.fc1(x)))
```

## code.javascript
```javascript
// Pseudo-code for Megatron-style MLP block.
async function megatronMLPForward(x, w1Shard, w2Shard, tpGroup) {
  // w1: column-parallel (in -> 4h/N).  Local matmul, no comm.
  const hidden = matmul(x, w1Shard);          // shape (b, 4h/N)
  const act = gelu(hidden);                   // elementwise, still sharded.
  // w2: row-parallel (4h/N -> h).  Local matmul gives a partial sum.
  const partial = matmul(act, w2Shard);       // shape (b, h)
  // One all-reduce per MLP forward — that's the whole comm cost.
  return await allReduceSum(partial, tpGroup);
}
```

## code.java
```java
// Sketch of column/row parallel linear used in tensor-parallel transformer block.
class ColumnParallelLinear {
    final Tensor wShard;     // [in, out / tpSize]
    Tensor forward(Tensor x) { return x.matmul(wShard); }
}

class RowParallelLinear {
    final Tensor wShard;     // [in / tpSize, out]
    final Collective tpGroup;
    Tensor forward(Tensor x) {
        Tensor partial = x.matmul(wShard);        // partial sum on each rank
        return tpGroup.allReduceSum(partial);     // one all-reduce per layer
    }
}
```

## code.cpp
```cpp
// Column-parallel + row-parallel MLP, with one NCCL all-reduce per block.
Tensor megatron_mlp_forward(const Tensor& x,
                            const Tensor& w1_col_shard,
                            const Tensor& w2_row_shard,
                            ncclComm_t tp_comm,
                            cudaStream_t stream) {
    Tensor h = matmul(x, w1_col_shard);                   // sharded along last dim
    Tensor a = gelu(h);                                    // elementwise, sharded
    Tensor partial = matmul(a, w2_row_shard);              // partial sum, full last dim
    ncclAllReduce(partial.data(), partial.data(),
                  partial.numel(), ncclFloat, ncclSum,
                  tp_comm, stream);
    return partial;
}
```
