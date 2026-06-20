// End-to-end build projects for the PGForge ML area. Original teaching copy.
// Each project gets its own detail page at /ml/projects/<slug>.
//
// Shape:
//   { slug, title, tagline, difficulty: 'easy'|'medium'|'hard',
//     tags: [], overview (60+ words), whatYouBuild, skills: [],
//     buildSteps: [{ title, detail }] (6-9 graduated steps),
//     starterSnippet (a real, runnable code string), estTime }

export const PG_FORGE_PROJECTS = [
  {
    slug: 'linear-regression-from-scratch',
    title: 'Linear regression from scratch',
    tagline: 'Fit a line two ways — the closed-form normal equation and gradient descent — and prove they agree.',
    difficulty: 'easy',
    tags: ['numpy', 'regression', 'gradients'],
    overview:
      'Linear regression is the smallest complete machine-learning system: a model, a loss, and an optimizer. In this build you implement ordinary least squares twice. First you solve it analytically with the normal equation, which hands you the exact best weights in one matrix expression. Then you reach the same weights iteratively with gradient descent, watching the mean squared error fall step by step. Comparing the two answers teaches you what gradient descent is actually converging toward and why the loss surface of a linear model is a simple bowl with one minimum.',
    whatYouBuild:
      'A small library with fit_closed_form(X, y) and fit_gradient_descent(X, y) plus a plot of the loss curve and the fitted line over a synthetic dataset.',
    skills: ['Mean squared error', 'The normal equation', 'Batch gradient descent', 'Feature matrices and bias terms', 'Convergence diagnostics'],
    buildSteps: [
      { title: 'Generate synthetic data', detail: 'Sample x uniformly, pick a true slope and intercept, then add Gaussian noise. Keeping the ground truth lets you check your fit.' },
      { title: 'Add a bias column', detail: 'Prepend a column of ones to X so the intercept becomes just another weight and every formula stays a clean matrix multiply.' },
      { title: 'Solve the normal equation', detail: 'Compute w = (XᵀX)⁻¹Xᵀy. Use np.linalg.solve rather than an explicit inverse for numerical stability.' },
      { title: 'Write the loss function', detail: 'Implement mean squared error as a single vectorized expression. This is the quantity gradient descent will minimize.' },
      { title: 'Derive and code the gradient', detail: 'The gradient of MSE is (2/n)Xᵀ(Xw − y). Implement it and verify it against a numeric finite-difference estimate.' },
      { title: 'Run the gradient-descent loop', detail: 'Initialize weights at zero, step against the gradient with a fixed learning rate, and record the loss each iteration.' },
      { title: 'Compare and visualize', detail: 'Confirm the gradient-descent weights converge to the closed-form weights, then plot the loss curve and the fitted line.' },
    ],
    starterSnippet: `import numpy as np

def make_data(n=200, slope=2.5, bias=-1.0, noise=0.5, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.uniform(-3, 3, size=(n, 1))
    y = slope * x[:, 0] + bias + rng.normal(0, noise, size=n)
    X = np.hstack([np.ones((n, 1)), x])  # bias column first
    return X, y

def mse(X, y, w):
    err = X @ w - y
    return float(err @ err) / len(y)

def fit_closed_form(X, y):
    return np.linalg.solve(X.T @ X, X.T @ y)

def fit_gradient_descent(X, y, lr=0.05, steps=500):
    w = np.zeros(X.shape[1])
    history = []
    for _ in range(steps):
        grad = (2 / len(y)) * X.T @ (X @ w - y)
        w -= lr * grad
        history.append(mse(X, y, w))
    return w, history

if __name__ == "__main__":
    X, y = make_data()
    w_exact = fit_closed_form(X, y)
    w_gd, hist = fit_gradient_descent(X, y)
    print("closed form:", w_exact)
    print("gradient descent:", w_gd)
    print("final loss:", hist[-1])
`,
    estTime: '2-3 hours',
  },
  {
    slug: 'micrograd-autograd-engine',
    title: 'A micrograd-style autograd engine',
    tagline: 'Build a Value class that records the computation graph and computes every gradient on .backward().',
    difficulty: 'hard',
    tags: ['autograd', 'calculus', 'graphs'],
    overview:
      'Every deep-learning framework is, at its core, an automatic differentiation engine wrapped in convenience. In this build you write that core yourself. A scalar Value object remembers the operation that produced it and the inputs that fed it, so the whole forward computation forms a directed graph. Calling backward() walks that graph in reverse topological order and applies the chain rule at each node, depositing a gradient into every leaf. Once it works you train a tiny neural network with it, and the magic word "backprop" stops being magic.',
    whatYouBuild:
      'A Value class supporting +, *, and tanh with a working backward(), plus a tiny multi-layer perceptron trained on a toy classification problem using only your engine.',
    skills: ['The chain rule on a graph', 'Topological sort', 'Operator overloading in Python', 'Reverse-mode differentiation', 'Building a neuron from primitives'],
    buildSteps: [
      { title: 'Define the Value node', detail: 'Store data, a grad initialized to zero, the set of child nodes, and a _backward closure that is empty by default.' },
      { title: 'Overload addition', detail: 'Return a new Value whose _backward adds the incoming gradient to both operands. Addition just routes the gradient through unchanged.' },
      { title: 'Overload multiplication', detail: 'For c = a * b, the local gradients are b and a. Each operand accumulates the upstream gradient times the other operand.' },
      { title: 'Add a nonlinearity', detail: 'Implement tanh. Its derivative is 1 − tanh², which the _backward closure multiplies into the upstream gradient.' },
      { title: 'Topologically sort the graph', detail: 'Depth-first from the output node to order every node so each is processed only after its consumers.' },
      { title: 'Implement backward()', detail: 'Seed the output gradient at 1.0, then call each node\'s _backward in reverse topological order.' },
      { title: 'Build a neuron and layer', detail: 'Wrap Values into a Neuron (weights, bias, tanh) and stack neurons into layers and an MLP.' },
      { title: 'Train on toy data', detail: 'Run a manual loop: forward pass, compute loss, zero the grads, backward, and nudge every parameter against its gradient.' },
    ],
    starterSnippet: `import math

class Value:
    def __init__(self, data, _children=()):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,))
        def _backward():
            self.grad += (1 - t * t) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for child in v._prev:
                    build(child)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for node in reversed(topo):
            node._backward()

if __name__ == "__main__":
    a, b = Value(2.0), Value(-3.0)
    L = (a * b + a).tanh()
    L.backward()
    print("dL/da =", a.grad, " dL/db =", b.grad)
`,
    estTime: '4-6 hours',
  },
  {
    slug: 'mnist-mlp-numpy',
    title: 'MNIST digit classifier in pure numpy',
    tagline: 'Train a two-layer MLP to read handwritten digits at 97%+ accuracy with no deep-learning framework.',
    difficulty: 'medium',
    tags: ['numpy', 'mlp', 'classification'],
    overview:
      'This is the rite of passage of practical deep learning, done without a framework to hide the mechanics. You load the MNIST digits, build a network with one hidden layer, and implement the forward pass, the softmax cross-entropy loss, and the full backward pass by hand. Every matrix shape has to line up, every gradient has to be derived, and the mini-batch loop has to actually drive the loss down. When the test accuracy crosses 97% you will understand exactly which line of code earned each percent.',
    whatYouBuild:
      'A trainable MLP class with forward, backward, and a mini-batch SGD loop that reaches 97%+ test accuracy on MNIST, plus a confusion matrix of its mistakes.',
    skills: ['Softmax cross-entropy', 'Manual backpropagation', 'Mini-batch SGD', 'He initialization', 'ReLU activations'],
    buildSteps: [
      { title: 'Load and normalize MNIST', detail: 'Flatten each 28×28 image to a 784-vector, scale pixels to [0, 1], and one-hot encode the labels.' },
      { title: 'Initialize the parameters', detail: 'Two weight matrices and two bias vectors. Use He initialization so signals neither vanish nor explode through ReLU.' },
      { title: 'Write the forward pass', detail: 'Hidden = ReLU(X·W1 + b1); logits = Hidden·W2 + b2. Apply a numerically stable softmax to get class probabilities.' },
      { title: 'Compute the loss', detail: 'Average cross-entropy over the batch. Subtract the row max before exponentiating to avoid overflow.' },
      { title: 'Derive the backward pass', detail: 'The softmax cross-entropy gradient is simply probs − onehot. Backprop it through W2, the ReLU, and W1.' },
      { title: 'Run mini-batch SGD', detail: 'Shuffle each epoch, slice batches, take a gradient step per batch, and track train and test accuracy.' },
      { title: 'Tune to 97%+', detail: 'Adjust the hidden width, learning rate, and epoch count until test accuracy clears 97%.' },
      { title: 'Inspect the errors', detail: 'Build a confusion matrix and eyeball the misclassified digits — most are genuinely ambiguous.' },
    ],
    starterSnippet: `import numpy as np

def relu(x):
    return np.maximum(0, x)

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

class MLP:
    def __init__(self, n_in=784, n_hidden=128, n_out=10, seed=0):
        rng = np.random.default_rng(seed)
        self.W1 = rng.standard_normal((n_in, n_hidden)) * np.sqrt(2 / n_in)
        self.b1 = np.zeros(n_hidden)
        self.W2 = rng.standard_normal((n_hidden, n_out)) * np.sqrt(2 / n_hidden)
        self.b2 = np.zeros(n_out)

    def forward(self, X):
        self.X = X
        self.h_pre = X @ self.W1 + self.b1
        self.h = relu(self.h_pre)
        self.probs = softmax(self.h @ self.W2 + self.b2)
        return self.probs

    def backward(self, y_onehot, lr=0.1):
        n = len(self.X)
        dlogits = (self.probs - y_onehot) / n
        dW2 = self.h.T @ dlogits
        db2 = dlogits.sum(axis=0)
        dh = (dlogits @ self.W2.T) * (self.h_pre > 0)
        dW1 = self.X.T @ dh
        db1 = dh.sum(axis=0)
        self.W2 -= lr * dW2; self.b2 -= lr * db2
        self.W1 -= lr * dW1; self.b1 -= lr * db1
`,
    estTime: '4-5 hours',
  },
  {
    slug: 'char-rnn-text-generator',
    title: 'A tiny char-RNN text generator',
    tagline: 'Train a recurrent network one character at a time and watch it learn to babble in your training style.',
    difficulty: 'hard',
    tags: ['rnn', 'sequence', 'nlp'],
    overview:
      'Before transformers, recurrent networks were how machines read sequences, and writing one teaches you what a hidden state really is: a compressed memory of everything seen so far. In this build you train a character-level RNN on a text file. The model predicts the next character from the current one and its hidden state, and backpropagation through time threads gradients across the whole sequence. Sampling from the trained model produces text that drifts from noise toward something that imitates your source — a small, satisfying demonstration of sequence learning.',
    whatYouBuild:
      'A character-level RNN in PyTorch that trains on any text file and a sampling function that generates fresh text in the learned style.',
    skills: ['Recurrent hidden state', 'Backpropagation through time', 'Character-level tokenization', 'Temperature sampling', 'Cross-entropy over sequences'],
    buildSteps: [
      { title: 'Build the vocabulary', detail: 'Read the text, collect the unique characters, and map each to an integer index and back.' },
      { title: 'Cut training sequences', detail: 'Slide a fixed-length window over the text to form (input, next-char-target) pairs for batching.' },
      { title: 'Define the RNN cell', detail: 'An embedding, a single recurrent layer, and a linear head projecting the hidden state to vocabulary logits.' },
      { title: 'Set up the loss', detail: 'Cross-entropy between the predicted logits and the shifted targets, averaged over every position in the sequence.' },
      { title: 'Train with truncated BPTT', detail: 'Detach the hidden state between chunks so gradients stay bounded, and step the optimizer per batch.' },
      { title: 'Write the sampler', detail: 'Feed a seed character, sample from the softmax with a temperature, append it, and repeat to grow text.' },
      { title: 'Watch it improve', detail: 'Sample every few hundred steps. The output should march from random characters to word-like fragments.' },
    ],
    starterSnippet: `import torch
import torch.nn as nn

class CharRNN(nn.Module):
    def __init__(self, vocab_size, embed=64, hidden=256):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed)
        self.rnn = nn.GRU(embed, hidden, batch_first=True)
        self.head = nn.Linear(hidden, vocab_size)

    def forward(self, x, h=None):
        x = self.embed(x)
        out, h = self.rnn(x, h)
        return self.head(out), h

@torch.no_grad()
def sample(model, stoi, itos, seed="T", length=200, temp=0.8):
    model.eval()
    idx = torch.tensor([[stoi[seed]]])
    h, chars = None, [seed]
    for _ in range(length):
        logits, h = model(idx, h)
        probs = torch.softmax(logits[0, -1] / temp, dim=-1)
        nxt = torch.multinomial(probs, 1).item()
        chars.append(itos[nxt])
        idx = torch.tensor([[nxt]])
    return "".join(chars)
`,
    estTime: '4-6 hours',
  },
  {
    slug: 'transformer-block-from-scratch',
    title: 'A transformer block from scratch',
    tagline: 'Assemble multi-head self-attention, residuals, and a feed-forward network into the block behind modern LLMs.',
    difficulty: 'hard',
    tags: ['transformers', 'attention', 'pytorch'],
    overview:
      'The transformer block is the unit that, stacked dozens of times, becomes a large language model. In this build you implement one from its primitives. You compute scaled dot-product attention, split it into multiple heads so the model can attend to several relationships at once, and wrap it with residual connections and layer normalization. A position-wise feed-forward network finishes the block. Working through the tensor reshapes and the attention mask by hand demystifies the architecture and leaves you able to read the original paper as a description of code you have already written.',
    whatYouBuild:
      'A self-contained TransformerBlock module with multi-head attention, residual connections, layer norm, and an MLP, verified on a random input tensor with shape assertions.',
    skills: ['Scaled dot-product attention', 'Multi-head reshaping', 'Residual connections', 'Layer normalization', 'Causal masking'],
    buildSteps: [
      { title: 'Project to Q, K, V', detail: 'A single linear layer produces queries, keys, and values, then you reshape them into separate heads.' },
      { title: 'Score and scale', detail: 'Compute QKᵀ and divide by the square root of the head dimension to keep the softmax in a stable range.' },
      { title: 'Apply the causal mask', detail: 'Fill the upper triangle with −infinity so each position can only attend to itself and earlier tokens.' },
      { title: 'Weight the values', detail: 'Softmax the scores along the key axis and use them to take a weighted sum of the value vectors.' },
      { title: 'Merge the heads', detail: 'Concatenate the per-head outputs and pass them through an output projection back to the model dimension.' },
      { title: 'Add residuals and norm', detail: 'Wrap attention and the feed-forward sublayer each in a residual connection followed by layer normalization.' },
      { title: 'Add the feed-forward network', detail: 'A two-layer MLP with a GELU in between, widening to 4× the model dimension and back.' },
      { title: 'Verify the shapes', detail: 'Run a random (batch, seq, dim) tensor through the block and assert the output shape matches the input.' },
    ],
    starterSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F

class TransformerBlock(nn.Module):
    def __init__(self, dim=128, heads=4, ff_mult=4):
        super().__init__()
        self.heads = heads
        self.qkv = nn.Linear(dim, dim * 3)
        self.proj = nn.Linear(dim, dim)
        self.ln1 = nn.LayerNorm(dim)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * ff_mult), nn.GELU(),
            nn.Linear(dim * ff_mult, dim),
        )

    def attn(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        q, k, v = [t.view(B, T, self.heads, C // self.heads).transpose(1, 2)
                   for t in (q, k, v)]
        scores = (q @ k.transpose(-2, -1)) / (q.size(-1) ** 0.5)
        mask = torch.triu(torch.ones(T, T, device=x.device), 1).bool()
        scores = scores.masked_fill(mask, float("-inf"))
        out = F.softmax(scores, dim=-1) @ v
        out = out.transpose(1, 2).reshape(B, T, C)
        return self.proj(out)

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x

if __name__ == "__main__":
    blk = TransformerBlock()
    x = torch.randn(2, 16, 128)
    assert blk(x).shape == x.shape
    print("ok", blk(x).shape)
`,
    estTime: '5-7 hours',
  },
  {
    slug: 'kmeans-pca-on-real-data',
    title: 'k-means + PCA on real data',
    tagline: 'Cluster a real dataset with k-means, then use PCA to project the clusters down to a plot you can actually see.',
    difficulty: 'medium',
    tags: ['clustering', 'pca', 'unsupervised'],
    overview:
      'Unsupervised learning finds structure with no labels, and these two algorithms are its workhorses. In this build you implement k-means clustering — alternating between assigning points to their nearest centroid and recomputing centroids — and watch it converge on a real dataset. Then you implement PCA from the covariance matrix to compress the high-dimensional points to two dimensions so you can plot the clusters and judge them by eye. Together they show how distance-based grouping and variance-based projection complement each other in any exploratory analysis.',
    whatYouBuild:
      'A kmeans(X, k) function with k-means++ initialization and a pca(X, n) function built from eigenvectors, used to cluster and visualize a real dataset in 2D.',
    skills: ['Lloyd\'s algorithm', 'k-means++ seeding', 'Covariance matrices', 'Eigendecomposition', 'Dimensionality reduction'],
    buildSteps: [
      { title: 'Load and standardize the data', detail: 'Pick a dataset such as the digits or iris set and z-score each feature so distances are not dominated by scale.' },
      { title: 'Seed with k-means++', detail: 'Choose initial centroids spread apart by sampling proportional to squared distance from the nearest chosen center.' },
      { title: 'Assign points to centroids', detail: 'Compute the distance from every point to every centroid and label each point with its closest one.' },
      { title: 'Update the centroids', detail: 'Move each centroid to the mean of the points assigned to it, then repeat until assignments stop changing.' },
      { title: 'Measure cluster quality', detail: 'Track inertia (the within-cluster sum of squares) and confirm it decreases monotonically across iterations.' },
      { title: 'Build PCA from covariance', detail: 'Center the data, form the covariance matrix, take its eigenvectors, and keep the two with the largest eigenvalues.' },
      { title: 'Project and plot', detail: 'Map the points onto the top two components and scatter them colored by cluster to see the structure.' },
    ],
    starterSnippet: `import numpy as np

def kmeans(X, k, iters=100, seed=0):
    rng = np.random.default_rng(seed)
    # k-means++ seeding
    centroids = [X[rng.integers(len(X))]]
    for _ in range(k - 1):
        d2 = np.min([((X - c) ** 2).sum(1) for c in centroids], axis=0)
        probs = d2 / d2.sum()
        centroids.append(X[rng.choice(len(X), p=probs)])
    centroids = np.array(centroids)
    for _ in range(iters):
        dists = ((X[:, None] - centroids[None]) ** 2).sum(-1)
        labels = dists.argmin(1)
        new = np.array([X[labels == j].mean(0) if (labels == j).any()
                        else centroids[j] for j in range(k)])
        if np.allclose(new, centroids):
            break
        centroids = new
    return labels, centroids

def pca(X, n=2):
    Xc = X - X.mean(0)
    cov = np.cov(Xc, rowvar=False)
    vals, vecs = np.linalg.eigh(cov)
    top = vecs[:, np.argsort(vals)[::-1][:n]]
    return Xc @ top
`,
    estTime: '3-4 hours',
  },
  {
    slug: 'cnn-image-classifier',
    title: 'A CNN image classifier',
    tagline: 'Build a convolutional network in PyTorch and train it to classify CIFAR-10 images with data augmentation.',
    difficulty: 'medium',
    tags: ['cnn', 'pytorch', 'vision'],
    overview:
      'Convolutional networks are how machines see, exploiting the fact that a useful feature looks the same wherever it appears in an image. In this build you assemble a CNN from convolution, batch-norm, ReLU, and pooling blocks, then train it on CIFAR-10. Along the way you add data augmentation so the model generalizes rather than memorizes, and you learn to read the training and validation curves to spot overfitting early. By the end you have a real image classifier and an intuition for why depth, normalization, and augmentation each matter.',
    whatYouBuild:
      'A compact CNN trained on CIFAR-10 with augmentation, a training loop reporting train/val accuracy per epoch, and a few-sample prediction visualization.',
    skills: ['Convolution and pooling', 'Batch normalization', 'Data augmentation', 'Train/validation monitoring', 'The Adam optimizer'],
    buildSteps: [
      { title: 'Load CIFAR-10 with transforms', detail: 'Use torchvision datasets and add random crops and horizontal flips to the training transform for augmentation.' },
      { title: 'Design the conv blocks', detail: 'Stack conv → batch-norm → ReLU → pool blocks, doubling the channel count as the spatial size halves.' },
      { title: 'Add the classifier head', detail: 'Flatten the final feature map and attach a couple of linear layers ending in ten class logits.' },
      { title: 'Pick loss and optimizer', detail: 'Cross-entropy loss with the Adam optimizer and a modest learning rate is a solid default.' },
      { title: 'Write the training loop', detail: 'Iterate epochs and batches; each step does forward, loss, backward, and optimizer.step, then logs accuracy.' },
      { title: 'Add a validation pass', detail: 'After each epoch run the held-out set with no gradients to track generalization and catch overfitting.' },
      { title: 'Visualize predictions', detail: 'Show a grid of test images with predicted and true labels to see where the model succeeds and fails.' },
    ],
    starterSnippet: `import torch
import torch.nn as nn

class SmallCNN(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        def block(cin, cout):
            return nn.Sequential(
                nn.Conv2d(cin, cout, 3, padding=1),
                nn.BatchNorm2d(cout), nn.ReLU(),
                nn.Conv2d(cout, cout, 3, padding=1),
                nn.BatchNorm2d(cout), nn.ReLU(),
                nn.MaxPool2d(2),
            )
        self.features = nn.Sequential(block(3, 32), block(32, 64), block(64, 128))
        self.head = nn.Sequential(
            nn.Flatten(), nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(), nn.Dropout(0.3), nn.Linear(256, n_classes),
        )

    def forward(self, x):
        return self.head(self.features(x))

if __name__ == "__main__":
    model = SmallCNN()
    out = model(torch.randn(8, 3, 32, 32))
    print(out.shape)  # torch.Size([8, 10])
`,
    estTime: '4-5 hours',
  },
  {
    slug: 'tokenizer-ngram-language-model',
    title: 'A tokenizer + n-gram language model',
    tagline: 'Train a count-based language model that predicts the next token from the ones before it — no neural net required.',
    difficulty: 'easy',
    tags: ['nlp', 'tokenization', 'probability'],
    overview:
      'Before you can model language you have to turn it into tokens, and before transformers there were n-gram models that predict the next token purely from counts. In this build you write a simple word tokenizer, count how often each n-gram appears, and turn those counts into conditional probabilities with smoothing so unseen contexts do not collapse to zero. Then you sample from the model to generate text and measure its perplexity. It is a complete, interpretable language model whose every probability you can trace back to a count in your training data.',
    whatYouBuild:
      'A tokenizer, an n-gram counter with add-k smoothing, a text sampler, and a perplexity evaluator, all driven from a plain text corpus.',
    skills: ['Tokenization', 'Conditional probability', 'Add-k smoothing', 'Sampling from a distribution', 'Perplexity'],
    buildSteps: [
      { title: 'Write a tokenizer', detail: 'Lowercase the text and split on word boundaries, optionally adding sentence-start and sentence-end markers.' },
      { title: 'Count the n-grams', detail: 'Slide a window of size n over the tokens and tally how often each context is followed by each next token.' },
      { title: 'Build conditional probabilities', detail: 'Divide each context-to-token count by the total count for that context to get P(next | context).' },
      { title: 'Add smoothing', detail: 'Apply add-k smoothing so contexts and tokens never seen in training still receive a small nonzero probability.' },
      { title: 'Sample text', detail: 'Start from a context, draw the next token from its conditional distribution, slide the window, and repeat.' },
      { title: 'Evaluate perplexity', detail: 'On held-out text, compute the average negative log-probability and exponentiate it to report perplexity.' },
      { title: 'Compare orders', detail: 'Train bigram, trigram, and 4-gram models and watch perplexity fall — and the samples grow more coherent then overfit.' },
    ],
    starterSnippet: `import random
from collections import defaultdict, Counter

def tokenize(text):
    return ["<s>"] + text.lower().split() + ["</s>"]

class NGram:
    def __init__(self, n=3, k=0.1):
        self.n, self.k = n, k
        self.counts = defaultdict(Counter)
        self.vocab = set()

    def fit(self, tokens):
        self.vocab.update(tokens)
        for i in range(len(tokens) - self.n + 1):
            ctx = tuple(tokens[i:i + self.n - 1])
            nxt = tokens[i + self.n - 1]
            self.counts[ctx][nxt] += 1

    def prob(self, ctx, token):
        c = self.counts[ctx]
        return (c[token] + self.k) / (sum(c.values()) + self.k * len(self.vocab))

    def sample(self, ctx, length=30):
        out = list(ctx)
        for _ in range(length):
            choices = list(self.vocab)
            weights = [self.prob(tuple(out[-(self.n - 1):]), w) for w in choices]
            out.append(random.choices(choices, weights)[0])
        return " ".join(out)
`,
    estTime: '2-3 hours',
  },
  {
    slug: 'gradient-descent-optimizer-zoo',
    title: 'A gradient-descent optimizer zoo',
    tagline: 'Implement SGD, momentum, RMSProp, and Adam side by side and race them down the same loss surface.',
    difficulty: 'medium',
    tags: ['optimization', 'numpy', 'gradients'],
    overview:
      'Every optimizer is a different rule for turning a gradient into a step, and the differences decide whether a model trains in minutes or stalls forever. In this build you implement four of them — plain SGD, SGD with momentum, RMSProp, and Adam — behind a common interface. Then you turn them loose on the same 2D test functions and plot the paths they trace toward the minimum. Watching momentum coast through a ravine that vanilla SGD zig-zags across, and seeing Adam combine both tricks, turns optimizer choice from a mystery into an intuition you can reason about.',
    whatYouBuild:
      'Four optimizer classes sharing a step(params, grads) interface, plus a visualization that overlays each optimizer\'s trajectory on a 2D loss surface.',
    skills: ['Momentum', 'Adaptive learning rates', 'Bias correction', 'The Rosenbrock function', 'Optimizer interfaces'],
    buildSteps: [
      { title: 'Define a common interface', detail: 'Each optimizer is a class with a step(params, grads) method, so they are interchangeable in the training loop.' },
      { title: 'Implement plain SGD', detail: 'The baseline: subtract the learning rate times the gradient. Everything else is a refinement of this.' },
      { title: 'Add momentum', detail: 'Maintain a velocity that accumulates past gradients, letting the optimizer build speed in consistent directions.' },
      { title: 'Implement RMSProp', detail: 'Keep a running average of squared gradients and divide the step by its root to adapt the rate per parameter.' },
      { title: 'Implement Adam', detail: 'Combine momentum and RMSProp, then apply bias correction so the early steps are not artificially tiny.' },
      { title: 'Pick test functions', detail: 'Use a simple bowl and the curved Rosenbrock valley to expose how each method handles easy and hard geometry.' },
      { title: 'Race and plot', detail: 'Run every optimizer from the same start and overlay their paths and loss curves on the contour plot.' },
    ],
    starterSnippet: `import numpy as np

class SGD:
    def __init__(self, lr=0.01):
        self.lr = lr
    def step(self, p, g):
        return p - self.lr * g

class Momentum:
    def __init__(self, lr=0.01, beta=0.9):
        self.lr, self.beta, self.v = lr, beta, None
    def step(self, p, g):
        self.v = g if self.v is None else self.beta * self.v + (1 - self.beta) * g
        return p - self.lr * self.v

class Adam:
    def __init__(self, lr=0.01, b1=0.9, b2=0.999, eps=1e-8):
        self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
        self.m = self.v = None
        self.t = 0
    def step(self, p, g):
        self.t += 1
        self.m = (1 - self.b1) * g if self.m is None else self.b1 * self.m + (1 - self.b1) * g
        self.v = (1 - self.b2) * g * g if self.v is None else self.b2 * self.v + (1 - self.b2) * g * g
        mhat = self.m / (1 - self.b1 ** self.t)
        vhat = self.v / (1 - self.b2 ** self.t)
        return p - self.lr * mhat / (np.sqrt(vhat) + self.eps)
`,
    estTime: '3-4 hours',
  },
  {
    slug: 'tiny-vae-demo',
    title: 'A tiny variational autoencoder',
    tagline: 'Compress digits into a smooth latent space, then sample brand-new digits by decoding random points.',
    difficulty: 'hard',
    tags: ['vae', 'generative', 'pytorch'],
    overview:
      'A variational autoencoder is the gateway to generative modeling: it learns to compress data into a continuous latent space organized smoothly enough that decoding a random point produces a plausible new sample. In this build you implement an encoder that outputs a mean and variance, the reparameterization trick that lets gradients flow through the sampling step, and a decoder that reconstructs the input. The loss balances reconstruction against a KL term that pulls the latent space toward a standard normal. Once trained on MNIST, sampling from that prior generates digits the model has never seen.',
    whatYouBuild:
      'A VAE in PyTorch trained on MNIST, with reconstruction examples and a grid of brand-new digits generated by decoding samples from the latent prior.',
    skills: ['Encoder/decoder networks', 'The reparameterization trick', 'KL divergence', 'The ELBO objective', 'Latent-space sampling'],
    buildSteps: [
      { title: 'Build the encoder', detail: 'Map each image to two vectors: the mean and the log-variance of its latent distribution.' },
      { title: 'Reparameterize', detail: 'Sample z = mean + std · epsilon with epsilon from a standard normal, so the randomness sits outside the gradient path.' },
      { title: 'Build the decoder', detail: 'Map a latent vector back to image pixels with a sigmoid output to keep values in [0, 1].' },
      { title: 'Write the ELBO loss', detail: 'Sum a reconstruction term (binary cross-entropy) and the KL divergence between the latent and a unit Gaussian.' },
      { title: 'Train the model', detail: 'Run the encode-sample-decode loop, minimizing the loss with Adam over several epochs.' },
      { title: 'Reconstruct test images', detail: 'Pass held-out digits through the full model and compare inputs to reconstructions side by side.' },
      { title: 'Generate new digits', detail: 'Sample z from the standard normal prior, decode each, and arrange the results in a grid.' },
    ],
    starterSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, in_dim=784, hidden=400, latent=20):
        super().__init__()
        self.enc = nn.Linear(in_dim, hidden)
        self.mu = nn.Linear(hidden, latent)
        self.logvar = nn.Linear(hidden, latent)
        self.dec1 = nn.Linear(latent, hidden)
        self.dec2 = nn.Linear(hidden, in_dim)

    def encode(self, x):
        h = F.relu(self.enc(x))
        return self.mu(h), self.logvar(h)

    def reparam(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        return mu + std * torch.randn_like(std)

    def decode(self, z):
        return torch.sigmoid(self.dec2(F.relu(self.dec1(z))))

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparam(mu, logvar)
        return self.decode(z), mu, logvar

def elbo(recon, x, mu, logvar):
    bce = F.binary_cross_entropy(recon, x, reduction="sum")
    kld = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return bce + kld
`,
    estTime: '5-7 hours',
  },
];

export function getProject(slug) {
  return PG_FORGE_PROJECTS.find((p) => p.slug === slug) || null;
}
