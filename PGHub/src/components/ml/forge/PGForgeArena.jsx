import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, TrendingDown, Network, GitBranch, Grid3x3, Mail,
  Boxes, Target, Sparkles, BookOpen, Lightbulb, Code2, ListChecks,
} from 'lucide-react';
import Breadcrumb from '../../common/Breadcrumb';
import ForgeThumb from './ForgeThumb';
import './PGForgeArena.css';

const THUMB_KINDS = {
  linreg: 'descent',
  logreg: 'distribution',
  softmax: 'matrix',
  kmeans: 'scatter',
  knn: 'scatter',
  naivebayes: 'distribution',
  mlp: 'network',
  pca: 'vectors',
};

const CHALLENGES = [
  {
    id: 'linreg',
    icon: TrendingDown,
    title: 'Linear regression by gradient descent',
    difficulty: 'easy',
    objective: 'Fit a line y = wx + b to noisy points by stepping the two parameters down the mean-squared-error gradient until the loss stops dropping.',
    tags: ['gradient descent', 'MSE loss', 'numpy'],
    math: 'The loss is L = (1/n) Σ (ŷ − y)². Its gradient with respect to the weights is ∂L/∂w = (2/n) Σ (ŷ − y)·x and ∂L/∂b = (2/n) Σ (ŷ − y). Each step nudges w and b in the negative-gradient direction, scaled by a learning rate η, so the line slides toward the cloud of points.',
    io: {
      input: 'X of shape (n,), y of shape (n,), learning rate η, number of epochs.',
      output: 'Fitted scalars w and b such that wx + b minimises the MSE.',
    },
    hints: [
      'Initialise w = 0 and b = 0 — a flat line through the origin is a fine starting point.',
      'Compute predictions ŷ = w·X + b in one vectorised expression, then the residual ŷ − y.',
      'The two gradients are means of (residual·X) and (residual). Multiply by 2 to match the exact MSE derivative.',
      'Update with w -= η·grad_w and b -= η·grad_b every epoch. Keep η around 0.01–0.1.',
      'If the loss explodes to NaN, η is too large; halve it. If it crawls, the data may need centering.',
    ],
    approach: 'Vectorise the forward pass and both gradients with numpy, loop for the given epochs, and track the loss to confirm it decreases monotonically. Convergence to the closed-form least-squares solution is the correctness check.',
    starter: `import numpy as np

def fit_linear(X, y, lr=0.05, epochs=500):
    w, b = 0.0, 0.0
    n = len(X)
    for _ in range(epochs):
        y_hat = w * X + b
        resid = y_hat - y
        grad_w = (2 / n) * np.sum(resid * X)
        grad_b = (2 / n) * np.sum(resid)
        w -= lr * grad_w
        b -= lr * grad_b
        # TODO: optionally record loss = np.mean(resid ** 2)
    return w, b`,
    lesson: { to: '/ml/optimization/gradient-descent', label: 'Read the gradient-descent lesson' },
  },
  {
    id: 'logreg',
    icon: Target,
    title: 'Logistic regression + cross-entropy',
    difficulty: 'easy',
    objective: 'Train a linear model to output a probability with the sigmoid, then minimise binary cross-entropy so the decision boundary separates the two classes.',
    tags: ['sigmoid', 'cross-entropy', 'binary'],
    math: 'Predict p = σ(w·x + b) where σ(z) = 1/(1 + e^−z). The binary cross-entropy loss is −[y·log p + (1−y)·log(1−p)]. Remarkably, the gradient collapses to the same clean form as linear regression: ∂L/∂w = (1/n) Σ (p − y)·x. The sigmoid and the log cancel, leaving the prediction error times the input.',
    io: {
      input: 'X of shape (n, d), binary labels y ∈ {0,1}, learning rate, epochs.',
      output: 'Weight vector w and bias b defining the probability p = σ(w·x + b).',
    },
    hints: [
      'Implement a numerically stable sigmoid — clip the logits to roughly [−30, 30] before exp to avoid overflow.',
      'Predictions are p = σ(X·w + b), a length-n vector of probabilities.',
      'The gradient is the same shape as linear regression: (1/n)·Xᵀ·(p − y) for w, mean(p − y) for b.',
      'Add a tiny ε inside every log so log(0) never appears when a prediction saturates.',
      'Classify with p ≥ 0.5. If accuracy stalls at 50%, the classes may not be linearly separable.',
    ],
    approach: 'Reuse the gradient-descent skeleton from linear regression but swap the loss to BCE and the prediction to a sigmoid. Because the gradient simplifies to (p − y)·x, the inner loop is nearly identical — only the forward pass changes.',
    starter: `import numpy as np

def sigmoid(z):
    z = np.clip(z, -30, 30)
    return 1 / (1 + np.exp(-z))

def fit_logistic(X, y, lr=0.1, epochs=1000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(epochs):
        p = sigmoid(X @ w + b)
        grad_w = (X.T @ (p - y)) / n
        grad_b = np.mean(p - y)
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b`,
    lesson: { to: '/ml/foundations/cross-entropy', label: 'Read the cross-entropy lesson' },
  },
  {
    id: 'softmax',
    icon: Grid3x3,
    title: 'Softmax classifier',
    difficulty: 'medium',
    objective: 'Generalise logistic regression to K classes: map a row of logits to a probability distribution with softmax and train with categorical cross-entropy.',
    tags: ['softmax', 'multiclass', 'logits'],
    math: 'For logits z, softmax gives p_k = e^{z_k} / Σ_j e^{z_j}, a vector that sums to 1. With one-hot targets the cross-entropy gradient again telescopes: ∂L/∂z = p − y. Subtracting the row max before exponentiating (the log-sum-exp trick) keeps the exponentials finite without changing the result.',
    io: {
      input: 'X of shape (n, d), integer labels y ∈ {0…K−1}, K classes.',
      output: 'Weight matrix W of shape (d, K) and bias of shape (K,).',
    },
    hints: [
      'Subtract the per-row maximum from the logits before exp — softmax is shift-invariant, and this stops overflow.',
      'The probabilities are exp(shifted) divided by their per-row sum; each row must sum to 1.',
      'Convert integer labels to one-hot, or index the log-probabilities directly for the loss.',
      'The gradient on the logits is simply (P − Y_onehot); chain it back with Xᵀ to get the gradient on W.',
      'For 2 classes this must reduce to logistic regression — a good sanity check.',
    ],
    approach: 'Compute stable softmax probabilities, form the cross-entropy loss against one-hot targets, and backpropagate the (P − Y) error through the linear layer. The gradient structure mirrors logistic regression, scaled up to a matrix of weights.',
    starter: `import numpy as np

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    e = np.exp(Z)
    return e / e.sum(axis=1, keepdims=True)

def fit_softmax(X, y, K, lr=0.1, epochs=500):
    n, d = X.shape
    W, b = np.zeros((d, K)), np.zeros(K)
    Y = np.eye(K)[y]
    for _ in range(epochs):
        P = softmax(X @ W + b)
        grad_W = X.T @ (P - Y) / n
        grad_b = (P - Y).mean(axis=0)
        W -= lr * grad_W
        b -= lr * grad_b
    return W, b`,
  },
  {
    id: 'kmeans',
    icon: Network,
    title: 'K-means clustering',
    difficulty: 'medium',
    objective: 'Partition unlabelled points into K groups by alternating two steps — assign each point to its nearest centroid, then move each centroid to the mean of its members.',
    tags: ['unsupervised', 'centroids', 'lloyd'],
    math: 'K-means minimises the within-cluster sum of squares Σ_k Σ_{x∈C_k} ‖x − μ_k‖². Lloyd\'s algorithm does coordinate descent on this objective: the assignment step fixes centroids and picks the nearest one per point; the update step fixes assignments and sets each μ_k to its cluster mean. Both steps can only lower the objective, so it converges.',
    io: {
      input: 'X of shape (n, d), number of clusters K, max iterations.',
      output: 'Centroids of shape (K, d) and an assignment label per point.',
    },
    hints: [
      'Initialise centroids by sampling K distinct rows of X (k-means++ is better, but random is fine to start).',
      'For the assignment step, compute the distance from every point to every centroid and take the argmin.',
      'For the update step, each new centroid is the mean of the points currently assigned to it.',
      'Handle an empty cluster — reseed its centroid to a random point so you do not divide by zero.',
      'Stop when assignments stop changing or you hit the iteration cap. The result depends on the seed.',
    ],
    approach: 'Loop the two-step Lloyd update until labels stabilise. The distance matrix can be vectorised with broadcasting; the update is a grouped mean. Run from several seeds and keep the lowest-inertia solution to dodge poor local minima.',
    starter: `import numpy as np

def kmeans(X, K, iters=50):
    n = len(X)
    centroids = X[np.random.choice(n, K, replace=False)].copy()
    labels = np.zeros(n, dtype=int)
    for _ in range(iters):
        dists = ((X[:, None, :] - centroids[None]) ** 2).sum(-1)
        new_labels = dists.argmin(axis=1)
        if np.array_equal(new_labels, labels):
            break
        labels = new_labels
        for k in range(K):
            if np.any(labels == k):
                centroids[k] = X[labels == k].mean(axis=0)
    return centroids, labels`,
  },
  {
    id: 'knn',
    icon: Boxes,
    title: 'K-nearest neighbours',
    difficulty: 'easy',
    objective: 'Classify a query point by a majority vote of its K closest training points — no training step, all the work happens at prediction time.',
    tags: ['lazy learning', 'distance', 'voting'],
    math: 'K-NN is a non-parametric estimator: there is no model to fit. To label a query x, measure the Euclidean distance to every training point, take the K smallest, and return the most common label among them. K controls the bias-variance trade-off — small K hugs noise, large K over-smooths the boundary.',
    io: {
      input: 'Training X_train (n, d) and labels y_train, a query set X_q (m, d), and K.',
      output: 'A predicted label for each query point.',
    },
    hints: [
      'There is nothing to train — store the data and do all the work in predict.',
      'For each query, compute distances to all training points; argsort gives the nearest indices.',
      'Take the first K indices and gather their labels.',
      'Majority vote with a counter or np.bincount; break ties by the closest neighbour or the smallest label.',
      'Standardise features first — a column with a large scale will dominate the Euclidean distance.',
    ],
    approach: 'Build a distance matrix between queries and training points with broadcasting, argsort each row, slice the top K, and vote. The cost is O(n·d) per query, so KD-trees or approximate indexes matter once n grows — but the brute-force version is the right starting point.',
    starter: `import numpy as np

def knn_predict(X_train, y_train, X_q, k=3):
    preds = []
    for x in X_q:
        dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
        nearest = np.argsort(dists)[:k]
        votes = np.bincount(y_train[nearest])
        preds.append(votes.argmax())
    return np.array(preds)`,
  },
  {
    id: 'naivebayes',
    icon: Mail,
    title: 'Naive Bayes spam filter',
    difficulty: 'medium',
    objective: 'Score a message as spam or ham by combining per-word likelihoods under the naive assumption that words are independent given the class.',
    tags: ['probability', 'bag of words', 'log-likelihood'],
    math: 'By Bayes\' rule, P(class | words) ∝ P(class) · Π P(word | class). The naive assumption is that word occurrences are conditionally independent. Work in log space: log P(class) + Σ log P(word | class) turns the product into a sum, avoiding underflow. Laplace smoothing adds a pseudo-count so an unseen word never zeroes out a class.',
    io: {
      input: 'Tokenised training documents with spam/ham labels, plus a query document.',
      output: 'The class with the higher posterior log-score for the query.',
    },
    hints: [
      'Build a vocabulary and count, per class, how often each word appears plus the total word count.',
      'Estimate P(word | class) = (count + 1) / (total + |vocab|) — that +1 is Laplace smoothing.',
      'The class prior is the fraction of training documents in that class.',
      'Score in log space: start from log(prior), then add log P(word | class) for each token in the document.',
      'Pick the class with the larger total log-score. Words unseen in training fall back to the smoothed value.',
    ],
    approach: 'Tally word counts per class once at fit time, then scoring a document is a sum of log-likelihoods. Smoothing and log-space arithmetic are the two details that separate a working filter from one that returns zeros and NaNs.',
    starter: `import math
from collections import Counter, defaultdict

def train_nb(docs, labels):
    counts = defaultdict(Counter)
    totals = defaultdict(int)
    vocab = set()
    priors = Counter(labels)
    for tokens, c in zip(docs, labels):
        for w in tokens:
            counts[c][w] += 1
            totals[c] += 1
            vocab.add(w)
    return counts, totals, vocab, priors

def predict_nb(tokens, model, classes):
    counts, totals, vocab, priors = model
    V = len(vocab)
    n = sum(priors.values())
    best, best_score = None, -math.inf
    for c in classes:
        score = math.log(priors[c] / n)
        for w in tokens:
            score += math.log((counts[c][w] + 1) / (totals[c] + V))
        if score > best_score:
            best, best_score = c, score
    return best`,
    lesson: { to: '/ml/foundations/cross-entropy', label: 'Related: log-loss and probabilities' },
  },
  {
    id: 'mlp',
    icon: GitBranch,
    title: '2-layer MLP forward + backprop on XOR',
    difficulty: 'hard',
    objective: 'Train a hidden layer to learn XOR — the canonical function a single linear neuron cannot represent — by hand-coding the forward pass and backpropagation.',
    tags: ['MLP', 'backprop', 'non-linearity'],
    math: 'The network is h = σ(W₁x + b₁), ŷ = σ(W₂h + b₂). Backprop applies the chain rule layer by layer: the output error δ₂ = (ŷ − y)·σ\'(z₂) flows back through W₂ to give the hidden error δ₁ = (W₂ᵀδ₂)·σ\'(z₁). Each weight gradient is an outer product of the incoming activation and the outgoing delta. The hidden layer is what lets a curved boundary carve XOR apart.',
    io: {
      input: 'The four XOR rows X = [[0,0],[0,1],[1,0],[1,1]] with targets y = [0,1,1,0].',
      output: 'Trained weights that classify all four rows correctly.',
    },
    hints: [
      'Use a hidden layer of 2–4 units; XOR needs at least 2 to bend the boundary.',
      'Cache z₁, h, z₂ on the forward pass — backprop reuses every one of them.',
      'σ\'(z) = σ(z)·(1 − σ(z)); since h = σ(z₁) you can write the derivative as h·(1 − h).',
      'Output delta is (ŷ − y)·ŷ·(1 − ŷ). Hidden delta is (delta_out · W₂ᵀ)·h·(1 − h).',
      'Weight gradients are outer products: hᵀ·δ₂ for W₂, xᵀ·δ₁ for W₁. Train a few thousand epochs.',
    ],
    approach: 'Initialise small random weights, run the forward pass storing intermediates, then propagate the error backwards to assemble every gradient with the chain rule. Watch the loss fall and confirm all four rows flip to the correct side — the moment the hidden layer earns its place.',
    starter: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

X = np.array([[0,0],[0,1],[1,0],[1,1]], float)
y = np.array([[0],[1],[1],[0]], float)

def train_xor(lr=0.5, epochs=5000, hidden=4):
    rng = np.random.default_rng(0)
    W1, b1 = rng.normal(size=(2, hidden)), np.zeros((1, hidden))
    W2, b2 = rng.normal(size=(hidden, 1)), np.zeros((1, 1))
    for _ in range(epochs):
        h = sigmoid(X @ W1 + b1)
        out = sigmoid(h @ W2 + b2)
        d_out = (out - y) * out * (1 - out)
        d_h = (d_out @ W2.T) * h * (1 - h)
        W2 -= lr * h.T @ d_out
        b2 -= lr * d_out.sum(0, keepdims=True)
        W1 -= lr * X.T @ d_h
        b1 -= lr * d_h.sum(0, keepdims=True)
    return (W1, b1, W2, b2)`,
    lesson: { to: '/ml/foundations/backprop', label: 'Read the backpropagation lesson' },
  },
  {
    id: 'pca',
    icon: Sparkles,
    title: 'PCA via covariance eigenvectors',
    difficulty: 'hard',
    objective: 'Find the directions of maximum variance in a dataset by centering the data, building its covariance matrix, and taking the top eigenvectors.',
    tags: ['eigenvectors', 'covariance', 'dimensionality'],
    math: 'Center the data so each feature has zero mean. The covariance matrix C = (1/n)·XᵀX captures how features vary together. Its eigenvectors are orthogonal directions; the eigenvalue of each is the variance along it. Ranking eigenvectors by eigenvalue and keeping the top k gives the projection that preserves the most variance — exactly what PCA promises.',
    io: {
      input: 'X of shape (n, d) and the number of components k to keep.',
      output: 'The top-k principal directions and the data projected onto them.',
    },
    hints: [
      'Subtract the column means first — PCA on uncentered data finds the direction to the mean, not the variance.',
      'Covariance is XᵀX / (n − 1) once X is centered.',
      'Use np.linalg.eigh — the covariance matrix is symmetric, so eigh is faster and returns sorted real eigenvalues.',
      'eigh sorts ascending, so the largest variance directions are the last columns; reverse to get the top k.',
      'Project with X_centered @ components. Each eigenvalue tells you the variance explained by its direction.',
    ],
    approach: 'Center, form the covariance, eigendecompose with eigh, sort by eigenvalue, and keep the leading k vectors. The SVD of the centered matrix gives the same result more stably for tall data, but the covariance route makes the variance interpretation explicit.',
    starter: `import numpy as np

def pca(X, k):
    X_c = X - X.mean(axis=0)
    cov = (X_c.T @ X_c) / (len(X) - 1)
    eigvals, eigvecs = np.linalg.eigh(cov)
    order = np.argsort(eigvals)[::-1]
    components = eigvecs[:, order[:k]]
    projected = X_c @ components
    return components, projected, eigvals[order[:k]]`,
    lesson: { to: '/ml/foundations/pca', label: 'Read the PCA lesson' },
  },
];

export default function PGForgeArena() {
  const [selectedId, setSelectedId] = useState(CHALLENGES[0].id);
  const [openHints, setOpenHints] = useState({});

  const selected = useMemo(
    () => CHALLENGES.find((c) => c.id === selectedId) || CHALLENGES[0],
    [selectedId],
  );

  const toggleHint = (i) => setOpenHints((prev) => ({ ...prev, [i]: !prev[i] }));

  const SelIcon = selected.icon;

  return (
    <div className="forge-arena">
      <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: 'Arena' }]} />

      <header className="forge-arena-header">
        <h1 className="forge-arena-h1">Arena</h1>
        <p className="forge-arena-intro">
          Eight ML algorithms to implement from scratch — pick one for its objective, math, hints, and a starter stub.
        </p>
      </header>

      <div className="forge-arena-layout">
        <aside className="forge-arena-list">
          {CHALLENGES.map((c, i) => {
            const Icon = c.icon;
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedId(c.id); setOpenHints({}); }}
                className={`forge-arena-item ${active ? 'active' : ''}`}
              >
                <span className="forge-arena-item-thumb">
                  <ForgeThumb kind={THUMB_KINDS[c.id] || 'auto'} seed={c.title} index={i} label={c.tags[0]} />
                </span>
                <span className="forge-arena-item-body">
                  <span className="forge-arena-item-head">
                    <Icon size={15} className="forge-arena-item-icon" />
                    <span className="forge-arena-item-title">{c.title}</span>
                  </span>
                  <span className={`forge-arena-pill ${c.difficulty}`}>{c.difficulty}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="forge-arena-detail">
          <div className="forge-detail-head">
            <SelIcon size={26} className="forge-detail-icon" />
            <div>
              <h2 className="forge-detail-title">{selected.title}</h2>
              <div className="forge-detail-tags">
                <span className={`forge-arena-pill ${selected.difficulty}`}>{selected.difficulty}</span>
                {selected.tags.map((t) => (
                  <span key={t} className="forge-arena-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><Target size={13} /> Objective</div>
            <p className="forge-detail-text">{selected.objective}</p>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><Lightbulb size={13} /> Math &amp; intuition</div>
            <p className="forge-detail-text">{selected.math}</p>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><ListChecks size={13} /> Input / output</div>
            <p className="forge-detail-text">
              <span className="forge-detail-io-key">in</span> {selected.io.input}
            </p>
            <p className="forge-detail-text">
              <span className="forge-detail-io-key">out</span> {selected.io.output}
            </p>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><Lightbulb size={13} /> Hints</div>
            <div className="forge-hints">
              {selected.hints.map((h, i) => (
                <div key={i} className="forge-hint">
                  <button
                    type="button"
                    className="forge-hint-toggle"
                    onClick={() => toggleHint(i)}
                  >
                    {openHints[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="forge-hint-num">Hint {i + 1}</span>
                  </button>
                  {openHints[i] && <p className="forge-hint-text">{h}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><Code2 size={13} /> Starter (Python)</div>
            <pre className="forge-detail-code">{selected.starter}</pre>
          </div>

          <div className="forge-detail-block">
            <div className="forge-detail-label"><BookOpen size={13} /> Expected approach</div>
            <p className="forge-detail-text">{selected.approach}</p>
            {selected.lesson && (
              <Link to={selected.lesson.to} className="forge-detail-link">
                {selected.lesson.label} <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
