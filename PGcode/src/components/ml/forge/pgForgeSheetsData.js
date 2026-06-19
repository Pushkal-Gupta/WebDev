// Reference sheets for the PGForge track.
// Quick-glance cheat sheets you reach for while writing code or prepping for an
// interview. Each sheet is a list of sections; each section is a list of items
// with a one-line label and a short, correct snippet. These are reading-and-
// reference notes, not a graded judge — the code shows the idiomatic shape.

export const PG_FORGE_SHEETS = [
  // ============================== NumPy ==============================
  {
    slug: 'numpy',
    title: 'NumPy',
    icon: 'Grid3x3',
    blurb: 'Array creation, shapes, broadcasting, reductions, and the linear-algebra calls you reach for every day.',
    sections: [
      {
        heading: 'Create arrays',
        items: [
          { label: 'From a Python list', code: `a = np.array([1, 2, 3])` },
          { label: 'Filled with zeros or ones', code: `np.zeros((2, 3))\nnp.ones((2, 3))` },
          { label: 'A range of values', code: `np.arange(0, 10, 2)      # 0 2 4 6 8\nnp.linspace(0, 1, 5)     # 5 evenly spaced` },
          { label: 'Identity and constant fills', code: `np.eye(3)                # 3x3 identity\nnp.full((2, 2), 7.0)` },
          { label: 'Match another array shape', code: `np.zeros_like(a)\nnp.empty_like(a)         # uninitialised, fast` },
        ],
      },
      {
        heading: 'Shape and reshape',
        items: [
          { label: 'Inspect shape and rank', code: `a.shape                  # (2, 3)\na.ndim                   # 2\na.size                   # 6` },
          { label: 'Reshape, letting one axis infer', code: `a.reshape(3, -1)         # -1 means "work it out"` },
          { label: 'Add or drop a length-1 axis', code: `a[:, None]               # add a trailing axis\nnp.expand_dims(a, 0)\nnp.squeeze(a)            # drop length-1 axes` },
          { label: 'Flatten and transpose', code: `a.ravel()                # 1-D view\na.T                      # swap axes\na.transpose(1, 0, 2)     # reorder axes` },
        ],
      },
      {
        heading: 'Broadcasting',
        items: [
          { label: 'Rule of thumb', code: `# axes align from the right; a length-1 or
# missing axis stretches to match.
(3, 1) + (1, 4)  ->  (3, 4)` },
          { label: 'Add a column vector to a matrix', code: `m = np.ones((3, 4))\ncol = np.arange(3)[:, None]   # shape (3, 1)\nm + col                       # broadcasts to (3, 4)` },
          { label: 'Outer product without a loop', code: `x = np.arange(4)\nx[:, None] * x[None, :]        # (4, 4)` },
        ],
      },
      {
        heading: 'Index and slice',
        items: [
          { label: 'Basic slices share memory', code: `a[1:3]                   # a view, not a copy\na[::-1]                  # reversed view` },
          { label: 'Fancy indexing copies', code: `a[[0, 2, 2]]             # pick rows by index\nm[rows, cols]            # paired index arrays` },
          { label: 'Boolean masking', code: `a[a > 0]                 # keep positives\na[a < 0] = 0             # clamp in place` },
          { label: 'Where: choose by condition', code: `np.where(a > 0, a, 0)    # relu, elementwise` },
        ],
      },
      {
        heading: 'Reduce along an axis',
        items: [
          { label: 'Sum and mean over one axis', code: `m.sum(axis=0)            # collapse rows\nm.mean(axis=1)           # average each row` },
          { label: 'Keep the reduced axis', code: `m.sum(axis=1, keepdims=True)  # shape (n, 1)` },
          { label: 'Argmax and argmin', code: `m.argmax(axis=1)         # index of max per row` },
          { label: 'Min, max, std', code: `m.max(axis=0)\nm.std(axis=0)` },
        ],
      },
      {
        heading: 'Linear algebra',
        items: [
          { label: 'Dot and matrix multiply', code: `a @ b                    # matmul / dot\nnp.dot(a, b)` },
          { label: 'Einsum for explicit contractions', code: `np.einsum('ij,jk->ik', a, b)   # matmul\nnp.einsum('ii->i', m)          # diagonal\nnp.einsum('ij->', m)           # full sum` },
          { label: 'Inverse and solve', code: `np.linalg.inv(m)\nnp.linalg.solve(A, b)    # prefer over inv@b` },
          { label: 'SVD and norms', code: `U, s, Vt = np.linalg.svd(m)\nnp.linalg.norm(v)        # L2 by default` },
        ],
      },
      {
        heading: 'Random',
        items: [
          { label: 'Seeded generator (preferred)', code: `rng = np.random.default_rng(0)\nrng.random((2, 3))       # uniform [0, 1)\nrng.normal(0, 1, (2, 3)) # gaussian` },
          { label: 'Integers and shuffles', code: `rng.integers(0, 10, 5)\nrng.permutation(10)` },
        ],
      },
      {
        heading: 'Handy idioms',
        items: [
          { label: 'Normalise rows to unit length', code: `m / np.linalg.norm(m, axis=1, keepdims=True)` },
          { label: 'One-hot encode labels', code: `np.eye(num_classes)[labels]` },
          { label: 'Stable softmax over the last axis', code: `e = np.exp(x - x.max(axis=-1, keepdims=True))\ne / e.sum(axis=-1, keepdims=True)` },
        ],
      },
    ],
  },

  // ============================== PyTorch ==============================
  {
    slug: 'pytorch',
    title: 'PyTorch',
    icon: 'Flame',
    blurb: 'Tensors and devices, autograd, the nn.Module pattern, a training loop, and saving your work.',
    sections: [
      {
        heading: 'Tensors and devices',
        items: [
          { label: 'Make a tensor', code: `x = torch.tensor([1.0, 2.0, 3.0])\ntorch.zeros(2, 3)\ntorch.randn(2, 3)        # standard normal` },
          { label: 'Pick a device once, reuse it', code: `device = "cuda" if torch.cuda.is_available() else "cpu"\nx = x.to(device)` },
          { label: 'Bridge to and from NumPy', code: `t = torch.from_numpy(arr)   # shares memory\narr = t.cpu().numpy()` },
          { label: 'Dtype and shape', code: `x.dtype                  # torch.float32\nx.shape                  # torch.Size([3])` },
        ],
      },
      {
        heading: 'Autograd',
        items: [
          { label: 'Track gradients on a leaf', code: `w = torch.randn(3, requires_grad=True)` },
          { label: 'Backprop from a scalar loss', code: `loss = (w ** 2).sum()\nloss.backward()          # fills w.grad` },
          { label: 'Read and clear gradients', code: `w.grad                   # the accumulated grad\nw.grad = None            # zero before next step` },
          { label: 'Detach to stop the graph', code: `y = w.detach()           # no grad flows through y` },
        ],
      },
      {
        heading: 'Define a model',
        items: [
          { label: 'Subclass nn.Module', code: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)` },
          { label: 'Compose with Sequential', code: `net = nn.Sequential(
    nn.Linear(784, 128), nn.ReLU(),
    nn.Linear(128, 10),
)` },
        ],
      },
      {
        heading: 'Common layers',
        items: [
          { label: 'Fully connected and conv', code: `nn.Linear(in_features, out_features)\nnn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1)` },
          { label: 'Normalisation and dropout', code: `nn.BatchNorm2d(channels)\nnn.LayerNorm(dim)\nnn.Dropout(p=0.1)` },
          { label: 'Attention and embeddings', code: `nn.Embedding(vocab_size, dim)\nnn.MultiheadAttention(dim, num_heads, batch_first=True)` },
        ],
      },
      {
        heading: 'Loss functions',
        items: [
          { label: 'Classification', code: `# expects raw logits, not softmax output
nn.CrossEntropyLoss()` },
          { label: 'Regression', code: `nn.MSELoss()             # squared error\nnn.L1Loss()              # absolute error` },
          { label: 'Binary with logits (stable)', code: `nn.BCEWithLogitsLoss()` },
        ],
      },
      {
        heading: 'Training loop',
        items: [
          { label: 'Optimizer and step', code: `opt = torch.optim.Adam(net.parameters(), lr=1e-3)

for xb, yb in loader:
    opt.zero_grad()
    pred = net(xb)
    loss = loss_fn(pred, yb)
    loss.backward()
    opt.step()` },
          { label: 'Clip exploding gradients', code: `nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)` },
        ],
      },
      {
        heading: 'Evaluation mode',
        items: [
          { label: 'Disable grad and dropout for inference', code: `net.eval()
with torch.no_grad():
    preds = net(x_val)` },
          { label: 'Switch back to train', code: `net.train()              # re-enables dropout, batchnorm updates` },
        ],
      },
      {
        heading: 'Save and load',
        items: [
          { label: 'Save weights, not the whole object', code: `torch.save(net.state_dict(), "model.pt")` },
          { label: 'Load into the same architecture', code: `net.load_state_dict(torch.load("model.pt"))
net.eval()` },
        ],
      },
      {
        heading: 'Reshape and combine',
        items: [
          { label: 'Reshape and add axes', code: `x.view(batch, -1)        # flatten per sample\nx.unsqueeze(1)           # add an axis\nx.permute(0, 2, 1)       # reorder axes` },
          { label: 'Stack and concat', code: `torch.cat([a, b], dim=0)\ntorch.stack([a, b], dim=0)   # new axis` },
        ],
      },
    ],
  },

  // ============================== CUDA Kernels ==============================
  {
    slug: 'cuda',
    title: 'CUDA Kernels',
    icon: 'Cpu',
    blurb: 'Thread indexing, the memory hierarchy, a launchable kernel, reductions, and occupancy notes.',
    sections: [
      {
        heading: 'Thread, block, grid',
        items: [
          { label: 'Global index of one thread', code: `int i = blockIdx.x * blockDim.x + threadIdx.x;` },
          { label: 'Built-in coordinates', code: `threadIdx.x   // lane within the block
blockIdx.x    // which block
blockDim.x    // threads per block
gridDim.x     // blocks in the grid` },
          { label: '2-D indexing for images / matrices', code: `int col = blockIdx.x * blockDim.x + threadIdx.x;
int row = blockIdx.y * blockDim.y + threadIdx.y;` },
          { label: 'Grid-stride loop covers any size', code: `for (int i = blockIdx.x * blockDim.x + threadIdx.x;
     i < n;
     i += blockDim.x * gridDim.x) {
    // process element i
}` },
        ],
      },
      {
        heading: 'Memory hierarchy',
        items: [
          { label: 'Global: large, slow, visible to all', code: `// passed in as pointers; coalesce accesses
c[i] = a[i] + b[i];` },
          { label: 'Shared: fast, per-block scratchpad', code: `__shared__ float tile[256];   // static
extern __shared__ float buf[]; // dynamic, sized at launch` },
          { label: 'Registers: fastest, per-thread', code: `float acc = 0.0f;   // a plain local lives in a register` },
          { label: 'Constant memory for read-only params', code: `__constant__ float weights[64];` },
        ],
      },
      {
        heading: 'A minimal kernel',
        items: [
          { label: 'Define the kernel', code: `__global__ void vec_add(const float* a, const float* b,
                        float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) c[i] = a[i] + b[i];
}` },
          { label: 'Launch from the host', code: `int threads = 256;
int blocks  = (n + threads - 1) / threads;
vec_add<<<blocks, threads>>>(d_a, d_b, d_c, n);
cudaDeviceSynchronize();` },
        ],
      },
      {
        heading: 'Synchronise',
        items: [
          { label: 'Barrier across a block', code: `__syncthreads();   // all threads in the block wait here` },
          { label: 'Rule', code: `// every thread in the block must reach the same
// __syncthreads(); never put one inside a divergent
// if that some threads skip.` },
        ],
      },
      {
        heading: 'Reduction pattern',
        items: [
          { label: 'Tree reduce in shared memory', code: `__shared__ float s[256];
int t = threadIdx.x;
s[t] = (i < n) ? a[i] : 0.0f;
__syncthreads();

for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
    if (t < stride) s[t] += s[t + stride];
    __syncthreads();
}
if (t == 0) out[blockIdx.x] = s[0];` },
        ],
      },
      {
        heading: 'Tiled matmul sketch',
        items: [
          { label: 'Load a tile, sync, accumulate', code: `__shared__ float As[T][T], Bs[T][T];
float acc = 0.0f;
for (int k = 0; k < N; k += T) {
    As[ty][tx] = A[row * N + (k + tx)];
    Bs[ty][tx] = B[(k + ty) * N + col];
    __syncthreads();
    for (int j = 0; j < T; ++j) acc += As[ty][j] * Bs[j][tx];
    __syncthreads();
}
C[row * N + col] = acc;` },
        ],
      },
      {
        heading: 'Occupancy notes',
        items: [
          { label: 'Block size', code: `// pick a multiple of 32 (the warp size).
// 128 or 256 is a safe default.` },
          { label: 'Coalesce global reads', code: `// neighbouring threads should touch neighbouring
// addresses, so a warp reads one contiguous line.` },
          { label: 'Watch the limits', code: `// too much shared memory or too many registers
// per thread lowers how many blocks fit per SM.` },
          { label: 'Avoid warp divergence', code: `// branches that split a warp run both sides
// serially. Keep threads in a warp on one path.` },
        ],
      },
    ],
  },

  // ============================== Triton Kernels ==============================
  {
    slug: 'triton',
    title: 'Triton Kernels',
    icon: 'Zap',
    blurb: 'Program ids, block pointers, masked loads and stores, a vector add, a softmax skeleton, and autotuning.',
    sections: [
      {
        heading: 'Program id and offsets',
        items: [
          { label: 'Which block is this instance', code: `pid = tl.program_id(axis=0)` },
          { label: 'Offsets this block owns', code: `offsets = pid * BLOCK + tl.arange(0, BLOCK)` },
          { label: 'Mask the tail of the array', code: `mask = offsets < n   # False past the end` },
        ],
      },
      {
        heading: 'Load and store with masks',
        items: [
          { label: 'Masked load (out-of-range reads ignored)', code: `x = tl.load(x_ptr + offsets, mask=mask, other=0.0)` },
          { label: 'Masked store (out-of-range writes skipped)', code: `tl.store(out_ptr + offsets, y, mask=mask)` },
        ],
      },
      {
        heading: 'Vector add kernel',
        items: [
          { label: 'The kernel', code: `@triton.jit
def add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    pid = tl.program_id(0)
    offs = pid * BLOCK + tl.arange(0, BLOCK)
    mask = offs < n
    x = tl.load(x_ptr + offs, mask=mask)
    y = tl.load(y_ptr + offs, mask=mask)
    tl.store(out_ptr + offs, x + y, mask=mask)` },
          { label: 'Launch with a 1-D grid', code: `grid = lambda meta: (triton.cdiv(n, meta["BLOCK"]),)
add_kernel[grid](x, y, out, n, BLOCK=1024)` },
        ],
      },
      {
        heading: 'Softmax skeleton (one row per block)',
        items: [
          { label: 'Load a row, subtract the max, normalise', code: `@triton.jit
def softmax_kernel(in_ptr, out_ptr, row_stride, n_cols,
                   BLOCK: tl.constexpr):
    row = tl.program_id(0)
    cols = tl.arange(0, BLOCK)
    mask = cols < n_cols
    ptr = in_ptr + row * row_stride + cols
    x = tl.load(ptr, mask=mask, other=-float("inf"))
    x = x - tl.max(x, axis=0)        # stability
    e = tl.exp(x)
    y = e / tl.sum(e, axis=0)
    tl.store(out_ptr + row * row_stride + cols, y, mask=mask)` },
        ],
      },
      {
        heading: 'Reductions in a block',
        items: [
          { label: 'Sum, max, mean along an axis', code: `tl.sum(x, axis=0)
tl.max(x, axis=0)
total = tl.sum(x, axis=0)` },
        ],
      },
      {
        heading: 'Autotune',
        items: [
          { label: 'Let Triton pick the best config', code: `@triton.autotune(
    configs=[
        triton.Config({"BLOCK": 512}, num_warps=4),
        triton.Config({"BLOCK": 1024}, num_warps=8),
    ],
    key=["n"],          # re-tune when n changes
)
@triton.jit
def kernel(...):
    ...` },
          { label: 'Constexpr makes a value a compile-time tile', code: `# BLOCK: tl.constexpr is baked in per config,
# so the compiler can unroll and size shared memory.` },
        ],
      },
    ],
  },

  // ============================== Cracking ML Interviews ==============================
  {
    slug: 'cracking-ml',
    title: 'Cracking ML Interviews',
    icon: 'Brain',
    blurb: 'The concepts that come up on the whiteboard: bias and variance, losses, optimizers, metrics, and attention.',
    sections: [
      {
        heading: 'Bias and variance',
        items: [
          { label: 'What each one means', code: `# high bias  -> too simple, underfits
#               train and test error both high
# high var   -> too flexible, overfits
#               low train error, high test error` },
          { label: 'The trade-off', code: `# total error = bias^2 + variance + noise
# more capacity lowers bias, raises variance.` },
          { label: 'Reading a learning curve', code: `# gap between train and val curves -> variance
# both curves plateau high          -> bias` },
        ],
      },
      {
        heading: 'Regularization',
        items: [
          { label: 'L2 (ridge): shrinks weights', code: `loss + lambda * sum(w ** 2)   # smooth, keeps all weights small` },
          { label: 'L1 (lasso): drives weights to zero', code: `loss + lambda * sum(abs(w))   # sparse, does feature selection` },
          { label: 'Dropout and early stopping', code: `# dropout: randomly zero activations while training
# early stop: halt when validation loss turns up` },
        ],
      },
      {
        heading: 'Losses and when to use them',
        items: [
          { label: 'Cross-entropy for classification', code: `# pairs with a softmax/sigmoid output;
# penalises confident wrong answers hard.` },
          { label: 'MSE for regression', code: `# squared error; sensitive to outliers.` },
          { label: 'MAE / Huber for robust regression', code: `# MAE ignores outlier scale; Huber is MSE near
# zero and MAE in the tails — a smooth blend.` },
        ],
      },
      {
        heading: 'Optimizer cheat sheet',
        items: [
          { label: 'SGD with momentum', code: `# simple, well understood, needs a tuned LR.
# momentum carries velocity through flat regions.` },
          { label: 'Adam: adaptive per-parameter rates', code: `# fast to converge, forgiving on LR;
# combines momentum with per-weight scaling.` },
          { label: 'AdamW: decoupled weight decay', code: `# Adam but applies weight decay separately from
# the gradient — the default for transformers.` },
        ],
      },
      {
        heading: 'Evaluation metrics',
        items: [
          { label: 'Precision and recall', code: `precision = TP / (TP + FP)   # of the flagged, how many right
recall    = TP / (TP + FN)   # of the real, how many caught` },
          { label: 'F1: harmonic mean of the two', code: `F1 = 2 * P * R / (P + R)     # one number when classes imbalance` },
          { label: 'ROC-AUC', code: `# probability a random positive ranks above a
# random negative; threshold-independent.` },
        ],
      },
      {
        heading: 'Fixing overfitting',
        items: [
          { label: 'Get more or augment data', code: `# the most reliable fix; augmentation cheaply
# multiplies what you already have.` },
          { label: 'Simplify or regularise', code: `# fewer parameters, L2/dropout, weight decay.` },
          { label: 'Cross-validate your choices', code: `# k-fold so a single lucky split doesn't fool you.` },
        ],
      },
      {
        heading: 'Transformers and attention',
        items: [
          { label: 'Scaled dot-product attention', code: `attention(Q, K, V) = softmax(Q @ K.T / sqrt(d_k)) @ V` },
          { label: 'Why divide by sqrt(d_k)', code: `# large dot products push softmax into saturation;
# scaling keeps gradients healthy.` },
          { label: 'Multi-head, in one line', code: `# run attention h times in parallel on smaller
# projections, then concat and project back.` },
        ],
      },
      {
        heading: 'Gradient-descent gotchas',
        items: [
          { label: 'Vanishing and exploding gradients', code: `# deep stacks shrink or blow up gradients;
# fixes: residual connections, normalisation, clipping.` },
          { label: 'Learning-rate sensitivity', code: `# too high diverges, too low crawls;
# warmup then decay is a safe schedule.` },
          { label: 'Always normalise inputs', code: `# unnormalised features make the loss surface
# stretched, so descent zig-zags slowly.` },
        ],
      },
    ],
  },
];

export function getSheet(slug) {
  return PG_FORGE_SHEETS.find((sheet) => sheet.slug === slug) || null;
}
