// End-to-end build projects for the PGForge ML area. Original copy.
// Each project carries an ordered build plan; the detail page renders it as a
// numbered track with a starter snippet and the concrete "done" bar.

export const PG_FORGE_PROJECTS = [
  {
    slug: 'mnist-digit-classifier',
    title: 'Digit classifier on MNIST',
    diff: 'easy',
    goal: 'Train a small network to read handwritten digits and reach 97%+ test accuracy.',
    tags: ['numpy', 'mlp', 'classification'],
    overview: 'The "hello world" of deep learning, built end to end. Load 28x28 greyscale digits, flatten them into 784-vectors, push them through a two-layer network, and watch the test accuracy climb past 97%. By the end you have a training loop you wrote yourself and a model that reads handwriting.',
    youBuild: 'A NumPy MLP — data loader, forward pass, cross-entropy loss, backprop, and an SGD loop — that classifies MNIST digits with 97%+ held-out accuracy.',
    skills: ['matrix multiply as a layer', 'softmax + cross-entropy', 'mini-batch SGD', 'train/test split'],
    steps: [
      { title: 'Load and normalize the data', detail: 'Read the MNIST arrays, scale pixels to [0,1], one-hot the labels, and split into train and test. Sanity-check one image by printing it as ASCII.' },
      { title: 'Define the network shape', detail: 'A 784 → 128 → 10 MLP: two weight matrices and two bias vectors. Initialize weights with small random values scaled by 1/sqrt(fan_in).' },
      { title: 'Forward pass', detail: 'Linear, ReLU, linear, softmax. Keep the pre-activations cached — you need them for the backward pass.' },
      { title: 'Loss and gradients', detail: 'Cross-entropy on the softmax output. Derive dL/dz for the output layer (it collapses to softmax minus one-hot), then backprop through the hidden layer.' },
      { title: 'Train and evaluate', detail: 'Loop over mini-batches, update with SGD, and print test accuracy each epoch. Push past 97% by tuning learning rate and hidden width.' },
    ],
    starter: `import numpy as np

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def forward(x, W1, b1, W2, b2):
    h = np.maximum(0, x @ W1 + b1)   # ReLU hidden layer
    logits = h @ W2 + b2
    return h, softmax(logits)`,
  },
  {
    slug: 'backprop-engine',
    title: 'Backprop engine from scratch',
    diff: 'hard',
    goal: 'Build a tiny autograd: a Value class that tracks the graph and computes gradients on .backward().',
    tags: ['autograd', 'calculus', 'graphs'],
    overview: 'Reverse-mode automatic differentiation in under 150 lines. Each Value wraps a number and remembers the operation that produced it. Call .backward() on a scalar and gradients flow to every leaf via a reverse topological walk. This is the engine inside PyTorch, demystified.',
    youBuild: 'A scalar autograd library: a Value type supporting +, *, tanh, and exp, that builds a computation graph and runs reverse-mode backprop to fill .grad on every node.',
    skills: ['the chain rule as graph traversal', 'topological sort', 'operator overloading', 'local vs accumulated gradients'],
    steps: [
      { title: 'The Value wrapper', detail: 'Store data, grad (init 0), the set of parents, and a _backward closure that defaults to a no-op. Override __add__ and __mul__ to build child nodes.' },
      { title: 'Local gradients per op', detail: 'For each operation, write the _backward that pushes the local derivative times the child grad back onto the parents. Addition copies grad; multiply swaps the other operand in.' },
      { title: 'Nonlinearities', detail: 'Add tanh and exp. Their derivatives (1 - tanh^2 and exp itself) are clean — wire them into _backward.' },
      { title: 'Topological order', detail: 'Build a reverse-topological list of the graph with DFS so each node is processed only after everything downstream of it.' },
      { title: 'backward()', detail: 'Seed the output grad to 1, walk the reverse-topo list, and call each _backward. Verify against a tiny numeric finite-difference check.' },
    ],
    starter: `class Value:
    def __init__(self, data, _parents=()):
        self.data = data
        self.grad = 0.0
        self._parents = set(_parents)
        self._backward = lambda: None

    def __add__(self, other):
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out`,
  },
  {
    slug: 'linear-regression-toolkit',
    title: 'Linear regression toolkit',
    diff: 'easy',
    goal: 'Fit, predict, and evaluate ordinary least squares two ways — closed form and gradient descent.',
    tags: ['regression', 'gradients'],
    overview: 'The simplest model worth building well. Solve least squares two ways and prove they agree: the normal-equation closed form gives the exact optimum in one shot, while gradient descent walks toward it. Wrap both behind a clean fit/predict/score API.',
    youBuild: 'A LinearRegression class with two solvers (normal equation and gradient descent), a predict method, and an R-squared score — verified to match on the same data.',
    skills: ['the normal equation', 'gradient of MSE', 'R-squared', 'design-matrix bias trick'],
    steps: [
      { title: 'Design matrix', detail: 'Append a column of ones to X so the bias is just another weight. Now the whole model is a single matrix-vector product.' },
      { title: 'Closed-form solver', detail: 'Compute w = (XᵀX)⁻¹ Xᵀy. This is the exact least-squares optimum — no iteration needed.' },
      { title: 'Gradient-descent solver', detail: 'Start from zeros, step against the MSE gradient (2/n)Xᵀ(Xw − y) for a fixed number of iterations, and tune the learning rate.' },
      { title: 'Predict and score', detail: 'Add predict (X @ w) and an R-squared score comparing residual variance to total variance.' },
      { title: 'Prove they agree', detail: 'Run both solvers on the same dataset and assert the weights match to a few decimals. They should.' },
    ],
    starter: `import numpy as np

def fit_closed_form(X, y):
    X1 = np.c_[np.ones(len(X)), X]   # bias column
    return np.linalg.solve(X1.T @ X1, X1.T @ y)

def r2_score(y, y_hat):
    ss_res = ((y - y_hat) ** 2).sum()
    ss_tot = ((y - y.mean()) ** 2).sum()
    return 1 - ss_res / ss_tot`,
  },
  {
    slug: 'finetune-small-transformer',
    title: 'Fine-tune a small transformer',
    diff: 'hard',
    goal: 'Take a tiny pretrained language model and adapt it to a new text task with LoRA.',
    tags: ['transformers', 'lora', 'nlp'],
    overview: 'Adapt a pretrained model without touching most of its weights. LoRA freezes the base model and trains tiny low-rank deltas on the attention projections — a fraction of the parameters, a fraction of the memory, nearly all of the quality. Fine-tune a small model on a focused task and watch it specialize.',
    youBuild: 'A LoRA fine-tuning script: load a small pretrained transformer, inject low-rank adapters into the attention layers, freeze the rest, and train on a task-specific dataset.',
    skills: ['low-rank adaptation', 'freezing vs training params', 'attention projection layers', 'a real training loop'],
    steps: [
      { title: 'Load a small base model', detail: 'Pick a compact pretrained transformer and a focused dataset (sentiment, intent, or a small instruction set). Confirm a forward pass runs.' },
      { title: 'Understand the projections', detail: 'Locate the query/value projection matrices in each attention block — these are where LoRA adapters attach.' },
      { title: 'Inject LoRA adapters', detail: 'For each target matrix W, add a parallel branch B·A where A and B are low-rank. Freeze W; only A and B train.' },
      { title: 'Train the adapters', detail: 'Run a standard loop, but only the adapter parameters receive gradients. Memory and step time drop sharply.' },
      { title: 'Evaluate the specialization', detail: 'Compare base vs adapted model on held-out task examples. The delta is small in parameters but large in behavior.' },
    ],
    starter: `import torch, torch.nn as nn

class LoRALinear(nn.Module):
    def __init__(self, base: nn.Linear, r=8, alpha=16):
        super().__init__()
        self.base = base                      # frozen
        for p in self.base.parameters():
            p.requires_grad = False
        self.A = nn.Parameter(torch.randn(r, base.in_features) * 0.01)
        self.B = nn.Parameter(torch.zeros(base.out_features, r))
        self.scale = alpha / r

    def forward(self, x):
        return self.base(x) + self.scale * (x @ self.A.T @ self.B.T)`,
  },
  {
    slug: 'movie-recommender',
    title: 'Movie recommender',
    diff: 'medium',
    goal: 'Learn user and item embeddings by matrix factorization and recommend unseen titles.',
    tags: ['embeddings', 'matrix-factorization'],
    overview: 'Recommendation as a matrix-completion problem. The ratings table is mostly empty; matrix factorization fills it by learning a short vector for every user and every movie so that their dot product reconstructs the known ratings. The same vectors then predict the blanks.',
    youBuild: 'A matrix-factorization recommender: learn user and item embedding tables by SGD on observed ratings, then rank a user\'s unseen movies by predicted score.',
    skills: ['embeddings as lookup tables', 'dot-product scoring', 'SGD on sparse data', 'regularization to avoid overfit'],
    steps: [
      { title: 'Shape the ratings', detail: 'Build a list of (user, item, rating) triples from the observed entries. You never materialize the full dense matrix.' },
      { title: 'Initialize embeddings', detail: 'Two tables: one row per user, one per movie, each a small random vector (say length 32). The predicted rating is their dot product plus biases.' },
      { title: 'SGD over observed ratings', detail: 'For each observed triple, step both embeddings against the squared-error gradient. Add L2 regularization so vectors stay small.' },
      { title: 'Predict the blanks', detail: 'For a target user, score every movie they have not rated by dotting their vector with each movie vector.' },
      { title: 'Recommend top-k', detail: 'Sort unseen movies by predicted score and return the top few. Spot-check that they fit the user\'s known taste.' },
    ],
    starter: `import numpy as np

def predict(U, V, bu, bi, mu, u, i):
    return mu + bu[u] + bi[i] + U[u] @ V[i]

def sgd_step(U, V, bu, bi, mu, u, i, r, lr=0.01, reg=0.02):
    err = r - predict(U, V, bu, bi, mu, u, i)
    U[u] += lr * (err * V[i] - reg * U[u])
    V[i] += lr * (err * U[u] - reg * V[i])
    bu[u] += lr * (err - reg * bu[u])
    bi[i] += lr * (err - reg * bi[i])`,
  },
  {
    slug: 'image-autoencoder',
    title: 'Image autoencoder',
    diff: 'medium',
    goal: 'Compress images through a bottleneck and reconstruct them; visualize the latent space.',
    tags: ['autoencoder', 'unsupervised'],
    overview: 'Learning to compress without labels. An encoder squeezes an image down to a handful of numbers; a decoder rebuilds it. The only supervision is the reconstruction error. The narrow bottleneck forces the network to keep what matters and discard the rest — and that bottleneck is a learned, low-dimensional map of your data.',
    youBuild: 'An autoencoder: an encoder/decoder pair trained to reconstruct images through a 2-D bottleneck, plus a scatter plot of where each class lands in the latent space.',
    skills: ['encoder/decoder structure', 'reconstruction loss', 'the information bottleneck', 'latent-space visualization'],
    steps: [
      { title: 'Encoder', detail: 'Map the flattened image down through a couple of layers to a tiny latent vector — make it 2-D so you can plot it directly.' },
      { title: 'Decoder', detail: 'Mirror the encoder: expand the latent vector back up to the original pixel count, ending in a sigmoid.' },
      { title: 'Reconstruction loss', detail: 'Mean squared error (or binary cross-entropy) between input and output. No labels involved.' },
      { title: 'Train', detail: 'Standard loop. Watch reconstructions sharpen from blurry blobs into recognizable images.' },
      { title: 'Plot the latent space', detail: 'Encode the test set and scatter the 2-D codes, colored by class. Classes cluster — the network found structure with no labels.' },
    ],
    starter: `import torch.nn as nn

class AutoEncoder(nn.Module):
    def __init__(self, d_in=784, d_latent=2):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(d_in, 128), nn.ReLU(),
                                 nn.Linear(128, d_latent))
        self.dec = nn.Sequential(nn.Linear(d_latent, 128), nn.ReLU(),
                                 nn.Linear(128, d_in), nn.Sigmoid())

    def forward(self, x):
        z = self.enc(x)
        return self.dec(z), z`,
  },
  {
    slug: 'sentiment-classifier',
    title: 'Sentiment classifier',
    diff: 'medium',
    goal: 'Turn reviews into bag-of-words or embeddings and predict positive vs negative.',
    tags: ['nlp', 'classification'],
    overview: 'Text in, sentiment out. Start with the bag-of-words baseline — count words, fit logistic regression — then graduate to averaged word embeddings and measure the lift. A clean introduction to turning language into vectors a classifier can read.',
    youBuild: 'A sentiment pipeline: tokenize reviews, build both a bag-of-words and an embedding-average representation, train logistic regression on each, and compare accuracy.',
    skills: ['tokenization', 'bag-of-words vectors', 'word embeddings', 'logistic regression'],
    steps: [
      { title: 'Tokenize and build a vocabulary', detail: 'Lowercase, split on whitespace/punctuation, and map the most frequent tokens to indices. Cap the vocabulary size.' },
      { title: 'Bag-of-words baseline', detail: 'Represent each review as a count vector over the vocabulary. Train logistic regression and record accuracy.' },
      { title: 'Embedding-average features', detail: 'Replace counts with the mean of pretrained word vectors over the review. Often a big jump from bag-of-words.' },
      { title: 'Train and compare', detail: 'Fit the same classifier on both feature sets and compare held-out accuracy. Note where each one fails.' },
      { title: 'Inspect the weights', detail: 'In the bag-of-words model, the largest positive and negative weights are the most polarizing words. Read them.' },
    ],
    starter: `from collections import Counter
import numpy as np

def build_vocab(docs, max_size=5000):
    counts = Counter(t for d in docs for t in d.split())
    common = [w for w, _ in counts.most_common(max_size)]
    return {w: i for i, w in enumerate(common)}

def bow_vector(doc, vocab):
    v = np.zeros(len(vocab))
    for t in doc.split():
        if t in vocab:
            v[vocab[t]] += 1
    return v`,
  },
  {
    slug: 'kmeans-image-quantizer',
    title: 'k-means image quantizer',
    diff: 'easy',
    goal: 'Cluster the pixels of an image into k colors and re-render it with the reduced palette.',
    tags: ['clustering', 'kmeans'],
    overview: 'k-means you can literally see. Treat every pixel as a point in RGB space, cluster them into k groups, and repaint each pixel with its cluster\'s average color. The output is the same image rendered in a k-color palette — a posterized version where the clustering is visible at a glance.',
    youBuild: 'A k-means color quantizer: cluster an image\'s pixels in RGB space and re-render it using only k average colors, with a side-by-side before/after.',
    skills: ['k-means assignment + update', 'centroid means', 'convergence', 'pixels as data points'],
    steps: [
      { title: 'Reshape to a point cloud', detail: 'Flatten the H×W×3 image into an (H·W, 3) array. Each row is one pixel, one point in RGB space.' },
      { title: 'Initialize centroids', detail: 'Pick k random pixels as starting cluster centers. (k-means++ is a nice upgrade once the basic version works.)' },
      { title: 'Assignment step', detail: 'Assign each pixel to its nearest centroid by Euclidean distance in RGB.' },
      { title: 'Update step', detail: 'Move each centroid to the mean of its assigned pixels. Repeat assign/update until centroids stop moving.' },
      { title: 'Repaint and compare', detail: 'Replace each pixel with its centroid color, reshape back to H×W×3, and show original vs quantized side by side.' },
    ],
    starter: `import numpy as np

def kmeans(points, k, iters=20):
    centroids = points[np.random.choice(len(points), k, replace=False)]
    for _ in range(iters):
        d = ((points[:, None] - centroids[None]) ** 2).sum(-1)
        labels = d.argmin(1)
        for j in range(k):
            if (labels == j).any():
                centroids[j] = points[labels == j].mean(0)
    return centroids, labels`,
  },
  {
    slug: 'cartpole-policy-gradient',
    title: 'CartPole with policy gradients',
    diff: 'hard',
    goal: 'Train an agent to balance the pole using REINFORCE, then watch it improve over episodes.',
    tags: ['rl', 'policy-gradient'],
    overview: 'The cleanest entry point into reinforcement learning. A policy network outputs action probabilities; you sample, run an episode, and nudge the policy toward the actions that led to long episodes. REINFORCE in roughly fifty lines, and the reward curve climbs from a few steps to hundreds.',
    youBuild: 'A REINFORCE agent for CartPole: a policy network, episode rollouts, discounted returns, and the policy-gradient update — trained until the pole stays up.',
    skills: ['the policy-gradient theorem', 'discounted returns', 'sampling actions', 'reward as a learning signal'],
    steps: [
      { title: 'Policy network', detail: 'A small net from the 4-D CartPole state to two action logits. Softmax gives a distribution you sample the action from.' },
      { title: 'Roll out an episode', detail: 'Step the environment until the pole falls, recording the log-prob of each chosen action and the reward at each step.' },
      { title: 'Discounted returns', detail: 'Compute the return at each timestep as the discounted sum of future rewards, then standardize them across the episode.' },
      { title: 'Policy-gradient update', detail: 'Loss is the negative sum of log-prob times return. Backprop and step — actions in good episodes get more likely.' },
      { title: 'Train and watch it learn', detail: 'Loop over episodes and plot episode length. It rises from near-random to the environment\'s cap as the policy sharpens.' },
    ],
    starter: `import torch

def discounted_returns(rewards, gamma=0.99):
    R, out = 0.0, []
    for r in reversed(rewards):
        R = r + gamma * R
        out.insert(0, R)
    out = torch.tensor(out)
    return (out - out.mean()) / (out.std() + 1e-8)

def reinforce_loss(log_probs, returns):
    return -(torch.stack(log_probs) * returns).sum()`,
  },
  {
    slug: 'diffusion-toy-2d',
    title: 'Diffusion on toy 2D data',
    diff: 'hard',
    goal: 'Add noise to a 2D distribution, learn to reverse it, then sample new points from noise.',
    tags: ['diffusion', 'generative'],
    overview: 'Diffusion models, stripped to two dimensions so you can plot every step. Take a 2-D distribution (a spiral, two moons), progressively drown it in noise, then train a small network to predict the noise so you can walk the process backward. Sampling starts from pure noise and lands back on the data manifold — and you can watch it happen.',
    youBuild: 'A 2-D denoising diffusion model: a forward noising schedule, a network trained to predict added noise, and a reverse sampler that turns Gaussian noise into points on the original shape.',
    skills: ['forward noising schedule', 'noise-prediction objective', 'the reverse process', 'generative sampling'],
    steps: [
      { title: 'Pick a 2-D dataset', detail: 'Generate a shape you can see: two moons, a spiral, or a Gaussian mixture. A few thousand points is plenty.' },
      { title: 'Forward noising', detail: 'Define a variance schedule and a closed-form way to jump straight to any noise level: x_t = √(ᾱ_t)·x_0 + √(1−ᾱ_t)·ε.' },
      { title: 'Train the denoiser', detail: 'A small MLP takes (noisy point, timestep) and predicts the noise ε. The loss is MSE between predicted and true noise.' },
      { title: 'Reverse sampling', detail: 'Start from pure Gaussian noise and iteratively subtract the predicted noise, stepping down the schedule one level at a time.' },
      { title: 'Watch it form', detail: 'Plot the sample cloud at several reverse steps. It morphs from a blob into your original shape.' },
    ],
    starter: `import torch

def q_sample(x0, t, alpha_bar):
    # jump straight to noise level t in one shot
    a = alpha_bar[t].sqrt()
    b = (1 - alpha_bar[t]).sqrt()
    eps = torch.randn_like(x0)
    return a * x0 + b * eps, eps

def diffusion_loss(model, x0, t, alpha_bar):
    x_t, eps = q_sample(x0, t, alpha_bar)
    eps_hat = model(x_t, t)
    return ((eps - eps_hat) ** 2).mean()`,
  },
];

export function getProject(slug) {
  return PG_FORGE_PROJECTS.find((p) => p.slug === slug) || null;
}
