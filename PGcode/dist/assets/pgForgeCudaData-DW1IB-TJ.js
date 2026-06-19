const i=["Fundamentals","Elementwise","Memory","Reductions","GEMM"],a=[{slug:"vector-add",title:"Vector Addition",category:"Fundamentals",difficulty:"easy",summary:"The first kernel everyone writes. One thread adds one pair of elements, and the grid covers the whole array.",goal:"Compute c[i] = a[i] + b[i] across a long array, mapping each output element to exactly one GPU thread.",steps:[{title:"Find this thread's index",detail:"Combine the block index, block dimension, and thread index into a single global index i = blockIdx.x * blockDim.x + threadIdx.x."},{title:"Guard the tail",detail:"The grid is sized in whole blocks, so the last block usually overshoots n. Skip work when i >= n."},{title:"Do one addition",detail:"Read a[i] and b[i] from global memory, add, and write c[i]. Each thread touches independent data, so no synchronization is needed."},{title:"Launch enough blocks",detail:"Pick a block size like 256 and round the grid up with (n + 255) / 256 so every element gets a thread."}],code:`__global__ void vec_add(const float* a, const float* b,
                        float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

// host launch
int threads = 256;
int blocks  = (n + threads - 1) / threads;
vec_add<<<blocks, threads>>>(d_a, d_b, d_c, n);`},{slug:"saxpy",title:"SAXPY (a*x + y)",category:"Fundamentals",difficulty:"easy",summary:"A single-precision scaled add. The same grid-stride pattern as vector add, with a scalar folded in.",goal:"Compute y[i] = alpha * x[i] + y[i] in place, the classic BLAS Level-1 operation, on the GPU.",steps:[{title:"Pass the scalar by value",detail:"alpha is a plain float argument copied to every thread through the kernel launch — it never needs to live in device memory."},{title:"Use a grid-stride loop",detail:"Instead of one element per thread, walk i forward by gridDim.x * blockDim.x so a small grid can still cover an array of any size."},{title:"Update in place",detail:"Read y[i], fuse the multiply-add, and store back into y[i]. Each index is owned by one thread across the whole loop, so the write is safe."}],code:`__global__ void saxpy(int n, float alpha,
                      const float* x, float* y) {
    int start  = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = gridDim.x * blockDim.x;
    for (int i = start; i < n; i += stride) {
        y[i] = alpha * x[i] + y[i];
    }
}`},{slug:"relu",title:"Elementwise ReLU",category:"Elementwise",difficulty:"easy",summary:"Clamp every negative value to zero. A pure map with no neighbours, so it is bandwidth-bound and trivially parallel.",goal:"Apply out[i] = max(0, in[i]) over an activation tensor, the most common nonlinearity in deep nets.",steps:[{title:"Map one thread per element",detail:"Flatten the tensor to a 1-D array of length n and give each element its own thread with the usual global index."},{title:"Branch-free max",detail:"Use fmaxf(0.0f, x) rather than an if. It avoids a divergent branch when some lanes in a warp are negative and others positive."},{title:"Optionally fuse the bias",detail:"If the previous op produced raw logits, you can add a bias inside the same kernel to save a full read/write pass over memory."}],code:`__global__ void relu(const float* in, float* out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        float x = in[i];
        out[i] = fmaxf(0.0f, x);   // no divergent branch
    }
}`},{slug:"softmax-rows",title:"Row Softmax",category:"Elementwise",difficulty:"medium",summary:"Turn each row of logits into a probability distribution. One block per row, with a shared-memory max and sum to stay stable.",goal:"Compute a numerically stable softmax along the last axis: subtract the row max, exponentiate, then divide by the row sum.",steps:[{title:"One block owns one row",detail:"Assign blockIdx.x to a row and let the block's threads stride across the columns. Each row is independent, so blocks never talk to each other."},{title:"Reduce the row max",detail:"Each thread scans its columns for a local max, then the block cooperatively reduces to the row max in shared memory. Subtracting it prevents expf overflow."},{title:"Reduce the row sum",detail:"Exponentiate the shifted logits and reduce again to get the denominator. Keep both reductions in shared memory to avoid extra global traffic."},{title:"Normalize",detail:"Divide each exponentiated value by the shared sum and write it back. Every thread reuses the cached row statistics."}],code:`__global__ void softmax_rows(const float* x, float* y,
                             int rows, int cols) {
    extern __shared__ float buf[];
    int row = blockIdx.x;
    int t   = threadIdx.x;
    if (row >= rows) return;
    const float* xr = x + row * cols;
    float* yr = y + row * cols;

    // 1) row max
    float m = -INFINITY;
    for (int c = t; c < cols; c += blockDim.x) m = fmaxf(m, xr[c]);
    buf[t] = m; __syncthreads();
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (t < s) buf[t] = fmaxf(buf[t], buf[t + s]);
        __syncthreads();
    }
    float rowMax = buf[0]; __syncthreads();

    // 2) row sum of exp(x - max)
    float sum = 0.0f;
    for (int c = t; c < cols; c += blockDim.x) sum += expf(xr[c] - rowMax);
    buf[t] = sum; __syncthreads();
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (t < s) buf[t] += buf[t + s];
        __syncthreads();
    }
    float rowSum = buf[0];

    // 3) normalize
    for (int c = t; c < cols; c += blockDim.x)
        yr[c] = expf(xr[c] - rowMax) / rowSum;
}`},{slug:"conv1d",title:"1D Convolution",category:"Elementwise",difficulty:"medium",summary:"Slide a small filter across a signal. Each output is a dot product over a window, with zero padding at the edges.",goal:"Compute out[i] = sum over k of signal[i + k - radius] * filter[k], handling the boundaries with implicit zeros.",steps:[{title:"One thread per output sample",detail:"Give each output position its own thread. The filter is small and read-only, so it is a natural fit for constant memory."},{title:"Center the window",detail:"For a filter of width 2*radius+1, the input index for tap k is i + k - radius. Read it only when it lands inside the signal."},{title:"Pad with zeros",detail:"Out-of-range taps contribute nothing. Guarding the read with a bounds check is equivalent to padding the signal with zeros on both ends."},{title:"Accumulate locally",detail:"Sum the products into a register, not global memory, then write the result once. The inner loop is short enough for the compiler to unroll."}],code:`__constant__ float c_filter[64];   // radius small, fits in constant mem

__global__ void conv1d(const float* sig, float* out,
                       int n, int radius) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i >= n) return;
    float acc = 0.0f;
    for (int k = -radius; k <= radius; ++k) {
        int j = i + k;
        if (j >= 0 && j < n)               // implicit zero padding
            acc += sig[j] * c_filter[k + radius];
    }
    out[i] = acc;
}`},{slug:"transpose-shared",title:"Transpose with Shared Memory",category:"Memory",difficulty:"medium",summary:"Flip a matrix without wrecking coalescing. Stage a tile in shared memory so both the read and the write stay contiguous.",goal:"Transpose a matrix so out[col][row] = in[row][col], reading and writing global memory in coalesced rows.",steps:[{title:"Stage a tile in shared memory",detail:"Each block loads a TILE x TILE square into a shared array. The global read is along rows, so neighbouring threads touch neighbouring addresses — fully coalesced."},{title:"Pad the shared array",detail:"Declare the tile as [TILE][TILE+1]. The extra column shifts every row to a different bank, eliminating shared-memory bank conflicts on the transposed read."},{title:"Swap indices on write-out",detail:"After a __syncthreads, read the tile transposed and write to the output block at the swapped coordinates, keeping the global write coalesced too."},{title:"Synchronize between phases",detail:"The barrier guarantees the whole tile is loaded before any thread reads a column another thread wrote."}],code:`#define TILE 32

__global__ void transpose(const float* in, float* out,
                          int rows, int cols) {
    __shared__ float tile[TILE][TILE + 1];   // +1 dodges bank conflicts

    int x = blockIdx.x * TILE + threadIdx.x;
    int y = blockIdx.y * TILE + threadIdx.y;
    if (x < cols && y < rows)
        tile[threadIdx.y][threadIdx.x] = in[y * cols + x];
    __syncthreads();

    int tx = blockIdx.y * TILE + threadIdx.x;
    int ty = blockIdx.x * TILE + threadIdx.y;
    if (tx < rows && ty < cols)
        out[ty * rows + tx] = tile[threadIdx.x][threadIdx.y];
}`},{slug:"layernorm",title:"LayerNorm Forward",category:"Memory",difficulty:"medium",summary:"Normalize each row to zero mean and unit variance, then rescale. One block per row reuses cached statistics across the feature axis.",goal:"Compute y = gamma * (x - mean) / sqrt(var + eps) + beta along each row, the normalization transformers rely on.",steps:[{title:"One block per row",detail:"Each block handles one example and reduces over the feature dimension, so batch size never affects the math — exactly why transformers prefer it."},{title:"Reduce mean and variance",detail:"Accumulate the sum and sum of squares in shared memory. From those two reductions you get mean and variance in a single pass over the row."},{title:"Stabilize the denominator",detail:"Divide by sqrt(var + eps), not sqrt(var). The epsilon keeps the kernel finite when a row is constant and its variance is zero."},{title:"Apply the affine transform",detail:"Scale the normalized value by gamma and shift by beta, both indexed per feature. Cache mean and rstd so every thread reuses them."}],code:`__global__ void layernorm(const float* x, const float* gamma,
                          const float* beta, float* y,
                          int rows, int cols, float eps) {
    extern __shared__ float buf[];   // [blockDim.x] scratch
    int row = blockIdx.x, t = threadIdx.x;
    const float* xr = x + row * cols;

    float s = 0.0f;
    for (int c = t; c < cols; c += blockDim.x) s += xr[c];
    buf[t] = s; __syncthreads();
    for (int k = blockDim.x / 2; k > 0; k >>= 1) {
        if (t < k) buf[t] += buf[t + k]; __syncthreads();
    }
    float mean = buf[0] / cols; __syncthreads();

    float v = 0.0f;
    for (int c = t; c < cols; c += blockDim.x) {
        float d = xr[c] - mean; v += d * d;
    }
    buf[t] = v; __syncthreads();
    for (int k = blockDim.x / 2; k > 0; k >>= 1) {
        if (t < k) buf[t] += buf[t + k]; __syncthreads();
    }
    float rstd = rsqrtf(buf[0] / cols + eps);

    for (int c = t; c < cols; c += blockDim.x)
        y[row * cols + c] = gamma[c] * (xr[c] - mean) * rstd + beta[c];
}`},{slug:"reduction-sum",title:"Parallel Reduction Sum",category:"Reductions",difficulty:"medium",summary:"Add up an array in log(n) steps. Each block folds its slice in shared memory, halving the active threads every round.",goal:"Sum a large array by having each block reduce its chunk to a single partial, then summing the partials.",steps:[{title:"Load into shared memory",detail:"Each thread copies one (or two) elements from global memory into a shared array indexed by threadIdx.x."},{title:"Halve the stride each step",detail:"Start with a stride of blockDim.x/2 and halve it every iteration. Threads below the stride add the element a stride ahead."},{title:"Synchronize every round",detail:"A __syncthreads between rounds ensures all partial sums from the previous step are visible before the next add."},{title:"Write one partial per block",detail:"After the loop, thread 0 holds the block sum. Write it to a per-block output and reduce those partials in a second pass or with atomics."}],code:`__global__ void reduce_sum(const float* in, float* partials, int n) {
    extern __shared__ float sdata[];
    int t = threadIdx.x;
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    sdata[t] = (i < n) ? in[i] : 0.0f;
    __syncthreads();

    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (t < s) sdata[t] += sdata[t + s];
        __syncthreads();
    }
    if (t == 0) partials[blockIdx.x] = sdata[0];
}`},{slug:"parallel-max",title:"Parallel Max",category:"Reductions",difficulty:"easy",summary:"The same tree reduction as sum, but the combiner is fmaxf. Useful as the first pass of a stable softmax.",goal:"Find the maximum element of an array, each block emitting the max of its slice for a final combine.",steps:[{title:"Seed with the identity",detail:"Initialize out-of-range lanes to -INFINITY so the max ignores them. The identity for max is negative infinity, just as 0 is for sum."},{title:"Fold with fmaxf",detail:"Reuse the halving-stride tree, swapping the addition for fmaxf. The control flow is identical; only the binary operator changes."},{title:"Emit one max per block",detail:"Thread 0 writes the block maximum. A short second kernel (or CPU pass) takes the max over the per-block results."}],code:`__global__ void reduce_max(const float* in, float* partials, int n) {
    extern __shared__ float sdata[];
    int t = threadIdx.x;
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    sdata[t] = (i < n) ? in[i] : -INFINITY;   // identity for max
    __syncthreads();

    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (t < s) sdata[t] = fmaxf(sdata[t], sdata[t + s]);
        __syncthreads();
    }
    if (t == 0) partials[blockIdx.x] = sdata[0];
}`},{slug:"warp-shuffle-reduce",title:"Warp Shuffle Reduction",category:"Reductions",difficulty:"hard",summary:"Reduce inside a warp with no shared memory at all. Lanes exchange registers directly via __shfl_down_sync.",goal:"Sum the 32 values held by a warp using register-to-register shuffles, the fastest building block for reductions.",steps:[{title:"Shuffle down by halving offsets",detail:"Each lane adds the value held by the lane 16, then 8, 4, 2, 1 positions ahead. After five shuffles lane 0 holds the warp total."},{title:"Pass the active mask",detail:"The first argument to __shfl_down_sync is a mask of participating lanes — usually 0xffffffff for a full warp. It keeps divergent warps correct."},{title:"No barriers needed",detail:"Shuffles operate within a single warp, which executes in lockstep, so no __syncthreads is required between steps."},{title:"Combine warps for a block",detail:"Have lane 0 of each warp write its partial to shared memory, then reduce those few partials with one more warp shuffle."}],code:`__inline__ __device__ float warp_reduce_sum(float val) {
    for (int offset = warpSize / 2; offset > 0; offset >>= 1)
        val += __shfl_down_sync(0xffffffff, val, offset);
    return val;   // lane 0 holds the warp total
}

__global__ void block_sum(const float* in, float* out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    float v = (i < n) ? in[i] : 0.0f;
    v = warp_reduce_sum(v);

    __shared__ float warpSums[32];
    int lane = threadIdx.x % warpSize;
    int wid  = threadIdx.x / warpSize;
    if (lane == 0) warpSums[wid] = v;
    __syncthreads();

    if (wid == 0) {
        v = (threadIdx.x < blockDim.x / warpSize) ? warpSums[lane] : 0.0f;
        v = warp_reduce_sum(v);
        if (lane == 0) out[blockIdx.x] = v;
    }
}`},{slug:"prefix-sum",title:"Prefix Sum (Scan)",category:"Reductions",difficulty:"hard",summary:"Compute every running total in parallel. The Blelloch scan sweeps up to build partials, then down to distribute them.",goal:"Produce an inclusive prefix sum where out[i] is the sum of in[0..i], using a work-efficient up-sweep and down-sweep.",steps:[{title:"Load the block into shared memory",detail:"Each thread stages two elements so a block of T threads scans 2*T values in one pass."},{title:"Up-sweep (reduce)",detail:"Walk the stride from 1 upward, combining pairs into partial sums. After the sweep the last slot holds the block total."},{title:"Clear and down-sweep",detail:"For an exclusive scan, zero the last element, then sweep back down swapping and adding so each node receives the sum of everything to its left."},{title:"Add block offsets",detail:"Each block produces a local scan; add the exclusive prefix of all earlier block totals to stitch the blocks into a global scan."}],code:`__global__ void scan_block(const float* in, float* out,
                           float* blockSums, int n) {
    extern __shared__ float temp[];
    int t = threadIdx.x;
    int off = blockIdx.x * blockDim.x * 2;
    int ai = 2 * t, bi = 2 * t + 1;
    temp[ai] = (off + ai < n) ? in[off + ai] : 0.0f;
    temp[bi] = (off + bi < n) ? in[off + bi] : 0.0f;

    int offset = 1;
    for (int d = blockDim.x; d > 0; d >>= 1) {        // up-sweep
        __syncthreads();
        if (t < d) {
            int x = offset * (2 * t + 1) - 1;
            int y = offset * (2 * t + 2) - 1;
            temp[y] += temp[x];
        }
        offset *= 2;
    }
    if (t == 0) { blockSums[blockIdx.x] = temp[2 * blockDim.x - 1];
                  temp[2 * blockDim.x - 1] = 0.0f; }

    for (int d = 1; d < 2 * blockDim.x; d *= 2) {      // down-sweep
        offset >>= 1;
        __syncthreads();
        if (t < d) {
            int x = offset * (2 * t + 1) - 1;
            int y = offset * (2 * t + 2) - 1;
            float s = temp[x]; temp[x] = temp[y]; temp[y] += s;
        }
    }
    __syncthreads();
    if (off + ai < n) out[off + ai] = temp[ai] + in[off + ai];
    if (off + bi < n) out[off + bi] = temp[bi] + in[off + bi];
}`},{slug:"tiled-matmul",title:"Tiled Matrix Multiply",category:"GEMM",difficulty:"hard",summary:"The workhorse of deep learning. Stage square tiles of A and B in shared memory so each value is reused across a whole tile.",goal:"Compute C = A * B where each thread owns one output element, accumulating across tiles loaded into shared memory.",steps:[{title:"Tile the output",detail:"Map a TILE x TILE block of C to a thread block. Each thread is responsible for a single C[row][col] and accumulates into a register."},{title:"Stream the K dimension in tiles",detail:"Loop over the shared K dimension in steps of TILE. Each iteration loads one tile of A and one of B into shared memory."},{title:"Reuse from shared memory",detail:"Within a tile, every loaded value of A and B is read TILE times across the block. This is the reuse that lifts GEMM off the memory wall."},{title:"Synchronize around each tile",detail:"Barrier after loading so all values are present, multiply-accumulate the tile, then barrier again before overwriting shared memory with the next tile."},{title:"Guard ragged edges",detail:"When dimensions are not multiples of TILE, load zeros for out-of-range elements so the dot product stays correct at the matrix borders."}],code:`#define TILE 16

__global__ void matmul(const float* A, const float* B, float* C,
                       int M, int N, int K) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][TILE];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;
    float acc = 0.0f;

    for (int t = 0; t < (K + TILE - 1) / TILE; ++t) {
        int aCol = t * TILE + threadIdx.x;
        int bRow = t * TILE + threadIdx.y;
        As[threadIdx.y][threadIdx.x] =
            (row < M && aCol < K) ? A[row * K + aCol] : 0.0f;
        Bs[threadIdx.y][threadIdx.x] =
            (bRow < K && col < N) ? B[bRow * N + col] : 0.0f;
        __syncthreads();

        for (int k = 0; k < TILE; ++k)
            acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        __syncthreads();
    }
    if (row < M && col < N) C[row * N + col] = acc;
}`},{slug:"tiled-matvec",title:"Tiled Matrix-Vector Product",category:"GEMM",difficulty:"medium",summary:"Multiply a matrix by a vector with one block per output row. The vector is staged in shared memory and reused by the whole block.",goal:"Compute y = A * x where A is M-by-N and x has length N, giving each output y[row] to one thread block.",steps:[{title:"One block per output row",detail:"Map blockIdx.x to a row of A. Every thread in the block walks part of that row, so the row is read in coalesced chunks."},{title:"Stage the vector in tiles",detail:"Load a tile of x into shared memory once, then let all threads in the block reuse it. This turns repeated global reads of x into cheap shared-memory reads."},{title:"Accumulate a partial dot product",detail:"Each thread multiplies its slice of the row by the matching slice of x and keeps a running partial in a register."},{title:"Reduce the partials",detail:"A shared-memory tree reduction combines the per-thread partials into the single dot product y[row], which thread 0 writes out."}],code:`#define TILE 256

__global__ void matvec(const float* A, const float* x, float* y,
                       int M, int N) {
    __shared__ float xs[TILE];
    __shared__ float partial[TILE];
    int row = blockIdx.x;
    int t   = threadIdx.x;
    if (row >= M) return;

    float acc = 0.0f;
    for (int base = 0; base < N; base += TILE) {
        int col = base + t;
        xs[t] = (col < N) ? x[col] : 0.0f;   // stage a tile of x
        __syncthreads();
        if (col < N) acc += A[row * N + col] * xs[t];
        __syncthreads();
    }

    partial[t] = acc; __syncthreads();
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (t < s) partial[t] += partial[t + s];
        __syncthreads();
    }
    if (t == 0) y[row] = partial[0];
}`},{slug:"fused-bias-relu",title:"Fused Bias + ReLU",category:"Elementwise",difficulty:"easy",summary:"Add a per-column bias and apply ReLU in a single pass. Fusing the two ops halves the memory traffic of doing them separately.",goal:"Compute out[i] = max(0, in[i] + bias[col]) over a rows-by-cols tensor, the typical tail of a linear layer.",steps:[{title:"Flatten and index",detail:"Treat the tensor as a 1-D array of length rows*cols and give each element one thread with the usual global index."},{title:"Recover the column",detail:"The bias is shared across rows, so map the flat index back to its column with col = i % cols to pick the right bias entry."},{title:"Fuse the two ops",detail:"Read the input once, add the bias, then clamp with fmaxf in the same kernel. One read and one write instead of two of each."},{title:"Stay branch-free",detail:"Use fmaxf(0.0f, v) rather than an if so warps with mixed signs do not diverge."}],code:`__global__ void bias_relu(const float* in, const float* bias,
                          float* out, int rows, int cols) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    int n = rows * cols;
    if (i < n) {
        int col = i % cols;                    // bias is per column
        float v = in[i] + bias[col];
        out[i] = fmaxf(0.0f, v);               // fused, branch-free
    }
}`},{slug:"gelu",title:"GELU Activation",category:"Elementwise",difficulty:"easy",summary:"The smooth activation used in modern transformers. A pure elementwise map using the tanh approximation of the Gaussian CDF.",goal:"Apply out[i] = 0.5 * x * (1 + tanh(sqrt(2/pi) * (x + 0.044715 * x^3))), the standard tanh GELU.",steps:[{title:"Map one thread per element",detail:"GELU has no cross-element dependency, so it is the same trivially parallel one-thread-per-value pattern as ReLU."},{title:"Bake in the constants",detail:"Precompute sqrt(2/pi) as a literal so each thread does plain multiply-adds rather than recomputing a constant."},{title:"Evaluate the cubic inner term",detail:"Compute x + 0.044715 * x^3 in registers; reusing x*x avoids an extra multiply."},{title:"Apply the smooth gate",detail:"tanhf gives the smooth gate, then scale by 0.5 * x. Single-precision tanhf is fast enough that the kernel stays bandwidth-bound."}],code:`__global__ void gelu(const float* in, float* out, int n) {
    const float k = 0.7978845608f;             // sqrt(2 / pi)
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        float x  = in[i];
        float x3 = x * x * x;
        float inner = k * (x + 0.044715f * x3);
        out[i] = 0.5f * x * (1.0f + tanhf(inner));
    }
}`},{slug:"sigmoid-tanh",title:"Fused Sigmoid + Tanh Gate",category:"Elementwise",difficulty:"easy",summary:"Apply a sigmoid to one half of a tensor and a tanh to the other, then multiply. The gated activation at the heart of LSTMs and GLUs.",goal:"Compute out[i] = sigmoid(a[i]) * tanh(b[i]) over paired tensors, a single fused pass instead of three kernels.",steps:[{title:"Pair the two inputs",detail:"Index both halves a and b with the same global thread index so each thread owns one output element."},{title:"Compute the sigmoid gate",detail:"sigmoid(x) = 1 / (1 + exp(-x)). Use expf in single precision; the gate squashes its input to the open interval (0, 1)."},{title:"Compute the tanh content",detail:"tanhf(b) maps the content branch into (-1, 1). Both transcendental functions run on the special-function units in parallel with memory."},{title:"Multiply and store",detail:"Multiply the gate by the content and write once. Fusing all three ops avoids two extra round trips through global memory."}],code:`__global__ void sigmoid_tanh_gate(const float* a, const float* b,
                                  float* out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        float g = 1.0f / (1.0f + expf(-a[i]));   // sigmoid gate
        float c = tanhf(b[i]);                    // tanh content
        out[i] = g * c;                           // gated output
    }
}`},{slug:"embedding-gather",title:"Embedding Lookup (Gather)",category:"Memory",difficulty:"easy",summary:"Copy the embedding row for each token id into the output. A gather where the access pattern is set by the data, not the index.",goal:"Build out[t] = table[ids[t]], copying one D-dimensional row per token from an embedding table.",steps:[{title:"One block per token",detail:"Assign blockIdx.x to a token position and let the block read its id once from the ids array."},{title:"Resolve the source row",detail:"The id selects which row of the table to copy. Offset into the table by id * dim to find the start of that embedding vector."},{title:"Copy the row in parallel",detail:"The blocks threads stride across the dim feature columns, so the copy of each row is fully coalesced even though the chosen rows are scattered."},{title:"Mind the random rows",detail:"Different tokens pull different, unpredictable rows, so the table reads are scattered across memory. Coalescing within a row is what keeps it efficient."}],code:`__global__ void embedding_gather(const float* table, const int* ids,
                                 float* out, int seq, int dim) {
    int tok = blockIdx.x;                       // one block per token
    if (tok >= seq) return;
    int id = ids[tok];                          // which row to fetch
    const float* src = table + (long)id * dim;
    float* dst = out + (long)tok * dim;
    for (int c = threadIdx.x; c < dim; c += blockDim.x)
        dst[c] = src[c];                        // coalesced row copy
}`},{slug:"parallel-histogram",title:"Parallel Histogram",category:"Reductions",difficulty:"medium",summary:"Count values into bins without races. Each block builds a private histogram in shared memory, then merges it into the global one with atomics.",goal:"Tally how many inputs fall into each of B bins, using privatized shared-memory histograms to avoid global atomic contention.",steps:[{title:"Privatize per block",detail:"Each block keeps its own histogram in shared memory. Threads cooperatively zero the bins before counting starts."},{title:"Count with shared atomics",detail:"Threads stride over the input and atomicAdd into the shared histogram. Atomics on shared memory are far cheaper than on global memory."},{title:"Synchronize before merging",detail:"A barrier guarantees every thread has finished counting into the private histogram before it is flushed."},{title:"Merge into global",detail:"Each block adds its private bins into the global histogram with one global atomicAdd per bin, keeping global contention low."}],code:`__global__ void histogram(const int* data, int n,
                          int* hist, int bins) {
    extern __shared__ int local[];             // [bins] private histogram
    for (int b = threadIdx.x; b < bins; b += blockDim.x) local[b] = 0;
    __syncthreads();

    int stride = gridDim.x * blockDim.x;
    for (int i = blockIdx.x * blockDim.x + threadIdx.x; i < n; i += stride) {
        int b = data[i];
        if (b >= 0 && b < bins) atomicAdd(&local[b], 1);
    }
    __syncthreads();

    for (int b = threadIdx.x; b < bins; b += blockDim.x)
        if (local[b]) atomicAdd(&hist[b], local[b]);   // merge to global
}`}];function o(e){return a.find(t=>t.slug===e)||null}export{a as P,i as a,o as g};
