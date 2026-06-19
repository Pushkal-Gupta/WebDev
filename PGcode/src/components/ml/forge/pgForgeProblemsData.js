// ML coding-problem definitions for the PGForge in-browser IDE.
// Statements may carry KaTeX: \(inline\) and \[display\]. Tests are
// illustrative I/O for display — this is a learning IDE, not a graded judge.

export const PG_FORGE_PROBLEMS = [
  {
    slug: 'linear-regression-gd',
    title: 'Linear Regression by Gradient Descent',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Classical ML',
    statement: `Fit a line \\(\\hat{y} = w x + b\\) to one-dimensional data by minimizing the mean squared error

\\[ L(w, b) = \\frac{1}{n} \\sum_{i=1}^{n} (w x_i + b - y_i)^2 . \\]

Run full-batch gradient descent for a fixed number of steps. The gradients are

\\[ \\frac{\\partial L}{\\partial w} = \\frac{2}{n} \\sum_i x_i (\\hat{y}_i - y_i), \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{n} \\sum_i (\\hat{y}_i - y_i). \\]

Return the final \\((w, b)\\) rounded to two decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [3, 5, 7, 9]\nlr = 0.01, steps = 5000',
        output: '(2.00, 1.00)',
        explanation: 'The data lies exactly on y = 2x + 1, so GD recovers w=2, b=1.',
      },
      {
        input: 'xs = [0, 1, 2], ys = [1, 1, 1]\nlr = 0.05, steps = 2000',
        output: '(0.00, 1.00)',
        explanation: 'A constant target gives a flat line: slope 0, intercept 1.',
      },
    ],
    starterCode: {
      python: `def linear_regression_gd(xs, ys, lr=0.01, steps=5000):
    n = len(xs)
    w, b = 0.0, 0.0
    for _ in range(steps):
        # predictions and error
        preds = [w * x + b for x in xs]
        err = [p - y for p, y in zip(preds, ys)]
        # gradients
        dw = (2 / n) * sum(e * x for e, x in zip(err, xs))
        db = (2 / n) * sum(err)
        # update
        w -= lr * dw
        b -= lr * db
    return (round(w, 2), round(b, 2))


print(linear_regression_gd([1, 2, 3, 4], [3, 5, 7, 9]))
`,
    },
    hints: [
      'Predict, compute the error, then average the per-sample gradients before updating.',
      'A learning rate that is too large makes w and b oscillate and diverge — shrink it.',
      'Initialize w and b to 0.0 so the first gradients are well defined.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[3,5,7,9]', expected: '(2.0, 1.0)' },
      { input: 'xs=[0,1,2], ys=[1,1,1]', expected: '(0.0, 1.0)' },
      { input: 'xs=[1,2,3], ys=[2,4,6]', expected: '(2.0, 0.0)' },
    ],
  },

  {
    slug: 'logistic-regression',
    title: 'Logistic Regression Classifier',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Losses',
    statement: `Train a binary classifier with the sigmoid model

\\[ \\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad p_i = \\sigma(\\mathbf{w}^\\top \\mathbf{x}_i + b). \\]

Minimize the binary cross-entropy (log-loss)

\\[ L = -\\frac{1}{n} \\sum_i \\big[ y_i \\log p_i + (1 - y_i) \\log (1 - p_i) \\big]. \\]

The gradient w.r.t. each weight is \\(\\frac{1}{n} \\sum_i (p_i - y_i) x_{ij}\\). Run gradient descent, then predict class 1 when \\(p \\ge 0.5\\). Return the list of predicted labels.`,
    examples: [
      {
        input: 'X = [[0,0],[0,1],[1,0],[1,1]], y = [0,0,0,1] (AND)\nlr = 0.5, steps = 5000',
        output: '[0, 0, 0, 1]',
        explanation: 'The AND function is linearly separable; the boundary passes between (1,1) and the rest.',
      },
      {
        input: 'X = [[-2],[-1],[1],[2]], y = [0,0,1,1]\nlr = 0.3, steps = 3000',
        output: '[0, 0, 1, 1]',
        explanation: 'A 1-D threshold near 0 separates the two halves.',
      },
    ],
    starterCode: {
      python: `import math


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def logistic_regression(X, y, lr=0.5, steps=5000):
    n = len(X)
    d = len(X[0])
    w = [0.0] * d
    b = 0.0
    for _ in range(steps):
        gw = [0.0] * d
        gb = 0.0
        for xi, yi in zip(X, y):
            z = sum(w[j] * xi[j] for j in range(d)) + b
            p = sigmoid(z)
            diff = p - yi
            for j in range(d):
                gw[j] += diff * xi[j]
            gb += diff
        for j in range(d):
            w[j] -= lr * gw[j] / n
        b -= lr * gb / n
    preds = []
    for xi in X:
        z = sum(w[j] * xi[j] for j in range(d)) + b
        preds.append(1 if sigmoid(z) >= 0.5 else 0)
    return preds


print(logistic_regression([[0, 0], [0, 1], [1, 0], [1, 1]], [0, 0, 0, 1]))
`,
    },
    hints: [
      'The gradient of log-loss simplifies to (p - y) * x — no log term survives.',
      'Average gradients over all samples before each weight update.',
      'Logistic regression draws a straight boundary; it cannot solve XOR — pick separable data.',
    ],
    tests: [
      { input: 'AND: X=[[0,0],[0,1],[1,0],[1,1]], y=[0,0,0,1]', expected: '[0, 0, 0, 1]' },
      { input: 'OR: X=[[0,0],[0,1],[1,0],[1,1]], y=[0,1,1,1]', expected: '[0, 1, 1, 1]' },
      { input: '1-D: X=[[-2],[-1],[1],[2]], y=[0,0,1,1]', expected: '[0, 0, 1, 1]' },
    ],
  },

  {
    slug: 'softmax-classifier',
    title: 'Numerically Stable Softmax',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Convert a vector of logits \\(\\mathbf{z}\\) into a probability distribution with the softmax

\\[ \\mathrm{softmax}(\\mathbf{z})_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}} . \\]

Naively exponentiating large logits overflows, so subtract the max first — the result is identical because

\\[ \\frac{e^{z_i}}{\\sum_j e^{z_j}} = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}, \\qquad m = \\max_j z_j . \\]

Return the probabilities; they must be non-negative and sum to \\(1\\).`,
    examples: [
      {
        input: 'z = [1, 2, 3]',
        output: '[0.090, 0.245, 0.665]',
        explanation: 'Larger logits get exponentially more mass; the three values sum to 1.',
      },
      {
        input: 'z = [1000, 1000, 1000]',
        output: '[0.333, 0.333, 0.333]',
        explanation: 'Equal logits give a uniform distribution; the max-shift prevents overflow.',
      },
    ],
    starterCode: {
      python: `import math


def softmax(z):
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    total = sum(exps)
    return [e / total for e in exps]


print([round(p, 3) for p in softmax([1, 2, 3])])
print([round(p, 3) for p in softmax([1000, 1000, 1000])])
`,
    },
    hints: [
      'Subtract max(z) from every logit before calling exp — the ratio is unchanged.',
      'Without the shift, exp(1000) overflows to infinity and you get NaN.',
      'Verify the output sums to 1.0 as a sanity check.',
    ],
    tests: [
      { input: 'z=[1,2,3]', expected: '[0.09, 0.245, 0.665]' },
      { input: 'z=[0,0]', expected: '[0.5, 0.5]' },
      { input: 'z=[1000,1000,1000]', expected: '[0.333, 0.333, 0.333]' },
    ],
  },

  {
    slug: 'two-layer-mlp-xor',
    title: 'Two-Layer MLP Solves XOR',
    difficulty: 'hard',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `XOR is not linearly separable, so a single neuron fails. Build a network with one hidden layer:

\\[ \\mathbf{h} = \\tanh(W_1 \\mathbf{x} + \\mathbf{b}_1), \\qquad \\hat{y} = \\sigma(W_2 \\mathbf{h} + b_2). \\]

Train with backpropagation on the four XOR points until predictions match the targets. The output-layer error is \\((\\hat{y} - y)\\); propagate it back through \\(W_2\\) and the \\(\\tanh\\) derivative \\(1 - h^2\\). Return the four rounded predictions.`,
    examples: [
      {
        input: 'X = [[0,0],[0,1],[1,0],[1,1]], y = [0,1,1,0]\nhidden = 4, lr = 0.5, steps = 8000',
        output: '[0, 1, 1, 0]',
        explanation: 'The hidden layer bends the input space so the two classes become separable.',
      },
    ],
    starterCode: {
      python: `import math
import random


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def train_xor(X, y, hidden=4, lr=0.5, steps=8000, seed=1):
    random.seed(seed)
    d = len(X[0])
    W1 = [[random.uniform(-1, 1) for _ in range(d)] for _ in range(hidden)]
    b1 = [0.0] * hidden
    W2 = [random.uniform(-1, 1) for _ in range(hidden)]
    b2 = 0.0
    for _ in range(steps):
        for xi, yi in zip(X, y):
            # forward
            h = [math.tanh(sum(W1[k][j] * xi[j] for j in range(d)) + b1[k]) for k in range(hidden)]
            out = sigmoid(sum(W2[k] * h[k] for k in range(hidden)) + b2)
            # backward
            d_out = out - yi
            for k in range(hidden):
                d_h = d_out * W2[k] * (1 - h[k] ** 2)
                for j in range(d):
                    W1[k][j] -= lr * d_h * xi[j]
                b1[k] -= lr * d_h
                W2[k] -= lr * d_out * h[k]
            b2 -= lr * d_out
    preds = []
    for xi in X:
        h = [math.tanh(sum(W1[k][j] * xi[j] for j in range(d)) + b1[k]) for k in range(hidden)]
        out = sigmoid(sum(W2[k] * h[k] for k in range(hidden)) + b2)
        preds.append(1 if out >= 0.5 else 0)
    return preds


print(train_xor([[0, 0], [0, 1], [1, 0], [1, 1]], [0, 1, 1, 0]))
`,
    },
    hints: [
      'A linear model has no hidden layer and cannot represent XOR — the non-linearity is essential.',
      'The tanh derivative is 1 - h^2; reuse the already-computed hidden activations.',
      'Random weight init breaks symmetry; all-zero hidden weights never learn.',
    ],
    tests: [
      { input: 'XOR: X=[[0,0],[0,1],[1,0],[1,1]], y=[0,1,1,0]', expected: '[0, 1, 1, 0]' },
      { input: 'XNOR: y=[1,0,0,1]', expected: '[1, 0, 0, 1]' },
    ],
  },

  {
    slug: 'k-means',
    title: 'K-Means Clustering (Lloyd Iteration)',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Partition points into \\(k\\) clusters by alternating two steps until the assignments stop changing:

1. **Assign** — each point joins the cluster whose centroid is nearest in squared Euclidean distance \\(\\lVert \\mathbf{x} - \\boldsymbol{\\mu}_c \\rVert^2\\).
2. **Update** — recompute each centroid as the mean of its assigned points.

This monotonically decreases the inertia \\(\\sum_c \\sum_{x \\in C_c} \\lVert \\mathbf{x} - \\boldsymbol{\\mu}_c \\rVert^2\\). Return the cluster label of each point.`,
    examples: [
      {
        input: 'pts = [[0,0],[0,1],[10,10],[10,11]], k = 2\ninit = [[0,0],[10,10]]',
        output: '[0, 0, 1, 1]',
        explanation: 'Two well-separated blobs land in two clusters.',
      },
    ],
    starterCode: {
      python: `def kmeans(pts, k, init, max_iter=100):
    centroids = [list(c) for c in init]
    labels = [0] * len(pts)
    for _ in range(max_iter):
        # assign
        new_labels = []
        for p in pts:
            dists = [sum((p[j] - c[j]) ** 2 for j in range(len(p))) for c in centroids]
            new_labels.append(dists.index(min(dists)))
        if new_labels == labels:
            break
        labels = new_labels
        # update
        for ci in range(k):
            members = [pts[i] for i in range(len(pts)) if labels[i] == ci]
            if members:
                centroids[ci] = [sum(m[j] for m in members) / len(members)
                                 for j in range(len(members[0]))]
    return labels


print(kmeans([[0, 0], [0, 1], [10, 10], [10, 11]], 2, [[0, 0], [10, 10]]))
`,
    },
    hints: [
      'Compare squared distances — taking the square root never changes which centroid is closest.',
      'Stop when labels stop changing; that is the convergence criterion.',
      'Guard against empty clusters so you do not divide by zero when recomputing a centroid.',
    ],
    tests: [
      { input: 'pts=[[0,0],[0,1],[10,10],[10,11]], k=2', expected: '[0, 0, 1, 1]' },
      { input: 'pts=[[1],[2],[9],[10]], k=2, init=[[1],[9]]', expected: '[0, 0, 1, 1]' },
    ],
  },

  {
    slug: 'knn',
    title: 'K-Nearest Neighbours Classifier',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Classify a query point by majority vote of its \\(k\\) closest training points under Euclidean distance

\\[ d(\\mathbf{x}, \\mathbf{q}) = \\sqrt{ \\sum_j (x_j - q_j)^2 }. \\]

Sort the training set by distance to the query, take the first \\(k\\) labels, and return the most common one. KNN has no training phase — all the work happens at query time.`,
    examples: [
      {
        input: 'X = [[0],[1],[2],[8],[9]], y = [0,0,0,1,1]\nquery = [1.5], k = 3',
        output: '0',
        explanation: 'The three nearest points are at 1, 2, 0 — all labelled 0.',
      },
      {
        input: 'query = [8.5], k = 3',
        output: '1',
        explanation: 'Nearest neighbours 8, 9, 2 vote 1, 1, 0 → majority 1.',
      },
    ],
    starterCode: {
      python: `import math
from collections import Counter


def knn_predict(X, y, query, k=3):
    dists = []
    for xi, yi in zip(X, y):
        d = math.sqrt(sum((a - b) ** 2 for a, b in zip(xi, query)))
        dists.append((d, yi))
    dists.sort(key=lambda t: t[0])
    top = [label for _, label in dists[:k]]
    return Counter(top).most_common(1)[0][0]


print(knn_predict([[0], [1], [2], [8], [9]], [0, 0, 0, 1, 1], [1.5], 3))
print(knn_predict([[0], [1], [2], [8], [9]], [0, 0, 0, 1, 1], [8.5], 3))
`,
    },
    hints: [
      'Sort all training points by distance, then slice the first k.',
      'Use Counter.most_common to pick the majority label.',
      'Odd k avoids ties in a two-class problem.',
    ],
    tests: [
      { input: 'query=[1.5], k=3', expected: '0' },
      { input: 'query=[8.5], k=3', expected: '1' },
      { input: 'query=[5], k=1', expected: '0' },
    ],
  },

  {
    slug: 'naive-bayes',
    title: 'Gaussian Naive Bayes',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Classify with Bayes' rule under the naive assumption that features are conditionally independent given the class:

\\[ \\hat{y} = \\arg\\max_c \\; P(c) \\prod_j P(x_j \\mid c). \\]

Model each \\(P(x_j \\mid c)\\) as a Gaussian with the per-class, per-feature mean and variance

\\[ P(x_j \\mid c) = \\frac{1}{\\sqrt{2 \\pi \\sigma^2_{cj}}} \\exp\\!\\left( -\\frac{(x_j - \\mu_{cj})^2}{2 \\sigma^2_{cj}} \\right). \\]

Work in log-space to avoid underflow. Return the predicted class for the query.`,
    examples: [
      {
        input: 'X = [[1],[2],[8],[9]], y = [0,0,1,1]\nquery = [1.5]',
        output: '0',
        explanation: 'The query sits in the low-value Gaussian, so class 0 wins.',
      },
    ],
    starterCode: {
      python: `import math


def fit_gaussian_nb(X, y):
    classes = sorted(set(y))
    stats = {}
    for c in classes:
        members = [X[i] for i in range(len(X)) if y[i] == c]
        d = len(members[0])
        means = [sum(m[j] for m in members) / len(members) for j in range(d)]
        varis = [sum((m[j] - means[j]) ** 2 for m in members) / len(members) + 1e-9
                 for j in range(d)]
        stats[c] = (means, varis, len(members) / len(X))
    return stats


def predict_nb(stats, query):
    best, best_lp = None, -float('inf')
    for c, (means, varis, prior) in stats.items():
        lp = math.log(prior)
        for j in range(len(query)):
            lp += -0.5 * math.log(2 * math.pi * varis[j])
            lp += -((query[j] - means[j]) ** 2) / (2 * varis[j])
        if lp > best_lp:
            best, best_lp = c, lp
    return best


stats = fit_gaussian_nb([[1], [2], [8], [9]], [0, 0, 1, 1])
print(predict_nb(stats, [1.5]))
`,
    },
    hints: [
      'Sum log-probabilities instead of multiplying raw probabilities — products underflow fast.',
      'Add a tiny epsilon to each variance so a zero-variance feature does not divide by zero.',
      'The class prior P(c) is just the fraction of training rows in that class.',
    ],
    tests: [
      { input: 'query=[1.5]', expected: '0' },
      { input: 'query=[8.5]', expected: '1' },
    ],
  },

  {
    slug: 'pca-eigen',
    title: 'PCA via Covariance Eigendecomposition',
    difficulty: 'hard',
    topic: 'Foundations',
    category: 'Classical ML',
    statement: `Find the direction of maximum variance in 2-D data. Center the points, form the covariance matrix

\\[ \\Sigma = \\frac{1}{n} \\sum_i (\\mathbf{x}_i - \\bar{\\mathbf{x}})(\\mathbf{x}_i - \\bar{\\mathbf{x}})^\\top, \\]

and take the eigenvector with the largest eigenvalue as the first principal component. For a \\(2 \\times 2\\) symmetric \\(\\Sigma = \\begin{bmatrix} a & b \\\\ b & d \\end{bmatrix}\\), the eigenvalues are

\\[ \\lambda = \\frac{a + d}{2} \\pm \\sqrt{\\left(\\frac{a - d}{2}\\right)^2 + b^2}. \\]

Return the unit-length top principal component.`,
    examples: [
      {
        input: 'pts = [[-2,-2],[-1,-1],[1,1],[2,2]]',
        output: '[0.707, 0.707]',
        explanation: 'All variance lies along the 45-degree diagonal, so the PC1 is (1,1)/sqrt(2).',
      },
    ],
    starterCode: {
      python: `import math


def pca_first_component(pts):
    n = len(pts)
    mx = sum(p[0] for p in pts) / n
    my = sum(p[1] for p in pts) / n
    a = sum((p[0] - mx) ** 2 for p in pts) / n
    d = sum((p[1] - my) ** 2 for p in pts) / n
    b = sum((p[0] - mx) * (p[1] - my) for p in pts) / n
    # largest eigenvalue of [[a, b], [b, d]]
    lam = (a + d) / 2 + math.sqrt(((a - d) / 2) ** 2 + b ** 2)
    # eigenvector for lam: (b, lam - a) (handle b == 0)
    if abs(b) < 1e-12:
        vec = [1.0, 0.0] if a >= d else [0.0, 1.0]
    else:
        vec = [b, lam - a]
    norm = math.sqrt(vec[0] ** 2 + vec[1] ** 2)
    comp = [vec[0] / norm, vec[1] / norm]
    if comp[0] < 0:  # fix sign for a canonical direction
        comp = [-comp[0], -comp[1]]
    return [round(c, 3) for c in comp]


print(pca_first_component([[-2, -2], [-1, -1], [1, 1], [2, 2]]))
`,
    },
    hints: [
      'Center the data first — PCA describes variance about the mean, not the origin.',
      'The eigenvector of the larger eigenvalue is the direction the cloud is most stretched.',
      'Principal components have a sign ambiguity; normalize the sign so results are comparable.',
    ],
    tests: [
      { input: 'pts=[[-2,-2],[-1,-1],[1,1],[2,2]]', expected: '[0.707, 0.707]' },
      { input: 'pts=[[-3,0],[-1,0],[1,0],[3,0]]', expected: '[1.0, 0.0]' },
    ],
  },

  // ----------------------------- Optimizers -----------------------------

  {
    slug: 'sgd-momentum',
    title: 'SGD with Momentum',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Plain gradient descent crawls through narrow valleys. Momentum keeps a running velocity that accumulates consistent gradient directions and cancels oscillation:

\\[ v_t = \\beta \\, v_{t-1} + (1 - \\beta)\\, g_t, \\qquad \\theta_t = \\theta_{t-1} - \\eta \\, v_t. \\]

Minimize \\(f(x) = x^2\\) whose gradient is \\(g = 2x\\). Start at \\(x_0\\) and run the update for a fixed number of steps. Return the final \\(x\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x0 = 5.0, lr = 0.1, beta = 0.9, steps = 100',
        output: '0.0',
        explanation: 'The velocity damps as x approaches the minimum at 0.',
      },
    ],
    starterCode: {
      python: `def sgd_momentum(x0, lr=0.1, beta=0.9, steps=100):
    x = x0
    v = 0.0
    for _ in range(steps):
        g = 2 * x          # gradient of x**2
        v = beta * v + (1 - beta) * g
        x = x - lr * v
    return round(x, 4)


print(sgd_momentum(5.0))
`,
    },
    hints: [
      'Carry the velocity v across iterations — it is the whole point of momentum.',
      'beta near 0.9 averages roughly the last ten gradients.',
      'On f(x)=x^2 the gradient is 2x; the minimum is at x=0.',
    ],
    tests: [
      { input: 'x0=5.0, steps=100', expected: '0.0' },
      { input: 'x0=-3.0, steps=100', expected: '-0.0' },
    ],
  },

  {
    slug: 'adam-optimizer',
    title: 'Adam Optimizer Step',
    difficulty: 'medium',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Adam tracks a per-parameter first moment (mean) and second moment (uncentered variance) of the gradient, then bias-corrects both:

\\[ m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2, \\]
\\[ \\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}, \\quad \\theta_t = \\theta_{t-1} - \\eta \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}. \\]

Minimize \\(f(x) = x^2\\) (gradient \\(2x\\)) from \\(x_0\\). Return the final \\(x\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x0 = 5.0, lr = 0.1, steps = 200',
        output: '~0.0',
        explanation: 'Adam adapts the step per coordinate and converges to the minimum at 0.',
      },
    ],
    starterCode: {
      python: `import math


def adam(x0, lr=0.1, b1=0.9, b2=0.999, eps=1e-8, steps=200):
    x = x0
    m = 0.0
    v = 0.0
    for t in range(1, steps + 1):
        g = 2 * x                       # gradient of x**2
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        m_hat = m / (1 - b1 ** t)
        v_hat = v / (1 - b2 ** t)
        x = x - lr * m_hat / (math.sqrt(v_hat) + eps)
    return round(x, 4)


print(adam(5.0))
`,
    },
    hints: [
      'The step counter t starts at 1 so the bias-correction denominators are non-zero.',
      'Track m and v separately; one is the mean gradient, the other the mean squared gradient.',
      'The epsilon in the denominator only guards against division by zero — keep it tiny.',
    ],
    tests: [
      { input: 'x0=5.0, steps=200', expected: '0.0' },
      { input: 'x0=-2.0, steps=300', expected: '-0.0' },
    ],
  },

  {
    slug: 'rmsprop',
    title: 'RMSProp Optimizer',
    difficulty: 'medium',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `RMSProp keeps an exponentially decaying average of squared gradients and divides each step by its root, so steep directions get small steps and flat ones get large steps:

\\[ s_t = \\rho \\, s_{t-1} + (1 - \\rho)\\, g_t^2, \\qquad \\theta_t = \\theta_{t-1} - \\frac{\\eta}{\\sqrt{s_t} + \\epsilon}\\, g_t. \\]

Minimize \\(f(x) = x^2\\) (gradient \\(2x\\)) from \\(x_0\\). Return the final \\(x\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x0 = 4.0, lr = 0.1, rho = 0.9, steps = 300',
        output: '~0.0',
        explanation: 'The running squared-gradient average rescales the step so x settles at the minimum.',
      },
    ],
    starterCode: {
      python: `import math


def rmsprop(x0, lr=0.1, rho=0.9, eps=1e-8, steps=300):
    x = x0
    s = 0.0
    for _ in range(steps):
        g = 2 * x                       # gradient of x**2
        s = rho * s + (1 - rho) * g * g
        x = x - lr * g / (math.sqrt(s) + eps)
    return round(x, 4)


print(rmsprop(4.0))
`,
    },
    hints: [
      'RMSProp scales the step by the inverse root of recent squared gradients.',
      'rho controls how fast old squared-gradient history is forgotten.',
      'Unlike Adam there is no first-moment term and no bias correction.',
    ],
    tests: [
      { input: 'x0=4.0, steps=300', expected: '0.0' },
      { input: 'x0=-5.0, steps=400', expected: '-0.0' },
    ],
  },

  {
    slug: 'lr-warmup-cosine',
    title: 'Warmup + Cosine Learning-Rate Schedule',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Large models train best with a learning rate that ramps up linearly for the first \\(W\\) steps, then decays along a cosine curve to zero:

\\[ \\eta(t) = \\begin{cases} \\eta_{\\max} \\dfrac{t}{W}, & t < W \\\\[1.2em] \\dfrac{\\eta_{\\max}}{2}\\left(1 + \\cos\\!\\pi\\dfrac{t - W}{T - W}\\right), & t \\ge W \\end{cases} \\]

Given total steps \\(T\\), warmup \\(W\\), and peak rate \\(\\eta_{\\max}\\), return the learning rate at step \\(t\\) rounded to four decimals.`,
    examples: [
      {
        input: 't = 0, T = 100, W = 10, eta_max = 0.1',
        output: '0.0',
        explanation: 'At step 0 the linear warmup gives a rate of 0.',
      },
      {
        input: 't = 10, T = 100, W = 10, eta_max = 0.1',
        output: '0.1',
        explanation: 'Warmup ends exactly at the peak rate, before cosine decay begins.',
      },
    ],
    starterCode: {
      python: `import math


def lr_at(t, total, warmup, eta_max):
    if t < warmup:
        return round(eta_max * t / warmup, 4)
    progress = (t - warmup) / (total - warmup)
    cosine = 0.5 * (1 + math.cos(math.pi * progress))
    return round(eta_max * cosine, 4)


print(lr_at(0, 100, 10, 0.1))
print(lr_at(10, 100, 10, 0.1))
print(lr_at(100, 100, 10, 0.1))
`,
    },
    hints: [
      'During warmup the rate grows linearly from 0 to eta_max over W steps.',
      'After warmup, map progress 0..1 onto cos from 0 to pi so the rate ends at 0.',
      'At t = W the two branches meet at the peak rate.',
    ],
    tests: [
      { input: 't=0', expected: '0.0' },
      { input: 't=10', expected: '0.1' },
      { input: 't=100', expected: '0.0' },
    ],
  },

  // ----------------------------- Activations -----------------------------

  {
    slug: 'relu-family',
    title: 'ReLU, Leaky ReLU, and ELU',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Implement the three most common rectifier activations applied element-wise:

\\[ \\mathrm{ReLU}(x) = \\max(0, x), \\qquad \\mathrm{LeakyReLU}(x) = \\begin{cases} x & x > 0 \\\\ \\alpha x & x \\le 0 \\end{cases}, \\]
\\[ \\mathrm{ELU}(x) = \\begin{cases} x & x > 0 \\\\ \\alpha (e^x - 1) & x \\le 0 \\end{cases}. \\]

Leaky ReLU and ELU keep a small gradient for negative inputs, avoiding dead neurons. Apply the requested variant to a list and return the results rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [-2, 0, 3], kind = "relu"',
        output: '[0.0, 0.0, 3.0]',
        explanation: 'ReLU clamps every negative value to zero.',
      },
      {
        input: 'xs = [-2, 0, 3], kind = "leaky", alpha = 0.1',
        output: '[-0.2, 0.0, 3.0]',
        explanation: 'Leaky ReLU lets a 0.1 slope through for negatives.',
      },
    ],
    starterCode: {
      python: `import math


def activate(xs, kind="relu", alpha=0.1):
    out = []
    for x in xs:
        if kind == "relu":
            y = max(0.0, x)
        elif kind == "leaky":
            y = x if x > 0 else alpha * x
        elif kind == "elu":
            y = x if x > 0 else alpha * (math.exp(x) - 1)
        else:
            raise ValueError("unknown kind")
        out.append(round(y, 4))
    return out


print(activate([-2, 0, 3], "relu"))
print(activate([-2, 0, 3], "leaky", 0.1))
`,
    },
    hints: [
      'ReLU is just max(0, x) applied element-wise.',
      'Leaky ReLU multiplies negatives by a small alpha instead of zeroing them.',
      'ELU uses alpha*(exp(x)-1) for negatives so the output saturates smoothly.',
    ],
    tests: [
      { input: 'xs=[-2,0,3], relu', expected: '[0.0, 0.0, 3.0]' },
      { input: 'xs=[-2,0,3], leaky, 0.1', expected: '[-0.2, 0.0, 3.0]' },
    ],
  },

  {
    slug: 'sigmoid-tanh',
    title: 'Sigmoid and Tanh',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Squashing activations map any real number into a bounded range:

\\[ \\sigma(x) = \\frac{1}{1 + e^{-x}} \\in (0, 1), \\qquad \\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}} \\in (-1, 1). \\]

They are related by \\(\\tanh(x) = 2\\sigma(2x) - 1\\). To avoid overflow for large negative \\(x\\), branch the sigmoid on the sign. Apply the requested activation to a list and return values rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [0, 2, -2], kind = "sigmoid"',
        output: '[0.5, 0.8808, 0.1192]',
        explanation: 'Sigmoid is 0.5 at the origin and symmetric about it.',
      },
      {
        input: 'xs = [0, 1], kind = "tanh"',
        output: '[0.0, 0.7616]',
        explanation: 'Tanh is zero-centered, unlike sigmoid.',
      },
    ],
    starterCode: {
      python: `import math


def stable_sigmoid(x):
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)


def activate(xs, kind="sigmoid"):
    if kind == "sigmoid":
        return [round(stable_sigmoid(x), 4) for x in xs]
    if kind == "tanh":
        return [round(math.tanh(x), 4) for x in xs]
    raise ValueError("unknown kind")


print(activate([0, 2, -2], "sigmoid"))
print(activate([0, 1], "tanh"))
`,
    },
    hints: [
      'For large negative x, exp(-x) overflows — branch on the sign of x.',
      'Sigmoid outputs land in (0,1); tanh in (-1,1).',
      'tanh is just a rescaled, recentered sigmoid: 2*sigmoid(2x) - 1.',
    ],
    tests: [
      { input: 'xs=[0,2,-2], sigmoid', expected: '[0.5, 0.8808, 0.1192]' },
      { input: 'xs=[0,1], tanh', expected: '[0.0, 0.7616]' },
    ],
  },

  {
    slug: 'gelu',
    title: 'GELU Activation',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `The Gaussian Error Linear Unit weights an input by the probability that a standard normal stays below it:

\\[ \\mathrm{GELU}(x) = x \\, \\Phi(x) = \\frac{x}{2}\\left[1 + \\operatorname{erf}\\!\\left(\\frac{x}{\\sqrt{2}}\\right)\\right]. \\]

A common fast approximation uses tanh:

\\[ \\mathrm{GELU}(x) \\approx \\frac{x}{2}\\left[1 + \\tanh\\!\\left(\\sqrt{\\tfrac{2}{\\pi}}\\,(x + 0.044715\\,x^3)\\right)\\right]. \\]

Implement the exact form with \\(\\operatorname{erf}\\). Return values rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [0, 1, -1]',
        output: '[0.0, 0.8413, -0.1587]',
        explanation: 'GELU is smooth and, unlike ReLU, slightly negative for small negative inputs.',
      },
    ],
    starterCode: {
      python: `import math


def gelu(xs):
    out = []
    for x in xs:
        phi = 0.5 * (1 + math.erf(x / math.sqrt(2)))
        out.append(round(x * phi, 4))
    return out


print(gelu([0, 1, -1]))
`,
    },
    hints: [
      'math.erf gives the exact Gaussian CDF factor — no approximation needed.',
      'GELU(x) = x * Phi(x), where Phi is the standard-normal CDF.',
      'At x=0 the output is exactly 0; for large x it approaches the identity.',
    ],
    tests: [
      { input: 'xs=[0,1,-1]', expected: '[0.0, 0.8413, -0.1587]' },
      { input: 'xs=[2,-2]', expected: '[1.9545, -0.0455]' },
    ],
  },

  // ------------------------------- Losses -------------------------------

  {
    slug: 'mse-loss',
    title: 'Mean Squared Error and Its Gradient',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Losses',
    statement: `Mean squared error penalizes the average squared gap between predictions and targets:

\\[ L = \\frac{1}{n} \\sum_{i=1}^{n} (\\hat{y}_i - y_i)^2, \\qquad \\frac{\\partial L}{\\partial \\hat{y}_i} = \\frac{2}{n}(\\hat{y}_i - y_i). \\]

Return a tuple of the loss (rounded to four decimals) and the list of per-prediction gradients (each rounded to four decimals).`,
    examples: [
      {
        input: 'preds = [2, 3], targets = [1, 5]',
        output: '(2.5, [1.0, -2.0])',
        explanation: 'Errors 1 and -2 give squared errors 1 and 4; the mean is 2.5.',
      },
    ],
    starterCode: {
      python: `def mse(preds, targets):
    n = len(preds)
    loss = sum((p - t) ** 2 for p, t in zip(preds, targets)) / n
    grad = [round(2 * (p - t) / n, 4) for p, t in zip(preds, targets)]
    return (round(loss, 4), grad)


print(mse([2, 3], [1, 5]))
`,
    },
    hints: [
      'Square each residual, then average over all samples.',
      'The gradient per prediction is 2*(pred - target)/n.',
      'Loss is always non-negative and zero only when predictions match exactly.',
    ],
    tests: [
      { input: 'preds=[2,3], targets=[1,5]', expected: '(2.5, [1.0, -2.0])' },
      { input: 'preds=[1,1], targets=[1,1]', expected: '(0.0, [0.0, 0.0])' },
    ],
  },

  {
    slug: 'hinge-loss',
    title: 'Hinge Loss for Margin Classifiers',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Losses',
    statement: `Support vector machines optimize the hinge loss, which is zero once a point sits on the correct side of the margin and grows linearly otherwise. With labels \\(y \\in \\{-1, +1\\}\\) and raw scores \\(s\\):

\\[ L = \\frac{1}{n} \\sum_{i=1}^{n} \\max\\big(0,\\; 1 - y_i \\, s_i\\big). \\]

A correctly classified confident point (\\(y_i s_i \\ge 1\\)) contributes nothing. Return the mean hinge loss rounded to four decimals.`,
    examples: [
      {
        input: 'scores = [2.0, -0.5], labels = [1, -1]',
        output: '0.25',
        explanation: 'First point is past the margin (loss 0); second gives max(0, 1-0.5)=0.5; mean 0.25.',
      },
    ],
    starterCode: {
      python: `def hinge_loss(scores, labels):
    n = len(scores)
    total = sum(max(0.0, 1 - y * s) for s, y in zip(scores, labels))
    return round(total / n, 4)


print(hinge_loss([2.0, -0.5], [1, -1]))
`,
    },
    hints: [
      'Labels must be -1 or +1, not 0 or 1, for the margin term y*s to work.',
      'A margin of y*s >= 1 contributes exactly zero loss.',
      'Take the mean over all samples after the per-sample max.',
    ],
    tests: [
      { input: 'scores=[2.0,-0.5], labels=[1,-1]', expected: '0.25' },
      { input: 'scores=[1,1], labels=[1,1]', expected: '0.0' },
    ],
  },

  {
    slug: 'focal-loss',
    title: 'Focal Loss for Imbalanced Data',
    difficulty: 'hard',
    topic: 'Classical ML',
    category: 'Losses',
    statement: `Focal loss reshapes cross-entropy to down-weight easy examples so a rare positive class is not drowned out. With predicted probability \\(p\\) for the true class and focusing parameter \\(\\gamma\\):

\\[ L = -\\frac{1}{n}\\sum_i (1 - p_t^{(i)})^{\\gamma} \\, \\log p_t^{(i)}, \\qquad p_t = \\begin{cases} p & y = 1 \\\\ 1 - p & y = 0 \\end{cases}. \\]

When \\(\\gamma = 0\\) this reduces to ordinary cross-entropy. Clamp probabilities away from 0 and 1. Return the mean focal loss rounded to four decimals.`,
    examples: [
      {
        input: 'probs = [0.9, 0.2], labels = [1, 0], gamma = 2',
        output: '0.0013',
        explanation: 'Both points are easy (high p_t), so the modulating factor shrinks their loss sharply.',
      },
    ],
    starterCode: {
      python: `import math


def focal_loss(probs, labels, gamma=2.0, eps=1e-7):
    n = len(probs)
    total = 0.0
    for p, y in zip(probs, labels):
        p = min(max(p, eps), 1 - eps)
        pt = p if y == 1 else 1 - p
        total += -((1 - pt) ** gamma) * math.log(pt)
    return round(total / n, 4)


print(focal_loss([0.9, 0.2], [1, 0], gamma=2))
`,
    },
    hints: [
      'p_t is the probability assigned to the actual label, so flip p for the negative class.',
      'The (1 - p_t)^gamma factor is what shrinks the loss on confident, correct predictions.',
      'Clamp p into [eps, 1-eps] before taking the log to avoid log(0).',
    ],
    tests: [
      { input: 'probs=[0.9,0.2], labels=[1,0], gamma=2', expected: '0.0013' },
      { input: 'probs=[0.5,0.5], labels=[1,0], gamma=0', expected: '0.6931' },
    ],
  },

  // --------------------------- Normalization ----------------------------

  {
    slug: 'batch-norm',
    title: 'Batch Normalization (Forward)',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Normalization',
    statement: `Batch norm standardizes each feature across the batch, then rescales with learnable \\(\\gamma, \\beta\\):

\\[ \\mu = \\frac{1}{n}\\sum_i x_i, \\quad \\sigma^2 = \\frac{1}{n}\\sum_i (x_i - \\mu)^2, \\quad \\hat{x}_i = \\frac{x_i - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}, \\quad y_i = \\gamma \\hat{x}_i + \\beta. \\]

Given a batch of scalars and parameters \\(\\gamma, \\beta\\), return the normalized outputs rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], gamma = 1, beta = 0',
        output: '[-1.3416, -0.4472, 0.4472, 1.3416]',
        explanation: 'The batch is centered to mean 0 and unit variance, then left unscaled.',
      },
    ],
    starterCode: {
      python: `import math


def batch_norm(xs, gamma=1.0, beta=0.0, eps=1e-5):
    n = len(xs)
    mu = sum(xs) / n
    var = sum((x - mu) ** 2 for x in xs) / n
    denom = math.sqrt(var + eps)
    return [round(gamma * (x - mu) / denom + beta, 4) for x in xs]


print(batch_norm([1, 2, 3, 4]))
`,
    },
    hints: [
      'Statistics are computed across the batch dimension, one feature at a time.',
      'Divide by sqrt(var + eps), not just sqrt(var), to stay stable when variance is tiny.',
      'gamma and beta let the layer undo the normalization if that helps learning.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4]', expected: '[-1.3416, -0.4472, 0.4472, 1.3416]' },
      { input: 'xs=[5,5,5], gamma=2, beta=1', expected: '[1.0, 1.0, 1.0]' },
    ],
  },

  {
    slug: 'layer-norm',
    title: 'Layer Normalization (Forward)',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Normalization',
    statement: `Layer norm standardizes across the feature dimension of a single example — independent of batch size, which is why transformers prefer it:

\\[ \\mu = \\frac{1}{d}\\sum_j x_j, \\quad \\sigma^2 = \\frac{1}{d}\\sum_j (x_j - \\mu)^2, \\quad y_j = \\gamma \\frac{x_j - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} + \\beta. \\]

Given one feature vector and scalar \\(\\gamma, \\beta\\), return the normalized vector rounded to four decimals.`,
    examples: [
      {
        input: 'x = [2, 4, 6, 8], gamma = 1, beta = 0',
        output: '[-1.3416, -0.4472, 0.4472, 1.3416]',
        explanation: 'Each example is normalized over its own features, regardless of the rest of the batch.',
      },
    ],
    starterCode: {
      python: `import math


def layer_norm(x, gamma=1.0, beta=0.0, eps=1e-5):
    d = len(x)
    mu = sum(x) / d
    var = sum((v - mu) ** 2 for v in x) / d
    denom = math.sqrt(var + eps)
    return [round(gamma * (v - mu) / denom + beta, 4) for v in x]


print(layer_norm([2, 4, 6, 8]))
`,
    },
    hints: [
      'Unlike batch norm, layer norm averages over the feature axis of one sample.',
      'This makes it independent of batch size — ideal for sequence models.',
      'Add eps inside the square root for numerical stability.',
    ],
    tests: [
      { input: 'x=[2,4,6,8]', expected: '[-1.3416, -0.4472, 0.4472, 1.3416]' },
      { input: 'x=[1,1,1,1]', expected: '[0.0, 0.0, 0.0, 0.0]' },
    ],
  },

  // -------------------------- Attention / LLM ---------------------------

  {
    slug: 'scaled-dot-product-attention',
    title: 'Scaled Dot-Product Attention',
    difficulty: 'hard',
    topic: 'Neural networks',
    category: 'Attention/LLM',
    statement: `The core of the transformer compares each query to every key, scales by \\(\\sqrt{d_k}\\) to keep the dot products from saturating softmax, then mixes the values:

\\[ \\mathrm{Attention}(Q, K, V) = \\mathrm{softmax}\\!\\left(\\frac{Q K^\\top}{\\sqrt{d_k}}\\right) V. \\]

Implement it for one query against a set of key/value pairs. Return the output vector rounded to four decimals.`,
    examples: [
      {
        input: 'q = [1, 0], K = [[1,0],[0,1]], V = [[10,0],[0,10]]',
        output: '[6.7141, 3.2859]',
        explanation: 'The query aligns with the first key, so it attends mostly to the first value.',
      },
    ],
    starterCode: {
      python: `import math


def softmax(z):
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    s = sum(exps)
    return [e / s for e in exps]


def attention(q, K, V):
    dk = len(q)
    scale = math.sqrt(dk)
    scores = [sum(q[j] * k[j] for j in range(dk)) / scale for k in K]
    weights = softmax(scores)
    dv = len(V[0])
    out = [sum(weights[i] * V[i][j] for i in range(len(V))) for j in range(dv)]
    return [round(v, 4) for v in out]


print(attention([1, 0], [[1, 0], [0, 1]], [[10, 0], [0, 10]]))
`,
    },
    hints: [
      'Score each key with the dot product against the query, then divide by sqrt(d_k).',
      'Softmax the scores into attention weights that sum to 1.',
      'The output is the weighted sum of value vectors.',
    ],
    tests: [
      { input: 'q=[1,0], K=[[1,0],[0,1]], V=[[10,0],[0,10]]', expected: '[6.7141, 3.2859]' },
      { input: 'q=[0,0], K=[[1,0],[0,1]], V=[[2,0],[0,2]]', expected: '[1.0, 1.0]' },
    ],
  },

  {
    slug: 'multi-head-attention',
    title: 'Multi-Head Attention (Concatenation)',
    difficulty: 'hard',
    topic: 'Neural networks',
    category: 'Attention/LLM',
    statement: `Multi-head attention runs several attention operations in parallel on different slices of the representation, then concatenates the per-head outputs:

\\[ \\mathrm{MultiHead}(Q, K, V) = \\mathrm{Concat}(\\mathrm{head}_1, \\dots, \\mathrm{head}_h), \\quad \\mathrm{head}_i = \\mathrm{Attention}(Q_i, K_i, V_i). \\]

Split the query/key/value dimension into \\(h\\) equal chunks, run scaled dot-product attention per head, and concatenate. Return the combined output rounded to four decimals.`,
    examples: [
      {
        input: 'q = [1,0,0,1], K = [[1,0,0,1]], V = [[2,4,6,8]], heads = 2',
        output: '[2.0, 4.0, 6.0, 8.0]',
        explanation: 'A single key means each head attends fully to it, recovering the value.',
      },
    ],
    starterCode: {
      python: `import math


def softmax(z):
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    s = sum(exps)
    return [e / s for e in exps]


def head_attention(q, K, V):
    dk = len(q)
    scale = math.sqrt(dk)
    scores = [sum(q[j] * k[j] for j in range(dk)) / scale for k in K]
    w = softmax(scores)
    dv = len(V[0])
    return [sum(w[i] * V[i][j] for i in range(len(V))) for j in range(dv)]


def multi_head(q, K, V, heads=2):
    d = len(q)
    hs = d // heads
    out = []
    for h in range(heads):
        a, b = h * hs, (h + 1) * hs
        qh = q[a:b]
        Kh = [k[a:b] for k in K]
        Vh = [v[a:b] for v in V]
        out.extend(head_attention(qh, Kh, Vh))
    return [round(v, 4) for v in out]


print(multi_head([1, 0, 0, 1], [[1, 0, 0, 1]], [[2, 4, 6, 8]], heads=2))
`,
    },
    hints: [
      'Slice q, K and V into equal head-sized chunks along the feature axis.',
      'Run independent scaled dot-product attention on each chunk.',
      'Concatenate the per-head outputs back into one vector.',
    ],
    tests: [
      { input: 'single key, heads=2', expected: '[2.0, 4.0, 6.0, 8.0]' },
      { input: 'zero query, heads=2', expected: '[1.5, 1.5, 1.5, 1.5]' },
    ],
  },

  {
    slug: 'positional-encoding',
    title: 'Sinusoidal Positional Encoding',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Attention/LLM',
    statement: `Attention is permutation-invariant, so transformers inject order with fixed sinusoids of geometrically increasing wavelength:

\\[ PE_{(pos, 2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d}}\\right), \\qquad PE_{(pos, 2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d}}\\right). \\]

Even dimensions use sine, odd dimensions use cosine, and each pair shares a frequency. Return the encoding vector of length \\(d\\) for a given position, rounded to four decimals.`,
    examples: [
      {
        input: 'pos = 0, d = 4',
        output: '[0.0, 1.0, 0.0, 1.0]',
        explanation: 'At position 0 every sine is 0 and every cosine is 1.',
      },
    ],
    starterCode: {
      python: `import math


def positional_encoding(pos, d):
    pe = []
    for i in range(d):
        freq = 1.0 / (10000 ** ((2 * (i // 2)) / d))
        angle = pos * freq
        val = math.sin(angle) if i % 2 == 0 else math.cos(angle)
        pe.append(round(val, 4))
    return pe


print(positional_encoding(0, 4))
print(positional_encoding(1, 4))
`,
    },
    hints: [
      'Even index -> sine, odd index -> cosine, sharing a frequency within each pair.',
      'The frequency depends on i // 2 so dimensions 0 and 1 share one wavelength.',
      'At position 0 all sines vanish and all cosines equal 1.',
    ],
    tests: [
      { input: 'pos=0, d=4', expected: '[0.0, 1.0, 0.0, 1.0]' },
      { input: 'pos=1, d=2', expected: '[0.8415, 0.5403]' },
    ],
  },

  // --------------------------- Neural Networks --------------------------

  {
    slug: 'backprop-from-scratch',
    title: 'Backprop Through a Single Neuron',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Hand-derive the backward pass for one sigmoid neuron under squared error. Forward:

\\[ z = w x + b, \\quad a = \\sigma(z), \\quad L = (a - y)^2. \\]

By the chain rule:

\\[ \\frac{\\partial L}{\\partial w} = 2(a - y)\\,\\sigma'(z)\\,x, \\qquad \\frac{\\partial L}{\\partial b} = 2(a - y)\\,\\sigma'(z), \\qquad \\sigma'(z) = a(1 - a). \\]

Return the tuple \\((\\partial L/\\partial w, \\partial L/\\partial b)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x = 1, y = 0, w = 0, b = 0',
        output: '(0.125, 0.125)',
        explanation: 'At z=0, a=0.5, the sigmoid derivative is 0.25; dL/dw = 2*0.5*0.25*1 = 0.125.',
      },
    ],
    starterCode: {
      python: `import math


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def backprop_neuron(x, y, w, b):
    z = w * x + b
    a = sigmoid(z)
    dL_da = 2 * (a - y)
    da_dz = a * (1 - a)         # sigmoid derivative
    delta = dL_da * da_dz
    dw = delta * x
    db = delta
    return (round(dw, 4), round(db, 4))


print(backprop_neuron(1, 0, 0, 0))
`,
    },
    hints: [
      'The sigmoid derivative reuses the forward activation: a*(1-a).',
      'Chain three local gradients: dL/da, da/dz, then dz/dw = x.',
      'dL/db drops the x factor since dz/db = 1.',
    ],
    tests: [
      { input: 'x=1, y=0, w=0, b=0', expected: '(0.125, 0.125)' },
      { input: 'x=2, y=1, w=0, b=0', expected: '(-0.25, -0.125)' },
    ],
  },

  {
    slug: 'conv2d-forward',
    title: '2D Convolution (Valid, Single Channel)',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Slide a kernel over an input feature map, computing an element-wise product and sum at each valid position (no padding, stride 1):

\\[ O_{ij} = \\sum_{m}\\sum_{n} I_{i+m,\\, j+n}\\, K_{m,n}. \\]

For an \\(H \\times W\\) input and \\(k \\times k\\) kernel the output is \\((H-k+1) \\times (W-k+1)\\). Return the output feature map.`,
    examples: [
      {
        input: 'I = [[1,2,3],[4,5,6],[7,8,9]], K = [[1,0],[0,1]]',
        output: '[[6, 8], [12, 14]]',
        explanation: 'The kernel sums the main-diagonal pair at each 2x2 window.',
      },
    ],
    starterCode: {
      python: `def conv2d(I, K):
    H, W = len(I), len(I[0])
    k = len(K)
    out = []
    for i in range(H - k + 1):
        row = []
        for j in range(W - k + 1):
            acc = 0
            for m in range(k):
                for n in range(k):
                    acc += I[i + m][j + n] * K[m][n]
            row.append(acc)
        out.append(row)
    return out


print(conv2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[1, 0], [0, 1]]))
`,
    },
    hints: [
      'Valid convolution shrinks the map by k-1 in each dimension.',
      'At each window, multiply overlapping cells and sum them.',
      'This is cross-correlation; true convolution flips the kernel first.',
    ],
    tests: [
      { input: 'I=3x3, K=[[1,0],[0,1]]', expected: '[[6, 8], [12, 14]]' },
      { input: 'I=[[1,1],[1,1]], K=[[1,1],[1,1]]', expected: '[[4]]' },
    ],
  },

  {
    slug: 'dropout-inverted',
    title: 'Inverted Dropout',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Dropout randomly zeros activations during training to prevent co-adaptation. Inverted dropout scales the survivors by \\(1/(1-p)\\) so the expected activation is unchanged and inference needs no adjustment:

\\[ \\tilde{a}_i = \\begin{cases} \\dfrac{a_i}{1 - p} & \\text{kept} \\\\ 0 & \\text{dropped} \\end{cases} \\]

Given activations, a drop probability \\(p\\), and a boolean keep-mask, apply inverted dropout and return the result rounded to four decimals.`,
    examples: [
      {
        input: 'a = [1, 2, 3, 4], p = 0.5, mask = [1, 0, 1, 0]',
        output: '[2.0, 0.0, 6.0, 0.0]',
        explanation: 'Kept units are scaled by 1/(1-0.5)=2; dropped units become 0.',
      },
    ],
    starterCode: {
      python: `def inverted_dropout(a, p, mask):
    scale = 1.0 / (1.0 - p)
    return [round(v * scale, 4) if m else 0.0 for v, m in zip(a, mask)]


print(inverted_dropout([1, 2, 3, 4], 0.5, [1, 0, 1, 0]))
`,
    },
    hints: [
      'Scale survivors by 1/(1-p) so the expected layer output is preserved.',
      'Because scaling happens at train time, inference runs the network unchanged.',
      'A mask value of 0 means the unit is dropped to exactly zero.',
    ],
    tests: [
      { input: 'a=[1,2,3,4], p=0.5, mask=[1,0,1,0]', expected: '[2.0, 0.0, 6.0, 0.0]' },
      { input: 'a=[1,1], p=0.0, mask=[1,1]', expected: '[1.0, 1.0]' },
    ],
  },

  // ----------------------------- Classical ML ----------------------------

  {
    slug: 'decision-tree-gini',
    title: 'Best Split by Gini Impurity',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `A decision tree picks the threshold that most purifies its children. For a node with class proportions \\(p_c\\):

\\[ \\mathrm{Gini} = 1 - \\sum_c p_c^2. \\]

A split's quality is the weighted Gini of its two children. Try every midpoint between sorted feature values, compute the weighted child impurity, and return the threshold with the lowest value (rounded to four decimals) alongside that impurity.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [0, 0, 1, 1]',
        output: '(2.5, 0.0)',
        explanation: 'Splitting at 2.5 yields pure children, so weighted Gini is 0.',
      },
    ],
    starterCode: {
      python: `def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1
    return 1 - sum((c / n) ** 2 for c in counts.values())


def best_split(xs, ys):
    pairs = sorted(zip(xs, ys))
    sx = [p[0] for p in pairs]
    sy = [p[1] for p in pairs]
    n = len(sx)
    best_t, best_g = None, float('inf')
    for i in range(1, n):
        if sx[i] == sx[i - 1]:
            continue
        t = (sx[i] + sx[i - 1]) / 2
        left, right = sy[:i], sy[i:]
        g = (len(left) * gini(left) + len(right) * gini(right)) / n
        if g < best_g:
            best_t, best_g = t, g
    return (round(best_t, 4), round(best_g, 4))


print(best_split([1, 2, 3, 4], [0, 0, 1, 1]))
`,
    },
    hints: [
      'Sort by the feature value, then test midpoints between adjacent distinct values.',
      'Weight each child Gini by its share of the samples.',
      'A perfectly separating split drives the weighted impurity to 0.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[0,0,1,1]', expected: '(2.5, 0.0)' },
      { input: 'xs=[1,2,3,4], ys=[0,1,0,1]', expected: '(1.5, 0.4167)' },
    ],
  },

  // --------------------------- Data Processing ---------------------------

  {
    slug: 'train-test-split',
    title: 'Deterministic Train/Test Split',
    difficulty: 'easy',
    topic: 'Foundations',
    category: 'Data Processing',
    statement: `Hold out a fraction of the data for evaluation. Shuffle the indices with a fixed seed for reproducibility, then carve off the test fraction:

\\[ n_{\\text{test}} = \\lfloor \\text{test\\_size} \\cdot n \\rfloor, \\qquad n_{\\text{train}} = n - n_{\\text{test}}. \\]

Return a tuple \\((\\text{train\\_indices}, \\text{test\\_indices})\\) as lists. Use the same seed so the split is repeatable.`,
    examples: [
      {
        input: 'n = 5, test_size = 0.4, seed = 0',
        output: '([2, 0, 1], [4, 3])',
        explanation: 'Two of five rows go to test; the rest train. Order depends on the seeded shuffle.',
      },
    ],
    starterCode: {
      python: `import random


def train_test_split(n, test_size=0.4, seed=0):
    idx = list(range(n))
    random.seed(seed)
    random.shuffle(idx)
    n_test = int(test_size * n)
    test = idx[:n_test]
    train = idx[n_test:]
    return (train, test)


print(train_test_split(5, 0.4, 0))
`,
    },
    hints: [
      'Seed the RNG before shuffling so the split is reproducible.',
      'Use floor when converting the test fraction into a count.',
      'Train and test indices must be disjoint and cover every row.',
    ],
    tests: [
      { input: 'n=5, test_size=0.4, seed=0', expected: '([2, 0, 1], [4, 3])' },
      { input: 'n=4, test_size=0.5, seed=0', expected: '([1, 0], [2, 3])' },
    ],
  },

  {
    slug: 'min-max-scaling',
    title: 'Min-Max Feature Scaling',
    difficulty: 'easy',
    topic: 'Foundations',
    category: 'Data Processing',
    statement: `Rescale a feature into \\([0, 1]\\) so no single column dominates a distance- or gradient-based model:

\\[ x'_i = \\frac{x_i - \\min(x)}{\\max(x) - \\min(x)}. \\]

If every value is identical the range is zero — return all zeros instead of dividing by zero. Return the scaled list rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [10, 20, 30, 40]',
        output: '[0.0, 0.3333, 0.6667, 1.0]',
        explanation: 'The minimum maps to 0, the maximum to 1, the rest in between.',
      },
    ],
    starterCode: {
      python: `def min_max_scale(xs):
    lo, hi = min(xs), max(xs)
    rng = hi - lo
    if rng == 0:
        return [0.0 for _ in xs]
    return [round((x - lo) / rng, 4) for x in xs]


print(min_max_scale([10, 20, 30, 40]))
`,
    },
    hints: [
      'Subtract the min, then divide by the range (max - min).',
      'Guard the zero-range case so a constant column does not divide by zero.',
      'The smallest input always maps to 0 and the largest to 1.',
    ],
    tests: [
      { input: 'xs=[10,20,30,40]', expected: '[0.0, 0.3333, 0.6667, 1.0]' },
      { input: 'xs=[5,5,5]', expected: '[0.0, 0.0, 0.0]' },
    ],
  },

  {
    slug: 'one-hot-encode',
    title: 'One-Hot Encoding',
    difficulty: 'easy',
    topic: 'Foundations',
    category: 'Data Processing',
    statement: `Categorical labels have no ordinal meaning, so encode each as a binary indicator vector over the sorted set of categories. For category \\(c\\) out of \\(K\\) classes the encoding is a length-\\(K\\) vector with a single 1 at the index of \\(c\\):

\\[ \\text{onehot}(c)_k = \\begin{cases} 1 & k = \\text{index}(c) \\\\ 0 & \\text{otherwise} \\end{cases}. \\]

Build the vocabulary from the sorted unique values and return a list of encoded rows.`,
    examples: [
      {
        input: "labels = ['cat', 'dog', 'cat']",
        output: '[[1, 0], [0, 1], [1, 0]]',
        explanation: "Vocabulary ['cat','dog']; each label becomes a 2-dim indicator.",
      },
    ],
    starterCode: {
      python: `def one_hot(labels):
    vocab = sorted(set(labels))
    index = {c: i for i, c in enumerate(vocab)}
    K = len(vocab)
    out = []
    for c in labels:
        row = [0] * K
        row[index[c]] = 1
        out.append(row)
    return out


print(one_hot(['cat', 'dog', 'cat']))
`,
    },
    hints: [
      'Build a stable vocabulary by sorting the unique categories.',
      'Each row is all zeros except a single 1 at the category index.',
      'The encoding length equals the number of distinct categories.',
    ],
    tests: [
      { input: "labels=['cat','dog','cat']", expected: '[[1, 0], [0, 1], [1, 0]]' },
      { input: "labels=['a','b','c']", expected: '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]' },
    ],
  },

  {
    slug: 'standardize-zscore',
    title: 'Z-Score Standardization',
    difficulty: 'easy',
    topic: 'Foundations',
    category: 'Data Processing',
    statement: `Center a feature on zero and scale it to unit variance so gradient descent sees every column on the same footing:

\\[ z_i = \\frac{x_i - \\mu}{\\sigma}, \\qquad \\mu = \\frac{1}{n}\\sum_i x_i, \\qquad \\sigma = \\sqrt{\\frac{1}{n}\\sum_i (x_i - \\mu)^2}. \\]

A constant column has zero spread, so return all zeros rather than dividing by zero. Return the standardized list rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4]',
        output: '[-1.3416, -0.4472, 0.4472, 1.3416]',
        explanation: 'The mean 2.5 maps to 0; the spread sets the unit scale.',
      },
    ],
    starterCode: {
      python: `import math


def standardize(xs):
    n = len(xs)
    mu = sum(xs) / n
    var = sum((x - mu) ** 2 for x in xs) / n
    sd = math.sqrt(var)
    if sd == 0:
        return [0.0 for _ in xs]
    return [round((x - mu) / sd, 4) for x in xs]


print(standardize([1, 2, 3, 4]))
`,
    },
    hints: [
      'Subtract the mean, then divide by the standard deviation.',
      'Use the population standard deviation (divide variance by n, not n-1).',
      'Guard the zero-spread case so a constant column does not divide by zero.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4]', expected: '[-1.3416, -0.4472, 0.4472, 1.3416]' },
      { input: 'xs=[2,2,2]', expected: '[0.0, 0.0, 0.0]' },
    ],
  },

  {
    slug: 'sliding-window-batching',
    title: 'Sliding-Window Sequence Batching',
    difficulty: 'easy',
    topic: 'Foundations',
    category: 'Data Processing',
    statement: `Sequence models train on fixed-length context windows carved out of a long stream. Slide a window of size \\(w\\) across the sequence with a given stride, emitting one slice per step while a full window still fits:

\\[ \\text{windows} = \\big[\\, x_{i:i+w} \\;\\big|\\; i = 0,\\, s,\\, 2s,\\, \\dots,\\; i + w \\le n \\,\\big]. \\]

A stride equal to the window size gives non-overlapping batches. Return the list of windows.`,
    examples: [
      {
        input: 'seq = [1, 2, 3, 4, 5], window = 3, stride = 1',
        output: '[[1, 2, 3], [2, 3, 4], [3, 4, 5]]',
        explanation: 'Stride 1 overlaps neighbouring windows by two elements.',
      },
    ],
    starterCode: {
      python: `def sliding_windows(seq, window, stride=1):
    out = []
    i = 0
    while i + window <= len(seq):
        out.append(seq[i:i + window])
        i += stride
    return out


print(sliding_windows([1, 2, 3, 4, 5], 3, 1))
`,
    },
    hints: [
      'Stop advancing once a full window no longer fits inside the sequence.',
      'Stride controls overlap: a stride equal to the window gives disjoint batches.',
      'Slice with seq[i:i+window] rather than mutating the input list.',
    ],
    tests: [
      { input: 'seq=[1,2,3,4,5], window=3, stride=1', expected: '[[1, 2, 3], [2, 3, 4], [3, 4, 5]]' },
      { input: 'seq=[1,2,3,4], window=2, stride=2', expected: '[[1, 2], [3, 4]]' },
    ],
  },

  // ----------------------------- Optimizers (more) -----------------------------

  {
    slug: 'nesterov-momentum',
    title: 'Nesterov Accelerated Gradient',
    difficulty: 'medium',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Nesterov momentum evaluates the gradient at a look-ahead point — where the current velocity would carry the parameter — so it can correct course before overshooting:

\\[ v_t = \\beta\\, v_{t-1} + \\eta\\, \\nabla f(\\theta_{t-1} - \\beta\\, v_{t-1}), \\qquad \\theta_t = \\theta_{t-1} - v_t. \\]

Minimize \\(f(x) = x^2\\) (gradient \\(2x\\)) from \\(x_0\\). Return the final \\(x\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x0 = 5.0, lr = 0.1, beta = 0.9, steps = 100',
        output: '0.0',
        explanation: 'The look-ahead gradient damps the velocity smoothly into the minimum at 0.',
      },
    ],
    starterCode: {
      python: `def nesterov(x0, lr=0.1, beta=0.9, steps=100):
    x = x0
    v = 0.0
    for _ in range(steps):
        look_ahead = x - beta * v
        g = 2 * look_ahead          # gradient at the look-ahead point
        v = beta * v + lr * g
        x = x - v
    return round(x, 4)


print(nesterov(5.0))
`,
    },
    hints: [
      'Compute the gradient at x - beta*v, not at x itself — that is the look-ahead.',
      'The velocity folds in the learning rate, so the parameter update subtracts v directly.',
      'On f(x)=x^2 the gradient is 2x; the minimum is at 0.',
    ],
    tests: [
      { input: 'x0=5.0, steps=100', expected: '0.0' },
      { input: 'x0=-2.0, steps=100', expected: '0.0' },
    ],
  },

  {
    slug: 'adagrad',
    title: 'Adagrad Optimizer',
    difficulty: 'medium',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Adagrad gives each parameter its own learning rate by dividing the step by the square root of all squared gradients seen so far:

\\[ G_t = G_{t-1} + g_t^2, \\qquad \\theta_t = \\theta_{t-1} - \\frac{\\eta}{\\sqrt{G_t} + \\epsilon}\\, g_t. \\]

Because \\(G_t\\) only grows, the effective rate keeps shrinking — great for sparse features but prone to stalling late in training. Minimize \\(f(x) = x^2\\) (gradient \\(2x\\)) from \\(x_0\\). Return the final \\(x\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x0 = 5.0, lr = 0.5, steps = 2000',
        output: '0.0',
        explanation: 'The accumulated squared gradient steadily anneals the step toward zero.',
      },
    ],
    starterCode: {
      python: `import math


def adagrad(x0, lr=0.5, eps=1e-8, steps=2000):
    x = x0
    G = 0.0
    for _ in range(steps):
        g = 2 * x                   # gradient of x**2
        G += g * g
        x = x - lr * g / (math.sqrt(G) + eps)
    return round(x, 4)


print(adagrad(5.0))
`,
    },
    hints: [
      'Accumulate squared gradients in G and never reset it.',
      'The per-parameter rate is eta / (sqrt(G) + eps), which only ever shrinks.',
      'Because the step keeps decaying, Adagrad can stall — give it enough steps.',
    ],
    tests: [
      { input: 'x0=5.0, steps=2000', expected: '0.0' },
      { input: 'x0=-3.0, steps=2000', expected: '-0.0' },
    ],
  },

  {
    slug: 'gradient-clipping',
    title: 'Gradient Clipping by Global Norm',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Exploding gradients destabilize deep and recurrent nets. Clipping rescales the whole gradient vector when its L2 norm exceeds a threshold, preserving direction while bounding magnitude:

\\[ \\hat{g} = \\begin{cases} g & \\lVert g \\rVert \\le \\tau \\\\[0.4em] \\dfrac{\\tau}{\\lVert g \\rVert}\\, g & \\lVert g \\rVert > \\tau \\end{cases}, \\qquad \\lVert g \\rVert = \\sqrt{\\sum_i g_i^2}. \\]

Return the clipped gradient rounded to four decimals.`,
    examples: [
      {
        input: 'grads = [3, 4], max_norm = 10',
        output: '[3.0, 4.0]',
        explanation: 'The norm is 5, under the threshold, so the gradient passes through unchanged.',
      },
      {
        input: 'grads = [6, 8], max_norm = 5',
        output: '[3.0, 4.0]',
        explanation: 'The norm is 10; scaling by 5/10 halves every component.',
      },
    ],
    starterCode: {
      python: `import math


def clip_grad(grads, max_norm):
    norm = math.sqrt(sum(g * g for g in grads))
    if norm <= max_norm:
        return [round(float(g), 4) for g in grads]
    scale = max_norm / norm
    return [round(g * scale, 4) for g in grads]


print(clip_grad([3, 4], 10))
print(clip_grad([6, 8], 5))
`,
    },
    hints: [
      'Compute the global L2 norm across the whole gradient vector first.',
      'Only rescale when the norm exceeds the threshold; otherwise return it as-is.',
      'Scaling by tau / norm preserves the gradient direction.',
    ],
    tests: [
      { input: 'grads=[3,4], max_norm=10', expected: '[3.0, 4.0]' },
      { input: 'grads=[6,8], max_norm=5', expected: '[3.0, 4.0]' },
    ],
  },

  {
    slug: 'step-decay-schedule',
    title: 'Step-Decay Learning-Rate Schedule',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `A staircase schedule multiplies the learning rate by a factor every fixed number of epochs:

\\[ \\eta(t) = \\eta_0 \\cdot \\rho^{\\lfloor t / k \\rfloor}, \\]

where \\(\\rho\\) is the drop factor and \\(k\\) the step size in epochs. Within each plateau the rate is constant, then drops. Return the learning rate at epoch \\(t\\) rounded to six decimals.`,
    examples: [
      {
        input: 'eta0 = 0.1, drop = 0.5, every = 10, t = 0',
        output: '0.1',
        explanation: 'Before the first plateau ends, the rate equals the initial value.',
      },
      {
        input: 'eta0 = 0.1, drop = 0.5, every = 10, t = 25',
        output: '0.025',
        explanation: 'Two drops have fired (at 10 and 20), so 0.1 * 0.5^2 = 0.025.',
      },
    ],
    starterCode: {
      python: `def step_decay(eta0, drop, every, t):
    return round(eta0 * (drop ** (t // every)), 6)


print(step_decay(0.1, 0.5, 10, 0))
print(step_decay(0.1, 0.5, 10, 25))
`,
    },
    hints: [
      'Integer-divide the epoch by the step size to count how many drops have fired.',
      'The rate is constant on each plateau, then multiplied by the drop factor.',
      'At t=0 no drop has happened, so the rate is the initial one.',
    ],
    tests: [
      { input: 'eta0=0.1, drop=0.5, every=10, t=0', expected: '0.1' },
      { input: 'eta0=0.1, drop=0.5, every=10, t=10', expected: '0.05' },
      { input: 'eta0=0.1, drop=0.5, every=10, t=25', expected: '0.025' },
    ],
  },

  // --------------------------- Normalization (more) ---------------------------

  {
    slug: 'rms-norm',
    title: 'RMSNorm (Root Mean Square Normalization)',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Normalization',
    statement: `RMSNorm drops the mean-centering of layer norm and rescales a vector by its root-mean-square alone — cheaper, and the trick behind many modern LLMs:

\\[ y_i = \\frac{x_i}{\\sqrt{\\frac{1}{d}\\sum_j x_j^2 + \\epsilon}} \\cdot \\gamma. \\]

There is no subtraction of the mean and no \\(\\beta\\) shift. Given a feature vector and scale \\(\\gamma\\), return the normalized vector rounded to four decimals.`,
    examples: [
      {
        input: 'x = [1, 2, 3, 4], gamma = 1',
        output: '[0.3651, 0.7303, 1.0954, 1.4606]',
        explanation: 'Each entry is divided by the RMS of the vector (about 2.7386).',
      },
    ],
    starterCode: {
      python: `import math


def rms_norm(x, gamma=1.0, eps=1e-8):
    d = len(x)
    ms = sum(v * v for v in x) / d
    denom = math.sqrt(ms + eps)
    return [round(gamma * v / denom, 4) for v in x]


print(rms_norm([1, 2, 3, 4]))
`,
    },
    hints: [
      'Unlike layer norm, RMSNorm never subtracts the mean.',
      'Divide by the root mean square: sqrt(mean of squares + eps).',
      'There is a learnable scale gamma but no additive beta term.',
    ],
    tests: [
      { input: 'x=[1,2,3,4]', expected: '[0.3651, 0.7303, 1.0954, 1.4606]' },
      { input: 'x=[3,4]', expected: '[0.8485, 1.1314]' },
    ],
  },

  {
    slug: 'group-norm',
    title: 'Group Normalization (Forward)',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Normalization',
    statement: `Group norm splits the channels into \\(G\\) groups and normalizes within each group, sidestepping batch norm's dependence on batch size:

\\[ \\hat{x}_i = \\frac{x_i - \\mu_g}{\\sqrt{\\sigma_g^2 + \\epsilon}}, \\qquad y_i = \\gamma \\hat{x}_i + \\beta, \\]

where \\(\\mu_g, \\sigma_g^2\\) are the mean and variance over the channels in that group. Given a channel vector, the group count, and scalar \\(\\gamma, \\beta\\), return the normalized vector rounded to four decimals.`,
    examples: [
      {
        input: 'x = [1, 2, 3, 4], groups = 2, gamma = 1, beta = 0',
        output: '[-1.0, 1.0, -1.0, 1.0]',
        explanation: 'Channels split into [1,2] and [3,4]; each pair is normalized on its own.',
      },
    ],
    starterCode: {
      python: `import math


def group_norm(x, groups, gamma=1.0, beta=0.0, eps=1e-5):
    C = len(x)
    gs = C // groups
    out = [0.0] * C
    for g in range(groups):
        a, b = g * gs, (g + 1) * gs
        seg = x[a:b]
        mu = sum(seg) / len(seg)
        var = sum((v - mu) ** 2 for v in seg) / len(seg)
        denom = math.sqrt(var + eps)
        for i in range(a, b):
            out[i] = gamma * (x[i] - mu) / denom + beta
    return [round(v, 4) for v in out]


print(group_norm([1, 2, 3, 4], 2))
`,
    },
    hints: [
      'Partition the channels into G equal groups before computing any statistics.',
      'Each group has its own mean and variance — independent of the batch.',
      'With one group this reduces to layer norm; with one channel per group, to instance norm.',
    ],
    tests: [
      { input: 'x=[1,2,3,4], groups=2', expected: '[-1.0, 1.0, -1.0, 1.0]' },
      { input: 'x=[1,1,2,2], groups=2', expected: '[0.0, 0.0, 0.0, 0.0]' },
    ],
  },

  // ------------------------------- Attention -------------------------------

  {
    slug: 'attention-stable-softmax',
    title: 'Stable Softmax over a Score Row',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Attention',
    statement: `Attention turns a row of raw scores into weights with the softmax. Large scores overflow \\(e^{z}\\), so subtract the row max first — the weights are unchanged because

\\[ \\frac{e^{z_i}}{\\sum_j e^{z_j}} = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}, \\qquad m = \\max_j z_j. \\]

Return the attention weights rounded to four decimals; they are non-negative and sum to \\(1\\).`,
    examples: [
      {
        input: 'scores = [1, 2, 3]',
        output: '[0.09, 0.2447, 0.6652]',
        explanation: 'The largest score gets the most weight; the three weights sum to 1.',
      },
      {
        input: 'scores = [0, 0, 0, 0]',
        output: '[0.25, 0.25, 0.25, 0.25]',
        explanation: 'Equal scores give a uniform attention distribution.',
      },
    ],
    starterCode: {
      python: `import math


def stable_softmax(scores):
    m = max(scores)
    exps = [math.exp(s - m) for s in scores]
    total = sum(exps)
    return [round(e / total, 4) for e in exps]


print(stable_softmax([1, 2, 3]))
print(stable_softmax([0, 0, 0, 0]))
`,
    },
    hints: [
      'Subtract the row maximum before exponentiating — the weights are identical.',
      'Without the shift, a large score overflows exp and produces NaN.',
      'The resulting weights must sum to 1.0.',
    ],
    tests: [
      { input: 'scores=[1,2,3]', expected: '[0.09, 0.2447, 0.6652]' },
      { input: 'scores=[0,0,0,0]', expected: '[0.25, 0.25, 0.25, 0.25]' },
    ],
  },

  {
    slug: 'attention-weights',
    title: 'Attention Weights for One Query',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Attention',
    statement: `Before mixing values, attention produces a distribution over keys. Score the query against each key, scale by \\(\\sqrt{d_k}\\), and softmax:

\\[ \\alpha_j = \\mathrm{softmax}_j\\!\\left(\\frac{q \\cdot k_j}{\\sqrt{d_k}}\\right). \\]

Return only the attention weights (one per key), rounded to four decimals.`,
    examples: [
      {
        input: 'q = [1, 0], K = [[1, 0], [0, 1]]',
        output: '[0.6698, 0.3302]',
        explanation: 'The query aligns with the first key, so it receives the larger weight.',
      },
    ],
    starterCode: {
      python: `import math


def softmax(z):
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    s = sum(exps)
    return [e / s for e in exps]


def attention_weights(q, K):
    dk = len(q)
    scale = math.sqrt(dk)
    scores = [sum(q[t] * k[t] for t in range(dk)) / scale for k in K]
    return [round(w, 4) for w in softmax(scores)]


print(attention_weights([1, 0], [[1, 0], [0, 1]]))
`,
    },
    hints: [
      'Each score is the dot product of the query with a key, divided by sqrt(d_k).',
      'Softmax the scores into a distribution that sums to 1.',
      'The scaling keeps large dot products from saturating the softmax.',
    ],
    tests: [
      { input: 'q=[1,0], K=[[1,0],[0,1]]', expected: '[0.6698, 0.3302]' },
      { input: 'q=[1,1], K=[[1,1],[-1,-1]]', expected: '[0.9442, 0.0558]' },
    ],
  },

  {
    slug: 'causal-mask-attention',
    title: 'Causal (Masked) Self-Attention',
    difficulty: 'hard',
    topic: 'Neural networks',
    category: 'Attention',
    statement: `Autoregressive decoders must not peek at future tokens, so position \\(i\\) may only attend to positions \\(j \\le i\\). Set masked scores to \\(-\\infty\\) before the softmax so they receive zero weight:

\\[ s_{ij} = \\begin{cases} \\dfrac{q_i \\cdot k_j}{\\sqrt{d_k}} & j \\le i \\\\[0.6em] -\\infty & j > i \\end{cases}, \\qquad \\alpha_{i\\cdot} = \\mathrm{softmax}(s_{i\\cdot}). \\]

Apply causal self-attention to a sequence (one row per position) and return the output rows rounded to four decimals.`,
    examples: [
      {
        input: 'Q = K = [[1,0],[0,1]], V = [[1,1],[2,2]]',
        output: '[[1.0, 1.0], [1.6698, 1.6698]]',
        explanation: 'Position 0 sees only itself; position 1 attends to both, weighted toward position 1.',
      },
    ],
    starterCode: {
      python: `import math


def softmax(z):
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    s = sum(exps)
    return [e / s for e in exps]


def causal_attention(Q, K, V):
    n = len(Q)
    dk = len(Q[0])
    scale = math.sqrt(dk)
    out = []
    for i in range(n):
        scores = []
        for j in range(n):
            if j <= i:
                scores.append(sum(Q[i][t] * K[j][t] for t in range(dk)) / scale)
            else:
                scores.append(float('-inf'))
        w = softmax(scores)
        dv = len(V[0])
        out.append([round(sum(w[j] * V[j][t] for j in range(n)), 4) for t in range(dv)])
    return out


print(causal_attention([[1, 0], [0, 1]], [[1, 0], [0, 1]], [[1, 1], [2, 2]]))
`,
    },
    hints: [
      'For row i, score only keys j <= i; set the rest to negative infinity.',
      'A -inf score exponentiates to 0, so future positions get zero weight.',
      'The first row can only attend to itself, so it just returns the first value.',
    ],
    tests: [
      { input: 'Q=K=[[1,0],[0,1]], V=[[1,1],[2,2]]', expected: '[[1.0, 1.0], [1.6698, 1.6698]]' },
      { input: 'single token Q=K=[[1]], V=[[7]]', expected: '[[7.0]]' },
    ],
  },

  {
    slug: 'temperature-softmax',
    title: 'Temperature-Scaled Softmax',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Attention',
    statement: `Sampling temperature reshapes a softmax before drawing a token. Dividing logits by \\(T\\) sharpens (\\(T < 1\\)) or flattens (\\(T > 1\\)) the distribution:

\\[ p_i = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}. \\]

As \\(T \\to 0\\) the distribution collapses onto the arg-max; as \\(T \\to \\infty\\) it approaches uniform. Apply max-shifting for stability and return the probabilities rounded to four decimals.`,
    examples: [
      {
        input: 'z = [1, 2, 3], T = 2.0',
        output: '[0.1863, 0.3072, 0.5065]',
        explanation: 'A high temperature flattens the gap between logits.',
      },
      {
        input: 'z = [1, 2, 3], T = 0.5',
        output: '[0.0159, 0.1173, 0.8668]',
        explanation: 'A low temperature concentrates mass on the largest logit.',
      },
    ],
    starterCode: {
      python: `import math


def temperature_softmax(z, T=1.0):
    scaled = [v / T for v in z]
    m = max(scaled)
    exps = [math.exp(v - m) for v in scaled]
    total = sum(exps)
    return [round(e / total, 4) for e in exps]


print(temperature_softmax([1, 2, 3], 2.0))
print(temperature_softmax([1, 2, 3], 0.5))
`,
    },
    hints: [
      'Divide every logit by the temperature before the softmax.',
      'T below 1 sharpens the distribution; T above 1 flattens it.',
      'Still subtract the max after scaling to stay numerically stable.',
    ],
    tests: [
      { input: 'z=[1,2,3], T=2.0', expected: '[0.1863, 0.3072, 0.5065]' },
      { input: 'z=[1,2,3], T=0.5', expected: '[0.0159, 0.1173, 0.8668]' },
    ],
  },

  // --------------------------------- LLMs ---------------------------------

  {
    slug: 'bpe-merge-step',
    title: 'Byte-Pair Encoding Merge Step',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'LLMs',
    statement: `BPE builds a subword vocabulary by repeatedly fusing the most frequent adjacent token pair. Implement a single merge step: count every adjacent pair, pick the most frequent (break ties by earliest occurrence), and replace each occurrence of that pair with the concatenated token.

For example, with the most frequent pair \\((a, b)\\), the sequence \\([a, b, a, b, c]\\) becomes \\([ab, ab, c]\\). Return the token list after one merge.`,
    examples: [
      {
        input: "tokens = ['a', 'b', 'a', 'b', 'c']",
        output: "['ab', 'ab', 'c']",
        explanation: "The pair ('a','b') occurs twice, more than any other, so both are merged.",
      },
    ],
    starterCode: {
      python: `from collections import Counter


def bpe_merge_step(tokens):
    if len(tokens) < 2:
        return tokens
    pairs = Counter(zip(tokens, tokens[1:]))
    max_count = max(pairs.values())
    best = None
    for i in range(len(tokens) - 1):
        if pairs[(tokens[i], tokens[i + 1])] == max_count:
            best = (tokens[i], tokens[i + 1])
            break
    merged = best[0] + best[1]
    out = []
    i = 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
            out.append(merged)
            i += 2
        else:
            out.append(tokens[i])
            i += 1
    return out


print(bpe_merge_step(['a', 'b', 'a', 'b', 'c']))
`,
    },
    hints: [
      'Count adjacent pairs with a Counter over zip(tokens, tokens[1:]).',
      'Break frequency ties deterministically by choosing the earliest pair.',
      'Skip ahead by two positions after fusing a pair so you do not double-merge.',
    ],
    tests: [
      { input: "tokens=['a','b','a','b','c']", expected: "['ab', 'ab', 'c']" },
      { input: "tokens=['l','o','w','l','o','w']", expected: "['lo', 'w', 'lo', 'w']" },
    ],
  },

  {
    slug: 'greedy-decode',
    title: 'Greedy Decoding',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'LLMs',
    statement: `The simplest decoding strategy emits, at each step, the single highest-probability token:

\\[ \\hat{t}_s = \\arg\\max_v \\; \\text{logits}_{s, v}. \\]

Greedy decoding is deterministic and fast but can get stuck in repetitive or locally optimal text. Given a sequence of per-step logit rows, return the list of arg-max token indices.`,
    examples: [
      {
        input: 'logits = [[0.1, 0.9], [2.0, 1.0, 0.5]]',
        output: '[1, 0]',
        explanation: 'Step 0 picks index 1 (0.9); step 1 picks index 0 (2.0).',
      },
    ],
    starterCode: {
      python: `def greedy_decode(logits_seq):
    return [row.index(max(row)) for row in logits_seq]


print(greedy_decode([[0.1, 0.9], [2.0, 1.0, 0.5]]))
`,
    },
    hints: [
      'At each step take the index of the maximum logit.',
      'No softmax is needed — arg-max of logits equals arg-max of probabilities.',
      'Ties resolve to the first maximal index with list.index.',
    ],
    tests: [
      { input: 'logits=[[0.1,0.9],[2.0,1.0,0.5]]', expected: '[1, 0]' },
      { input: 'logits=[[1,3,2]]', expected: '[1]' },
    ],
  },

  {
    slug: 'top-k-sampling',
    title: 'Top-k Sampling Distribution',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'LLMs',
    statement: `Top-k sampling restricts generation to the \\(k\\) most likely tokens, zeroing the rest, then renormalizes with a softmax over the survivors:

\\[ p_i = \\begin{cases} \\dfrac{e^{z_i - m}}{\\sum_{j \\in \\text{top-}k} e^{z_j - m}} & i \\in \\text{top-}k \\\\[0.8em] 0 & \\text{otherwise} \\end{cases}, \\quad m = \\max_{j \\in \\text{top-}k} z_j. \\]

Return the resulting probability vector (zeros for filtered tokens) rounded to four decimals.`,
    examples: [
      {
        input: 'logits = [1, 2, 3, 4], k = 2',
        output: '[0.0, 0.0, 0.2689, 0.7311]',
        explanation: 'Only the top two logits (3 and 4) survive; the rest get probability 0.',
      },
    ],
    starterCode: {
      python: `import math


def top_k(logits, k):
    order = sorted(range(len(logits)), key=lambda i: logits[i], reverse=True)
    keep = set(order[:k])
    m = max(logits[i] for i in keep)
    exps = [math.exp(logits[i] - m) if i in keep else 0.0 for i in range(len(logits))]
    total = sum(exps)
    return [round(e / total, 4) for e in exps]


print(top_k([1, 2, 3, 4], 2))
`,
    },
    hints: [
      'Find the indices of the k largest logits and keep only those.',
      'Softmax over the survivors; filtered tokens get exactly probability 0.',
      'Subtract the max of the kept logits for numerical stability.',
    ],
    tests: [
      { input: 'logits=[1,2,3,4], k=2', expected: '[0.0, 0.0, 0.2689, 0.7311]' },
      { input: 'logits=[0,0,0,5], k=1', expected: '[0.0, 0.0, 0.0, 1.0]' },
    ],
  },

  {
    slug: 'kv-cache-update',
    title: 'KV-Cache Append',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'LLMs',
    statement: `During autoregressive generation, recomputing attention over the whole prefix each step is wasteful. The KV-cache stores the key and value vectors of every past token, so each new step only computes one new key/value and appends it:

\\[ K_{\\text{cache}} \\leftarrow [K_{\\text{cache}};\\, k_{\\text{new}}], \\qquad V_{\\text{cache}} \\leftarrow [V_{\\text{cache}};\\, v_{\\text{new}}]. \\]

Append the new key/value to the caches and return the updated \\((K, V)\\) tuple.`,
    examples: [
      {
        input: 'K = [[1, 0]], V = [[2, 2]], k_new = [0, 1], v_new = [3, 3]',
        output: '([[1, 0], [0, 1]], [[2, 2], [3, 3]])',
        explanation: 'The new key and value extend the cache by one row each.',
      },
    ],
    starterCode: {
      python: `def kv_cache_update(K_cache, V_cache, k_new, v_new):
    return (K_cache + [k_new], V_cache + [v_new])


print(kv_cache_update([[1, 0]], [[2, 2]], [0, 1], [3, 3]))
`,
    },
    hints: [
      'Each generation step contributes exactly one new key and one new value.',
      'Appending avoids recomputing keys/values for the entire prefix.',
      'Return new lists rather than mutating the caches in place.',
    ],
    tests: [
      { input: 'K=[[1,0]], V=[[2,2]], k_new=[0,1], v_new=[3,3]', expected: '([[1, 0], [0, 1]], [[2, 2], [3, 3]])' },
      { input: 'empty cache, k_new=[1], v_new=[9]', expected: '([[1]], [[9]])' },
    ],
  },

  // --------------------------- Classical ML (additions) ---------------------------

  {
    slug: 'linear-regression-normal-equation',
    title: 'Linear Regression via Normal Equation',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Instead of iterating, solve least squares in closed form. With design matrix \\(X\\) (rows are samples, a bias column of ones prepended) and targets \\(y\\), the optimal weights are

\\[ \\mathbf{w} = (X^\\top X)^{-1} X^\\top \\mathbf{y}. \\]

For one feature this reduces to the familiar slope/intercept formulas. Given parallel lists \\(xs\\) and \\(ys\\), return \\((\\text{slope}, \\text{intercept})\\) rounded to four decimals using the closed-form solution

\\[ w = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2}, \\qquad b = \\bar{y} - w\\,\\bar{x}. \\]`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [3, 5, 7, 9]',
        output: '(2.0, 1.0)',
        explanation: 'Exact fit y = 2x + 1.',
      },
    ],
    starterCode: {
      python: `def normal_equation(xs, ys):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs)
    w = num / den
    b = my - w * mx
    return (round(w, 4), round(b, 4))


print(normal_equation([1, 2, 3, 4], [3, 5, 7, 9]))
`,
    },
    hints: [
      'Center the data on its means before forming the covariance ratio.',
      'The slope is covariance over variance of x.',
      'The intercept passes the line through the point of means.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[3,5,7,9]', expected: '(2.0, 1.0)' },
      { input: 'xs=[0,1,2], ys=[1,3,5]', expected: '(2.0, 1.0)' },
      { input: 'xs=[1,2,3], ys=[1,1,1]', expected: '(0.0, 1.0)' },
    ],
  },

  {
    slug: 'ridge-regression-closed-form',
    title: 'Ridge Regression (1-D Closed Form)',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Ridge regression adds an \\(L_2\\) penalty \\(\\lambda \\lVert \\mathbf{w} \\rVert^2\\) that shrinks the slope toward zero (the bias is left unpenalized). For a single centered feature the closed-form slope becomes

\\[ w = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2 + \\lambda}, \\qquad b = \\bar{y} - w\\,\\bar{x}. \\]

Return \\((w, b)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [3, 5, 7, 9], lam = 0',
        output: '(2.0, 1.0)',
        explanation: 'With lambda 0 ridge equals ordinary least squares.',
      },
    ],
    starterCode: {
      python: `def ridge(xs, ys, lam):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs) + lam
    w = num / den
    b = my - w * mx
    return (round(w, 4), round(b, 4))


print(ridge([1, 2, 3, 4], [3, 5, 7, 9], 0))
`,
    },
    hints: [
      'Lambda enters only the denominator of the slope.',
      'Larger lambda shrinks the slope toward zero.',
      'The bias term is not regularized.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[3,5,7,9], lam=0', expected: '(2.0, 1.0)' },
      { input: 'xs=[1,2,3,4], ys=[3,5,7,9], lam=5', expected: '(1.0, 3.5)' },
    ],
  },

  {
    slug: 'soft-threshold-lasso',
    title: 'Soft-Thresholding (Lasso Proximal Step)',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `The lasso's \\(L_1\\) penalty is handled by the soft-thresholding operator, the proximal map of \\(\\lambda |w|\\):

\\[ S_\\lambda(w) = \\operatorname{sign}(w)\\,\\max(|w| - \\lambda,\\ 0). \\]

It pulls each coordinate toward zero by \\(\\lambda\\) and clamps small values to exactly zero — the mechanism behind lasso sparsity. Apply it elementwise to a vector and return the result rounded to four decimals.`,
    examples: [
      {
        input: 'w = [3.0, -0.5, 0.2], lam = 1.0',
        output: '[2.0, 0.0, 0.0]',
        explanation: 'Each value shrinks by 1; magnitudes below 1 hit zero.',
      },
    ],
    starterCode: {
      python: `def soft_threshold(w, lam):
    out = []
    for v in w:
        if v > lam:
            out.append(round(v - lam, 4))
        elif v < -lam:
            out.append(round(v + lam, 4))
        else:
            out.append(0.0)
    return out


print(soft_threshold([3.0, -0.5, 0.2], 1.0))
`,
    },
    hints: [
      'Shrink positives down and negatives up by lambda.',
      'Anything with magnitude below lambda collapses to zero.',
      'This zeroing is exactly what makes lasso select features.',
    ],
    tests: [
      { input: 'w=[3.0,-0.5,0.2], lam=1.0', expected: '[2.0, 0.0, 0.0]' },
      { input: 'w=[5.0,-4.0], lam=2.0', expected: '[3.0, -2.0]' },
      { input: 'w=[0.5,-0.5], lam=0.5', expected: '[0.0, 0.0]' },
    ],
  },

  {
    slug: 'knn-regression',
    title: 'k-Nearest-Neighbours Regression',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `kNN regression predicts the average target of the \\(k\\) closest training points. With Euclidean distance

\\[ d(\\mathbf{x}, \\mathbf{x}_i) = \\sqrt{\\textstyle\\sum_j (x_j - x_{ij})^2}, \\]

find the \\(k\\) nearest training rows to a query and return the mean of their targets, rounded to four decimals.`,
    examples: [
      {
        input: 'X = [[0],[1],[2],[3]], y = [0,2,4,6], q = [1.2], k = 2',
        output: '3.0',
        explanation: 'Nearest two points are x=1 and x=2 with targets 2 and 4; mean is 3.',
      },
    ],
    starterCode: {
      python: `import math


def knn_regress(X, y, q, k):
    dists = []
    for xi, yi in zip(X, y):
        d = math.sqrt(sum((a - b) ** 2 for a, b in zip(xi, q)))
        dists.append((d, yi))
    dists.sort(key=lambda t: t[0])
    top = [yi for _, yi in dists[:k]]
    return round(sum(top) / k, 4)


print(knn_regress([[0], [1], [2], [3]], [0, 2, 4, 6], [1.2], 2))
`,
    },
    hints: [
      'Compute every distance, then sort to find the k smallest.',
      'Average the targets of the chosen neighbours.',
      'Ties broken by sort order are fine for this exercise.',
    ],
    tests: [
      { input: 'X=[[0],[1],[2],[3]], y=[0,2,4,6], q=[1.2], k=2', expected: '3.0' },
      { input: 'X=[[0],[10]], y=[1,9], q=[0], k=1', expected: '1.0' },
    ],
  },

  // --------------------------- Neural Networks (additions) ---------------------------

  {
    slug: 'xavier-he-init-scale',
    title: 'Xavier and He Initialization Scale',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Weight initialization keeps activation variance stable across layers. Xavier (Glorot) targets

\\[ \\sigma^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}, \\]

while He initialization, tuned for ReLU, uses

\\[ \\sigma^2 = \\frac{2}{n_{\\text{in}}}. \\]

Given fan-in, fan-out, and a mode string \\(('xavier'\\) or \\('he')\\), return the standard deviation \\(\\sigma\\) rounded to four decimals.`,
    examples: [
      {
        input: 'fan_in = 2, fan_out = 2, mode = "xavier"',
        output: '0.7071',
        explanation: 'variance = 2/4 = 0.5, so sigma = sqrt(0.5).',
      },
    ],
    starterCode: {
      python: `import math


def init_scale(fan_in, fan_out, mode):
    if mode == 'xavier':
        var = 2.0 / (fan_in + fan_out)
    else:  # 'he'
        var = 2.0 / fan_in
    return round(math.sqrt(var), 4)


print(init_scale(2, 2, 'xavier'))
`,
    },
    hints: [
      'Xavier balances both fan-in and fan-out; He uses fan-in only.',
      'Return the standard deviation, the square root of the variance.',
      'He init is larger because ReLU zeros half the activations.',
    ],
    tests: [
      { input: 'fan_in=2, fan_out=2, mode="xavier"', expected: '0.7071' },
      { input: 'fan_in=2, fan_out=2, mode="he"', expected: '1.0' },
      { input: 'fan_in=8, fan_out=8, mode="he"', expected: '0.5' },
    ],
  },

  {
    slug: 'numerical-gradient-check',
    title: 'Numerical Gradient Check',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Backprop bugs are caught by comparing analytic gradients against a finite-difference estimate. For \\(f(x) = x^2\\) the central difference is

\\[ \\hat{g} = \\frac{f(x + h) - f(x - h)}{2h} \\approx f'(x). \\]

Return the central-difference estimate of the derivative of \\(x^2\\) at a point, rounded to four decimals.`,
    examples: [
      {
        input: 'x = 3.0, h = 1e-4',
        output: '6.0',
        explanation: 'The true derivative of x^2 at 3 is 6; the estimate matches.',
      },
    ],
    starterCode: {
      python: `def grad_check(x, h=1e-4):
    f = lambda t: t * t
    g = (f(x + h) - f(x - h)) / (2 * h)
    return round(g, 4)


print(grad_check(3.0))
`,
    },
    hints: [
      'Use the symmetric two-sided difference, not a one-sided one.',
      'A small h keeps the estimate close to the true slope.',
      'For x^2 the analytic gradient is 2x.',
    ],
    tests: [
      { input: 'x=3.0', expected: '6.0' },
      { input: 'x=0.0', expected: '0.0' },
      { input: 'x=-2.5', expected: '-5.0' },
    ],
  },

  {
    slug: 'label-smoothing-targets',
    title: 'Label Smoothing Targets',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Label smoothing softens one-hot targets so the model is less overconfident. With \\(K\\) classes and smoothing \\(\\epsilon\\), the target for the true class becomes \\(1 - \\epsilon\\) and every other class gets \\(\\epsilon/(K-1)\\):

\\[ \\tilde{y}_c = \\begin{cases} 1 - \\epsilon & c = \\text{true} \\\\ \\dfrac{\\epsilon}{K - 1} & \\text{otherwise.} \\end{cases} \\]

Given the number of classes, the true label, and \\(\\epsilon\\), return the smoothed target vector rounded to four decimals.`,
    examples: [
      {
        input: 'K = 4, label = 0, eps = 0.1',
        output: '[0.9, 0.0333, 0.0333, 0.0333]',
        explanation: 'True class gets 0.9; the rest split 0.1 over three classes.',
      },
    ],
    starterCode: {
      python: `def label_smooth(K, label, eps):
    other = eps / (K - 1)
    return [round(1 - eps, 4) if c == label else round(other, 4) for c in range(K)]


print(label_smooth(4, 0, 0.1))
`,
    },
    hints: [
      'The true class loses epsilon of its mass.',
      'That mass is spread evenly over the remaining K-1 classes.',
      'The vector still sums to one.',
    ],
    tests: [
      { input: 'K=4, label=0, eps=0.1', expected: '[0.9, 0.0333, 0.0333, 0.0333]' },
      { input: 'K=2, label=1, eps=0.2', expected: '[0.2, 0.8]' },
    ],
  },

  // --------------------------- Convolutions ---------------------------

  {
    slug: 'max-pool-1d',
    title: 'Max Pooling (1-D)',
    difficulty: 'easy',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `Max pooling downsamples a signal by taking the maximum within each non-overlapping window. With window size \\(k\\) and stride \\(k\\),

\\[ y_i = \\max(x_{ik}, x_{ik+1}, \\dots, x_{ik+k-1}). \\]

Apply 1-D max pooling and return the pooled list (drop any trailing partial window).`,
    examples: [
      {
        input: 'x = [1, 3, 2, 5, 4, 0], k = 2',
        output: '[3, 5, 4]',
        explanation: 'Windows (1,3),(2,5),(4,0) give maxima 3, 5, 4.',
      },
    ],
    starterCode: {
      python: `def max_pool_1d(x, k):
    out = []
    for i in range(0, len(x) - k + 1, k):
        out.append(max(x[i:i + k]))
    return out


print(max_pool_1d([1, 3, 2, 5, 4, 0], 2))
`,
    },
    hints: [
      'Step through the signal in strides of k.',
      'Each output is the max over one window.',
      'Skip a final window that does not fill k elements.',
    ],
    tests: [
      { input: 'x=[1,3,2,5,4,0], k=2', expected: '[3, 5, 4]' },
      { input: 'x=[7,1,2,8,3], k=2', expected: '[7, 8]' },
      { input: 'x=[2,2,2], k=3', expected: '[2]' },
    ],
  },

  {
    slug: 'im2col-1d',
    title: 'im2col for 1-D Convolution',
    difficulty: 'medium',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `Convolutions are often computed as a matrix multiply after unfolding the input into overlapping patches — the im2col trick. For a 1-D signal and kernel size \\(k\\) with stride 1, build the matrix whose row \\(i\\) is the window \\([x_i, \\dots, x_{i+k-1}]\\). The convolution output is then this matrix times the kernel.

Return the im2col matrix (a list of rows).`,
    examples: [
      {
        input: 'x = [1, 2, 3, 4], k = 2',
        output: '[[1, 2], [2, 3], [3, 4]]',
        explanation: 'Three length-2 windows slide across the signal.',
      },
    ],
    starterCode: {
      python: `def im2col_1d(x, k):
    return [x[i:i + k] for i in range(len(x) - k + 1)]


print(im2col_1d([1, 2, 3, 4], 2))
`,
    },
    hints: [
      'Each output position contributes one window row.',
      'There are len(x) - k + 1 windows at stride 1.',
      'Once unfolded, a convolution becomes a matrix-vector product.',
    ],
    tests: [
      { input: 'x=[1,2,3,4], k=2', expected: '[[1, 2], [2, 3], [3, 4]]' },
      { input: 'x=[5,6,7], k=3', expected: '[[5, 6, 7]]' },
    ],
  },

  {
    slug: 'dilated-conv-1d',
    title: 'Dilated 1-D Convolution',
    difficulty: 'medium',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `A dilated convolution spreads the kernel taps apart by a dilation factor \\(d\\), enlarging the receptive field without extra weights. With kernel \\(w\\) of length \\(k\\),

\\[ y_i = \\sum_{j=0}^{k-1} x_{i + j\\,d}\\, w_j, \\]

for every valid \\(i\\) (no padding). Return the output list.`,
    examples: [
      {
        input: 'x = [1, 2, 3, 4, 5], w = [1, 1], d = 2',
        output: '[4, 6, 8]',
        explanation: 'Taps are 2 apart: 1+3, 2+4, 3+5.',
      },
    ],
    starterCode: {
      python: `def dilated_conv_1d(x, w, d):
    k = len(w)
    span = (k - 1) * d
    out = []
    for i in range(len(x) - span):
        s = sum(x[i + j * d] * w[j] for j in range(k))
        out.append(s)
    return out


print(dilated_conv_1d([1, 2, 3, 4, 5], [1, 1], 2))
`,
    },
    hints: [
      'The kernel reaches across (k-1)*d + 1 input positions.',
      'Index into x with steps of d between taps.',
      'Stop when the dilated kernel runs past the signal.',
    ],
    tests: [
      { input: 'x=[1,2,3,4,5], w=[1,1], d=2', expected: '[4, 6, 8]' },
      { input: 'x=[1,2,3,4], w=[1,1], d=1', expected: '[3, 5, 7]' },
      { input: 'x=[2,0,2,0,2], w=[1,1,1], d=2', expected: '[6]' },
    ],
  },

  // --------------------------- Transformers ---------------------------

  {
    slug: 'sinusoidal-positional-encoding-value',
    title: 'Sinusoidal Positional Encoding Value',
    difficulty: 'medium',
    topic: 'Transformers',
    category: 'Transformers',
    statement: `The original Transformer injects order through fixed sinusoids. For position \\(pos\\) and dimension index \\(i\\) in a model of width \\(d\\),

\\[ PE(pos, 2i) = \\sin\\!\\left(\\frac{pos}{10000^{2i/d}}\\right), \\qquad PE(pos, 2i+1) = \\cos\\!\\left(\\frac{pos}{10000^{2i/d}}\\right). \\]

Given \\(pos\\), a dimension index, and \\(d\\), return the single encoding value rounded to four decimals.`,
    examples: [
      {
        input: 'pos = 0, dim = 0, d = 4',
        output: '0.0',
        explanation: 'Even dim uses sine; sin(0) = 0.',
      },
    ],
    starterCode: {
      python: `import math


def pe_value(pos, dim, d):
    i = dim // 2
    angle = pos / (10000 ** (2 * i / d))
    val = math.sin(angle) if dim % 2 == 0 else math.cos(angle)
    return round(val, 4)


print(pe_value(0, 0, 4))
`,
    },
    hints: [
      'Even dimensions use sine, odd use cosine, sharing the same frequency.',
      'The frequency index is dim // 2.',
      'At position 0 every sine is 0 and every cosine is 1.',
    ],
    tests: [
      { input: 'pos=0, dim=0, d=4', expected: '0.0' },
      { input: 'pos=0, dim=1, d=4', expected: '1.0' },
      { input: 'pos=1, dim=0, d=2', expected: '0.8415' },
    ],
  },

  {
    slug: 'rotary-embedding-2d',
    title: 'Rotary Position Embedding (2-D Rotation)',
    difficulty: 'medium',
    topic: 'Transformers',
    category: 'Transformers',
    statement: `RoPE encodes position by rotating each pair of query/key dimensions by an angle proportional to the token's position. For a 2-D pair \\((a, b)\\) at position \\(m\\) with frequency \\(\\theta\\), the rotated pair is

\\[ \\begin{pmatrix} a' \\\\ b' \\end{pmatrix} = \\begin{pmatrix} \\cos(m\\theta) & -\\sin(m\\theta) \\\\ \\sin(m\\theta) & \\cos(m\\theta) \\end{pmatrix} \\begin{pmatrix} a \\\\ b \\end{pmatrix}. \\]

Return \\((a', b')\\) rounded to four decimals.`,
    examples: [
      {
        input: 'a = 1, b = 0, m = 1, theta = 0',
        output: '(1.0, 0.0)',
        explanation: 'A zero angle leaves the pair unrotated.',
      },
    ],
    starterCode: {
      python: `import math


def rope_pair(a, b, m, theta):
    ang = m * theta
    c, s = math.cos(ang), math.sin(ang)
    ap = a * c - b * s
    bp = a * s + b * c
    return (round(ap, 4), round(bp, 4))


print(rope_pair(1, 0, 1, 0))
`,
    },
    hints: [
      'Position scales the rotation angle linearly.',
      'Apply a standard 2-D rotation matrix to the pair.',
      'A relative shift in position becomes a relative rotation between query and key.',
    ],
    tests: [
      { input: 'a=1, b=0, m=1, theta=0', expected: '(1.0, 0.0)' },
      { input: 'a=1, b=0, m=1, theta=1.5707963', expected: '(0.0, 1.0)' },
    ],
  },

  {
    slug: 'multi-query-attention-shapes',
    title: 'Multi-Query Attention Head Sharing',
    difficulty: 'easy',
    topic: 'Transformers',
    category: 'Transformers',
    statement: `Multi-query attention (MQA) keeps \\(H\\) separate query heads but shares a single key/value head, slashing the KV-cache memory. The cache size is proportional to the number of KV heads times head dimension.

Given the number of query heads \\(H\\), head dimension \\(d\\), and sequence length \\(L\\), return the tuple (number of KV heads, KV-cache element count) where the count is \\(2 \\cdot L \\cdot 1 \\cdot d\\) (keys and values for one shared head).`,
    examples: [
      {
        input: 'H = 8, d = 64, L = 10',
        output: '(1, 1280)',
        explanation: 'MQA uses one KV head; cache = 2 * 10 * 64 = 1280.',
      },
    ],
    starterCode: {
      python: `def mqa_cache(H, d, L):
    kv_heads = 1
    count = 2 * L * kv_heads * d
    return (kv_heads, count)


print(mqa_cache(8, 64, 10))
`,
    },
    hints: [
      'MQA always uses exactly one shared key/value head.',
      'The cache stores both keys and values, hence the factor of 2.',
      'Fewer KV heads is what makes MQA cheaper than full multi-head attention.',
    ],
    tests: [
      { input: 'H=8, d=64, L=10', expected: '(1, 1280)' },
      { input: 'H=4, d=16, L=5', expected: '(1, 160)' },
    ],
  },

  {
    slug: 'transformer-ffn-forward',
    title: 'Transformer Feed-Forward Block',
    difficulty: 'medium',
    topic: 'Transformers',
    category: 'Transformers',
    statement: `Each Transformer layer contains a position-wise feed-forward network applied to every token independently:

\\[ \\mathrm{FFN}(x) = \\max(0,\\ x W_1 + b_1)\\,W_2 + b_2. \\]

For a scalar input with scalar weights and biases this reduces to a ReLU sandwiched between two affine maps. Given \\(x, w_1, b_1, w_2, b_2\\), return the output rounded to four decimals.`,
    examples: [
      {
        input: 'x = 2, w1 = 1, b1 = -1, w2 = 2, b2 = 0',
        output: '2.0',
        explanation: 'Hidden = relu(2*1 - 1) = 1; output = 1*2 + 0 = 2.',
      },
    ],
    starterCode: {
      python: `def ffn(x, w1, b1, w2, b2):
    h = max(0.0, x * w1 + b1)
    return round(float(h * w2 + b2), 4)


print(ffn(2, 1, -1, 2, 0))
`,
    },
    hints: [
      'Apply the first affine map, then ReLU, then the second affine map.',
      'A negative pre-activation is clamped to zero by the ReLU.',
      'The same weights act on every token position.',
    ],
    tests: [
      { input: 'x=2, w1=1, b1=-1, w2=2, b2=0', expected: '2.0' },
      { input: 'x=-5, w1=1, b1=0, w2=3, b2=1', expected: '1.0' },
      { input: 'x=3, w1=2, b1=0, w2=1, b2=-2', expected: '4.0' },
    ],
  },

  // --------------------------- Diffusion ---------------------------

  {
    slug: 'ddpm-noise-schedule',
    title: 'DDPM Forward Noising Schedule',
    difficulty: 'medium',
    topic: 'Diffusion',
    category: 'Diffusion',
    statement: `Diffusion models gradually corrupt data with Gaussian noise. With per-step variances \\(\\beta_t\\), define \\(\\alpha_t = 1 - \\beta_t\\) and the cumulative product

\\[ \\bar{\\alpha}_t = \\prod_{s=1}^{t} \\alpha_s. \\]

A clean sample is then noised in one shot via \\(x_t = \\sqrt{\\bar{\\alpha}_t}\\,x_0 + \\sqrt{1 - \\bar{\\alpha}_t}\\,\\epsilon\\). Given the list of betas, return the list of \\(\\bar{\\alpha}_t\\) values rounded to four decimals.`,
    examples: [
      {
        input: 'betas = [0.1, 0.2, 0.5]',
        output: '[0.9, 0.72, 0.36]',
        explanation: 'alphas 0.9, 0.8, 0.5; cumulative products 0.9, 0.72, 0.36.',
      },
    ],
    starterCode: {
      python: `def alpha_bars(betas):
    out = []
    acc = 1.0
    for beta in betas:
        acc *= (1 - beta)
        out.append(round(acc, 4))
    return out


print(alpha_bars([0.1, 0.2, 0.5]))
`,
    },
    hints: [
      'Convert each beta to alpha = 1 - beta first.',
      'Accumulate the running product as you go.',
      'Alpha-bar decreases monotonically toward zero.',
    ],
    tests: [
      { input: 'betas=[0.1,0.2,0.5]', expected: '[0.9, 0.72, 0.36]' },
      { input: 'betas=[0.0,0.0]', expected: '[1.0, 1.0]' },
      { input: 'betas=[0.5]', expected: '[0.5]' },
    ],
  },

  {
    slug: 'ddpm-denoise-mean',
    title: 'DDPM Single Denoise Step Mean',
    difficulty: 'hard',
    topic: 'Diffusion',
    category: 'Diffusion',
    statement: `Given a noisy sample \\(x_t\\) and a predicted noise \\(\\epsilon_\\theta\\), the reverse process estimates the posterior mean

\\[ \\mu_\\theta = \\frac{1}{\\sqrt{\\alpha_t}}\\left( x_t - \\frac{\\beta_t}{\\sqrt{1 - \\bar{\\alpha}_t}}\\,\\epsilon_\\theta \\right), \\]

where \\(\\alpha_t = 1 - \\beta_t\\). Return \\(\\mu_\\theta\\) rounded to four decimals (work with scalars).`,
    examples: [
      {
        input: 'x_t = 1.0, eps = 0.0, beta = 0.19, alpha_bar = 0.75',
        output: '1.1111',
        explanation: 'With zero predicted noise mu = x_t / sqrt(alpha) = 1 / sqrt(0.81).',
      },
    ],
    starterCode: {
      python: `import math


def denoise_mean(x_t, eps, beta, alpha_bar):
    alpha = 1 - beta
    coef = beta / math.sqrt(1 - alpha_bar)
    mu = (x_t - coef * eps) / math.sqrt(alpha)
    return round(mu, 4)


print(denoise_mean(1.0, 0.0, 0.19, 0.75))
`,
    },
    hints: [
      'Alpha is one minus beta for the current step.',
      'Subtract the scaled noise prediction before rescaling.',
      'With zero predicted noise the step simply rescales x_t.',
    ],
    tests: [
      { input: 'x_t=1.0, eps=0.0, beta=0.19, alpha_bar=0.75', expected: '1.1111' },
      { input: 'x_t=0.0, eps=1.0, beta=0.75, alpha_bar=0.75', expected: '-3.0' },
    ],
  },

  {
    slug: 'classifier-free-guidance',
    title: 'Classifier-Free Guidance Mix',
    difficulty: 'easy',
    topic: 'Diffusion',
    category: 'Diffusion',
    statement: `Classifier-free guidance steers a diffusion sampler by extrapolating from the unconditional prediction toward the conditional one. With guidance scale \\(w\\),

\\[ \\hat{\\epsilon} = \\epsilon_{\\text{uncond}} + w\\,(\\epsilon_{\\text{cond}} - \\epsilon_{\\text{uncond}}). \\]

Given the two scalar noise predictions and the scale, return the guided prediction rounded to four decimals.`,
    examples: [
      {
        input: 'eps_uncond = 0.2, eps_cond = 0.6, w = 3.0',
        output: '1.4',
        explanation: '0.2 + 3*(0.6 - 0.2) = 0.2 + 1.2 = 1.4.',
      },
    ],
    starterCode: {
      python: `def cfg(eps_uncond, eps_cond, w):
    return round(eps_uncond + w * (eps_cond - eps_uncond), 4)


print(cfg(0.2, 0.6, 3.0))
`,
    },
    hints: [
      'The guided prediction is a linear extrapolation, not an interpolation.',
      'A scale of 0 returns the unconditional prediction.',
      'A scale of 1 returns the plain conditional prediction.',
    ],
    tests: [
      { input: 'eps_uncond=0.2, eps_cond=0.6, w=3.0', expected: '1.4' },
      { input: 'eps_uncond=0.5, eps_cond=0.5, w=7.5', expected: '0.5' },
      { input: 'eps_uncond=0.0, eps_cond=1.0, w=1.0', expected: '1.0' },
    ],
  },

  // --------------------------- Reinforcement Learning ---------------------------

  {
    slug: 'epsilon-greedy-action',
    title: 'Epsilon-Greedy Action Selection',
    difficulty: 'easy',
    topic: 'Reinforcement learning',
    category: 'Reinforcement Learning',
    statement: `Epsilon-greedy balances exploration and exploitation: with probability \\(\\epsilon\\) act randomly, otherwise take the greedy action \\(\\arg\\max_a Q(s, a)\\). To keep this testable, assume a fixed random draw is supplied. If \\(r < \\epsilon\\) return the given explore action; otherwise return the index of the maximum Q-value (ties broken by lowest index).`,
    examples: [
      {
        input: 'Q = [0.1, 0.9, 0.4], eps = 0.1, r = 0.5, explore = 0',
        output: '1',
        explanation: 'r >= eps so exploit: argmax Q is index 1.',
      },
    ],
    starterCode: {
      python: `def epsilon_greedy(Q, eps, r, explore):
    if r < eps:
        return explore
    best = 0
    for i in range(1, len(Q)):
        if Q[i] > Q[best]:
            best = i
    return best


print(epsilon_greedy([0.1, 0.9, 0.4], 0.1, 0.5, 0))
`,
    },
    hints: [
      'Compare the random draw against epsilon to decide explore vs exploit.',
      'Greedy means the index of the largest Q-value.',
      'Break ties by keeping the first maximum found.',
    ],
    tests: [
      { input: 'Q=[0.1,0.9,0.4], eps=0.1, r=0.5, explore=0', expected: '1' },
      { input: 'Q=[0.1,0.9,0.4], eps=0.9, r=0.2, explore=2', expected: '2' },
      { input: 'Q=[5,5,1], eps=0.0, r=0.5, explore=0', expected: '0' },
    ],
  },

  {
    slug: 'q-learning-update',
    title: 'Q-Learning Update',
    difficulty: 'medium',
    topic: 'Reinforcement learning',
    category: 'Reinforcement Learning',
    statement: `Tabular Q-learning bootstraps the value of a state-action pair toward the observed reward plus the best next value:

\\[ Q(s,a) \\leftarrow Q(s,a) + \\alpha\\big(r + \\gamma \\max_{a'} Q(s',a') - Q(s,a)\\big). \\]

Given the current \\(Q(s,a)\\), reward \\(r\\), discount \\(\\gamma\\), learning rate \\(\\alpha\\), and the list of next-state Q-values, return the updated value rounded to four decimals.`,
    examples: [
      {
        input: 'q = 0.0, r = 1.0, gamma = 0.9, alpha = 0.5, q_next = [0, 2]',
        output: '1.4',
        explanation: 'target = 1 + 0.9*2 = 2.8; new = 0 + 0.5*(2.8 - 0) = 1.4.',
      },
    ],
    starterCode: {
      python: `def q_update(q, r, gamma, alpha, q_next):
    target = r + gamma * max(q_next)
    return round(q + alpha * (target - q), 4)


print(q_update(0.0, 1.0, 0.9, 0.5, [0, 2]))
`,
    },
    hints: [
      'The TD target uses the maximum over next-state actions.',
      'The update nudges Q toward the target by alpha.',
      'A learning rate of 1 replaces Q with the target outright.',
    ],
    tests: [
      { input: 'q=0.0, r=1.0, gamma=0.9, alpha=0.5, q_next=[0,2]', expected: '1.4' },
      { input: 'q=5.0, r=0.0, gamma=0.0, alpha=1.0, q_next=[9]', expected: '0.0' },
    ],
  },

  {
    slug: 'discounted-return',
    title: 'Discounted Return',
    difficulty: 'easy',
    topic: 'Reinforcement learning',
    category: 'Reinforcement Learning',
    statement: `The return of a trajectory is the discounted sum of future rewards:

\\[ G = \\sum_{t=0}^{T-1} \\gamma^t r_t. \\]

Given a reward list and discount \\(\\gamma\\), return \\(G\\) rounded to four decimals.`,
    examples: [
      {
        input: 'rewards = [1, 1, 1], gamma = 0.5',
        output: '1.75',
        explanation: '1 + 0.5 + 0.25 = 1.75.',
      },
    ],
    starterCode: {
      python: `def discounted_return(rewards, gamma):
    g = 0.0
    for t, r in enumerate(rewards):
        g += (gamma ** t) * r
    return round(g, 4)


print(discounted_return([1, 1, 1], 0.5))
`,
    },
    hints: [
      'Reward at step t is weighted by gamma to the power t.',
      'A discount of 1 sums the rewards undiscounted.',
      'A discount of 0 keeps only the immediate reward.',
    ],
    tests: [
      { input: 'rewards=[1,1,1], gamma=0.5', expected: '1.75' },
      { input: 'rewards=[1,2,3], gamma=1.0', expected: '6.0' },
      { input: 'rewards=[10,5], gamma=0.0', expected: '10.0' },
    ],
  },

  {
    slug: 'gae-advantage',
    title: 'Generalized Advantage Estimation',
    difficulty: 'hard',
    topic: 'Reinforcement learning',
    category: 'Reinforcement Learning',
    statement: `GAE smooths advantage estimates by exponentially weighting TD residuals \\(\\delta_t = r_t + \\gamma V_{t+1} - V_t\\):

\\[ \\hat{A}_t = \\sum_{l=0}^{T-1-t} (\\gamma\\lambda)^l\\,\\delta_{t+l}. \\]

Given per-step rewards, a value list of length \\(T+1\\) (bootstrapped final value), \\(\\gamma\\), and \\(\\lambda\\), return the advantage of the first step \\(\\hat{A}_0\\) rounded to four decimals.`,
    examples: [
      {
        input: 'rewards = [1, 1], values = [0, 0, 0], gamma = 1.0, lam = 1.0',
        output: '2.0',
        explanation: 'Both deltas are 1; with gamma*lambda = 1 they sum to 2.',
      },
    ],
    starterCode: {
      python: `def gae_first(rewards, values, gamma, lam):
    T = len(rewards)
    deltas = [rewards[t] + gamma * values[t + 1] - values[t] for t in range(T)]
    adv = 0.0
    coef = 1.0
    for l in range(T):
        adv += coef * deltas[l]
        coef *= gamma * lam
    return round(adv, 4)


print(gae_first([1, 1], [0, 0, 0], 1.0, 1.0))
`,
    },
    hints: [
      'First compute the TD residual at every step.',
      'Weight residual at offset l by (gamma*lambda)^l.',
      'Lambda of 0 reduces GAE to the one-step TD residual.',
    ],
    tests: [
      { input: 'rewards=[1,1], values=[0,0,0], gamma=1.0, lam=1.0', expected: '2.0' },
      { input: 'rewards=[1,1], values=[0,0,0], gamma=1.0, lam=0.0', expected: '1.0' },
    ],
  },

  // --------------------------- Embeddings ---------------------------

  {
    slug: 'cosine-similarity-topk',
    title: 'Cosine Similarity Top-k',
    difficulty: 'medium',
    topic: 'Embeddings',
    category: 'Embeddings',
    statement: `Semantic search ranks candidates by cosine similarity to a query vector:

\\[ \\cos(\\mathbf{q}, \\mathbf{v}) = \\frac{\\mathbf{q} \\cdot \\mathbf{v}}{\\lVert \\mathbf{q} \\rVert\\,\\lVert \\mathbf{v} \\rVert}. \\]

Given a query, a list of candidate vectors, and \\(k\\), return the indices of the top-\\(k\\) most similar candidates (highest first, ties broken by lowest index).`,
    examples: [
      {
        input: 'q = [1, 0], V = [[1, 0], [0, 1], [1, 1]], k = 2',
        output: '[0, 2]',
        explanation: 'Identical direction scores 1; the diagonal scores ~0.707; orthogonal scores 0.',
      },
    ],
    starterCode: {
      python: `import math


def cosine_topk(q, V, k):
    def cos(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        return dot / (na * nb)
    scored = [(cos(q, v), i) for i, v in enumerate(V)]
    scored.sort(key=lambda t: (-t[0], t[1]))
    return [i for _, i in scored[:k]]


print(cosine_topk([1, 0], [[1, 0], [0, 1], [1, 1]], 2))
`,
    },
    hints: [
      'Normalize by both vector norms before comparing.',
      'Sort by descending similarity, breaking ties by index.',
      'Return only the indices, not the scores.',
    ],
    tests: [
      { input: 'q=[1,0], V=[[1,0],[0,1],[1,1]], k=2', expected: '[0, 2]' },
      { input: 'q=[0,1], V=[[1,0],[0,2]], k=1', expected: '[1]' },
    ],
  },

  {
    slug: 'mean-pooling-embeddings',
    title: 'Mean Pooling Token Embeddings',
    difficulty: 'easy',
    topic: 'Embeddings',
    category: 'Embeddings',
    statement: `Sentence embeddings are often produced by averaging token embeddings, optionally respecting an attention mask so padding tokens do not contribute:

\\[ \\mathbf{e} = \\frac{\\sum_t m_t\\,\\mathbf{h}_t}{\\sum_t m_t}. \\]

Given a list of token vectors and a 0/1 mask, return the masked mean-pooled vector rounded to four decimals.`,
    examples: [
      {
        input: 'H = [[1, 2], [3, 4], [9, 9]], mask = [1, 1, 0]',
        output: '[2.0, 3.0]',
        explanation: 'The third token is masked out; average of the first two.',
      },
    ],
    starterCode: {
      python: `def mean_pool(H, mask):
    d = len(H[0])
    total = [0.0] * d
    count = 0
    for h, m in zip(H, mask):
        if m:
            for j in range(d):
                total[j] += h[j]
            count += 1
    return [round(total[j] / count, 4) for j in range(d)]


print(mean_pool([[1, 2], [3, 4], [9, 9]], [1, 1, 0]))
`,
    },
    hints: [
      'Only sum tokens whose mask is 1.',
      'Divide by the number of unmasked tokens, not the total length.',
      'Padding tokens should not shift the sentence vector.',
    ],
    tests: [
      { input: 'H=[[1,2],[3,4],[9,9]], mask=[1,1,0]', expected: '[2.0, 3.0]' },
      { input: 'H=[[2,2],[4,4]], mask=[1,1]', expected: '[3.0, 3.0]' },
    ],
  },

  {
    slug: 'skipgram-loss',
    title: 'Word2Vec Skip-Gram Loss (Single Pair)',
    difficulty: 'medium',
    topic: 'Embeddings',
    category: 'Embeddings',
    statement: `Skip-gram learns embeddings by predicting context words from a center word. For a single positive pair the negative log-likelihood is

\\[ L = -\\log \\sigma(\\mathbf{v}_c \\cdot \\mathbf{v}_o), \\qquad \\sigma(z) = \\frac{1}{1 + e^{-z}}. \\]

Given the center vector and the context (output) vector, return the loss rounded to four decimals.`,
    examples: [
      {
        input: 'v_c = [0, 0], v_o = [1, 1]',
        output: '0.6931',
        explanation: 'Dot product is 0, sigma(0) = 0.5, loss = -log(0.5) = ln 2.',
      },
    ],
    starterCode: {
      python: `import math


def skipgram_loss(v_c, v_o):
    z = sum(a * b for a, b in zip(v_c, v_o))
    p = 1.0 / (1.0 + math.exp(-z))
    return round(-math.log(p), 4)


print(skipgram_loss([0, 0], [1, 1]))
`,
    },
    hints: [
      'Score the pair with a dot product, then squash with sigmoid.',
      'The loss is the negative log of that probability.',
      'A zero dot product yields a probability of one half.',
    ],
    tests: [
      { input: 'v_c=[0,0], v_o=[1,1]', expected: '0.6931' },
      { input: 'v_c=[1,1], v_o=[1,1]', expected: '0.1269' },
    ],
  },

  // --------------------------- Clustering ---------------------------

  {
    slug: 'kmeans-plus-plus-init',
    title: 'k-Means++ Farthest Seed',
    difficulty: 'medium',
    topic: 'Clustering',
    category: 'Clustering',
    statement: `k-means++ spreads initial centroids out: after the first centroid, the next is chosen far from existing ones. In the deterministic (greedy) variant, pick the point whose squared distance to its nearest chosen centroid is largest:

\\[ \\text{next} = \\arg\\max_i\\ \\min_{c \\in C}\\ \\lVert x_i - c \\rVert^2. \\]

Given the data points and the list of already-chosen centroids, return the index of the next seed (ties broken by lowest index).`,
    examples: [
      {
        input: 'X = [[0,0],[1,0],[5,0]], chosen = [[0,0]]',
        output: '2',
        explanation: 'Point at x=5 is farthest from the chosen centroid.',
      },
    ],
    starterCode: {
      python: `def kpp_next(X, chosen):
    best_i, best_d = -1, -1.0
    for i, x in enumerate(X):
        nearest = min(sum((a - c) ** 2 for a, c in zip(x, cen)) for cen in chosen)
        if nearest > best_d:
            best_d, best_i = nearest, i
    return best_i


print(kpp_next([[0, 0], [1, 0], [5, 0]], [[0, 0]]))
`,
    },
    hints: [
      'For each point find its distance to the nearest chosen centroid.',
      'Use squared Euclidean distance to avoid square roots.',
      'Pick the point that maximizes that nearest distance.',
    ],
    tests: [
      { input: 'X=[[0,0],[1,0],[5,0]], chosen=[[0,0]]', expected: '2' },
      { input: 'X=[[0],[3],[6]], chosen=[[0],[6]]', expected: '1' },
    ],
  },

  {
    slug: 'silhouette-point',
    title: 'Silhouette Score of a Point',
    difficulty: 'hard',
    topic: 'Clustering',
    category: 'Clustering',
    statement: `The silhouette of a point measures how well it fits its cluster versus the nearest other cluster. With \\(a\\) the mean distance to its own cluster (excluding itself) and \\(b\\) the mean distance to the nearest other cluster,

\\[ s = \\frac{b - a}{\\max(a, b)}. \\]

Given the index of a point, all points, and their cluster labels, return \\(s\\) rounded to four decimals (Euclidean distance).`,
    examples: [
      {
        input: 'i = 0, X = [[0],[0],[10]], labels = [0, 0, 1]',
        output: '1.0',
        explanation: 'a=0 (same spot as its neighbour), b=10, so s = 10/10 = 1.',
      },
    ],
    starterCode: {
      python: `import math


def silhouette(i, X, labels):
    def dist(p, q):
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(p, q)))
    own = labels[i]
    same = [dist(X[i], X[j]) for j in range(len(X)) if j != i and labels[j] == own]
    a = sum(same) / len(same) if same else 0.0
    others = {}
    for j in range(len(X)):
        if labels[j] != own:
            others.setdefault(labels[j], []).append(dist(X[i], X[j]))
    b = min(sum(d) / len(d) for d in others.values())
    return round((b - a) / max(a, b), 4)


print(silhouette(0, [[0], [0], [10]], [0, 0, 1]))
`,
    },
    hints: [
      'Exclude the point itself when averaging within-cluster distances.',
      'b is the smallest average distance to any other single cluster.',
      'A silhouette near 1 means a tight, well-separated cluster.',
    ],
    tests: [
      { input: 'i=0, X=[[0],[0],[10]], labels=[0,0,1]', expected: '1.0' },
      { input: 'i=0, X=[[0],[1],[4],[5]], labels=[0,0,1,1]', expected: '0.7778' },
    ],
  },

  {
    slug: 'dbscan-core-points',
    title: 'DBSCAN Core Points',
    difficulty: 'medium',
    topic: 'Clustering',
    category: 'Clustering',
    statement: `DBSCAN labels a point as a core point if at least \\(minPts\\) points (including itself) lie within radius \\(\\varepsilon\\). Given the points, \\(\\varepsilon\\), and \\(minPts\\), return the sorted list of indices that are core points (Euclidean distance).`,
    examples: [
      {
        input: 'X = [[0],[0.5],[1],[10]], eps = 1.0, minPts = 2',
        output: '[0, 1, 2]',
        explanation: 'Each of the first three has at least one neighbour within 1; the outlier at 10 does not.',
      },
    ],
    starterCode: {
      python: `import math


def core_points(X, eps, minPts):
    cores = []
    for i, xi in enumerate(X):
        count = 0
        for xj in X:
            d = math.sqrt(sum((a - b) ** 2 for a, b in zip(xi, xj)))
            if d <= eps:
                count += 1
        if count >= minPts:
            cores.append(i)
    return sorted(cores)


print(core_points([[0], [0.5], [1], [10]], 1.0, 2))
`,
    },
    hints: [
      'Counting the point itself, a core needs minPts neighbours within eps.',
      'Use a closed ball: distance <= eps.',
      'Isolated outliers fall below the minPts threshold.',
    ],
    tests: [
      { input: 'X=[[0],[0.5],[1],[10]], eps=1.0, minPts=2', expected: '[0, 1, 2]' },
      { input: 'X=[[0],[5]], eps=1.0, minPts=2', expected: '[]' },
    ],
  },

  // --------------------------- Dimensionality Reduction ---------------------------

  {
    slug: 'covariance-matrix',
    title: 'Covariance Matrix',
    difficulty: 'medium',
    topic: 'Dimensionality reduction',
    category: 'Dimensionality Reduction',
    statement: `PCA begins from the covariance matrix of centered data. For a data matrix \\(X\\) with \\(n\\) rows, the population covariance is

\\[ \\Sigma = \\frac{1}{n}\\,(X - \\bar{X})^\\top (X - \\bar{X}). \\]

Given rows of 2-D points, return the \\(2\\times 2\\) covariance matrix (population, divide by \\(n\\)) rounded to four decimals.`,
    examples: [
      {
        input: 'X = [[1, 1], [3, 3]]',
        output: '[[1.0, 1.0], [1.0, 1.0]]',
        explanation: 'Both features deviate by +/-1 together, giving variance and covariance 1.',
      },
    ],
    starterCode: {
      python: `def covariance(X):
    n = len(X)
    d = len(X[0])
    means = [sum(row[j] for row in X) / n for j in range(d)]
    cov = [[0.0] * d for _ in range(d)]
    for row in X:
        for a in range(d):
            for b in range(d):
                cov[a][b] += (row[a] - means[a]) * (row[b] - means[b])
    return [[round(cov[a][b] / n, 4) for b in range(d)] for a in range(d)]


print(covariance([[1, 1], [3, 3]]))
`,
    },
    hints: [
      'Subtract each column mean before forming products.',
      'Divide by n for the population covariance.',
      'The diagonal holds the per-feature variances.',
    ],
    tests: [
      { input: 'X=[[1,1],[3,3]]', expected: '[[1.0, 1.0], [1.0, 1.0]]' },
      { input: 'X=[[1,2],[3,2]]', expected: '[[1.0, 0.0], [0.0, 0.0]]' },
    ],
  },

  {
    slug: 'whitening-scale',
    title: 'Per-Feature Whitening',
    difficulty: 'easy',
    topic: 'Dimensionality reduction',
    category: 'Dimensionality Reduction',
    statement: `Whitening rescales each feature to zero mean and unit variance, decorrelating magnitudes before a model sees them:

\\[ z_{ij} = \\frac{x_{ij} - \\mu_j}{\\sigma_j}, \\qquad \\sigma_j = \\sqrt{\\tfrac{1}{n}\\textstyle\\sum_i (x_{ij} - \\mu_j)^2}. \\]

Given a single feature column, return the whitened values rounded to four decimals (population std).`,
    examples: [
      {
        input: 'col = [1, 2, 3]',
        output: '[-1.2247, 0.0, 1.2247]',
        explanation: 'Mean 2, std sqrt(2/3); the centered values divided by that std.',
      },
    ],
    starterCode: {
      python: `import math


def whiten(col):
    n = len(col)
    mu = sum(col) / n
    var = sum((x - mu) ** 2 for x in col) / n
    sd = math.sqrt(var)
    return [round((x - mu) / sd, 4) for x in col]


print(whiten([1, 2, 3]))
`,
    },
    hints: [
      'Center on the mean first.',
      'Use the population standard deviation (divide by n).',
      'The result has unit variance by construction.',
    ],
    tests: [
      { input: 'col=[1,2,3]', expected: '[-1.2247, 0.0, 1.2247]' },
      { input: 'col=[2,4]', expected: '[-1.0, 1.0]' },
    ],
  },

  {
    slug: 'tsne-affinity-row',
    title: 't-SNE Conditional Affinities',
    difficulty: 'hard',
    topic: 'Dimensionality reduction',
    category: 'Dimensionality Reduction',
    statement: `t-SNE turns pairwise distances into conditional probabilities. For point \\(i\\), the affinity to \\(j\\) under a Gaussian of variance \\(\\sigma^2\\) is

\\[ p_{j|i} = \\frac{\\exp(-\\lVert x_i - x_j \\rVert^2 / 2\\sigma^2)}{\\sum_{k \\neq i} \\exp(-\\lVert x_i - x_k \\rVert^2 / 2\\sigma^2)}, \\qquad p_{i|i} = 0. \\]

Given the points, an index \\(i\\), and \\(\\sigma\\), return the affinity row \\(p_{\\cdot|i}\\) rounded to four decimals.`,
    examples: [
      {
        input: 'X = [[0], [0], [0]], i = 0, sigma = 1.0',
        output: '[0.0, 0.5, 0.5]',
        explanation: 'Equal distances give equal mass split over the two other points.',
      },
    ],
    starterCode: {
      python: `import math


def tsne_row(X, i, sigma):
    n = len(X)
    nums = []
    for j in range(n):
        if j == i:
            nums.append(0.0)
        else:
            d2 = sum((a - b) ** 2 for a, b in zip(X[i], X[j]))
            nums.append(math.exp(-d2 / (2 * sigma ** 2)))
    z = sum(nums)
    return [round(v / z, 4) for v in nums]


print(tsne_row([[0], [0], [0]], 0, 1.0))
`,
    },
    hints: [
      'The self-affinity p(i|i) is fixed to zero.',
      'Exponentiate negative squared distances, then normalize the row.',
      'Closer points receive larger conditional probability.',
    ],
    tests: [
      { input: 'X=[[0],[0],[0]], i=0, sigma=1.0', expected: '[0.0, 0.5, 0.5]' },
      { input: 'X=[[0],[0]], i=1, sigma=2.0', expected: '[1.0, 0.0]' },
    ],
  },

  // --------------------------- Metrics ---------------------------

  {
    slug: 'precision-recall-f1',
    title: 'Precision, Recall, and F1',
    difficulty: 'easy',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `From binary predictions and labels, count true/false positives and negatives, then report

\\[ P = \\frac{TP}{TP + FP}, \\quad R = \\frac{TP}{TP + FN}, \\quad F_1 = \\frac{2PR}{P + R}. \\]

Return the tuple \\((P, R, F_1)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'y_true = [1, 0, 1, 1], y_pred = [1, 0, 0, 1]',
        output: '(1.0, 0.6667, 0.8)',
        explanation: 'TP=2, FP=0, FN=1: precision 1, recall 2/3, F1 0.8.',
      },
    ],
    starterCode: {
      python: `def prf1(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return (round(prec, 4), round(rec, 4), round(f1, 4))


print(prf1([1, 0, 1, 1], [1, 0, 0, 1]))
`,
    },
    hints: [
      'Precision divides by predicted positives, recall by actual positives.',
      'F1 is the harmonic mean of precision and recall.',
      'Guard against division by zero when a denominator is empty.',
    ],
    tests: [
      { input: 'y_true=[1,0,1,1], y_pred=[1,0,0,1]', expected: '(1.0, 0.6667, 0.8)' },
      { input: 'y_true=[1,1], y_pred=[1,1]', expected: '(1.0, 1.0, 1.0)' },
    ],
  },

  {
    slug: 'confusion-matrix-binary',
    title: 'Binary Confusion Matrix',
    difficulty: 'easy',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `The confusion matrix tabulates predictions against truth. For binary labels return the tuple \\((TP, FP, FN, TN)\\) where TP/TN are correct positive/negative predictions and FP/FN are the two error types.`,
    examples: [
      {
        input: 'y_true = [1, 0, 1, 0], y_pred = [1, 1, 0, 0]',
        output: '(1, 1, 1, 1)',
        explanation: 'One of each: TP, FP, FN, TN.',
      },
    ],
    starterCode: {
      python: `def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            tp += 1
        elif t == 0 and p == 1:
            fp += 1
        elif t == 1 and p == 0:
            fn += 1
        else:
            tn += 1
    return (tp, fp, fn, tn)


print(confusion([1, 0, 1, 0], [1, 1, 0, 0]))
`,
    },
    hints: [
      'Each pair falls into exactly one of four buckets.',
      'False positive: predicted 1 but truth 0.',
      'The four counts always sum to the number of samples.',
    ],
    tests: [
      { input: 'y_true=[1,0,1,0], y_pred=[1,1,0,0]', expected: '(1, 1, 1, 1)' },
      { input: 'y_true=[1,1,1], y_pred=[1,1,1]', expected: '(3, 0, 0, 0)' },
    ],
  },

  {
    slug: 'roc-auc-rank',
    title: 'ROC-AUC via Rank Counting',
    difficulty: 'hard',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `ROC-AUC equals the probability that a random positive scores higher than a random negative. Counting over all positive/negative pairs (a tie counts as half),

\\[ \\text{AUC} = \\frac{\\sum_{i \\in +}\\sum_{j \\in -} \\big[\\,\\mathbb{1}(s_i > s_j) + \\tfrac12\\mathbb{1}(s_i = s_j)\\,\\big]}{|+|\\,\\cdot\\,|-|}. \\]

Given scores and binary labels, return the AUC rounded to four decimals.`,
    examples: [
      {
        input: 'scores = [0.9, 0.1, 0.8, 0.4], labels = [1, 0, 1, 0]',
        output: '1.0',
        explanation: 'Every positive outscores every negative, so AUC is perfect.',
      },
    ],
    starterCode: {
      python: `def roc_auc(scores, labels):
    pos = [s for s, y in zip(scores, labels) if y == 1]
    neg = [s for s, y in zip(scores, labels) if y == 0]
    total = 0.0
    for sp in pos:
        for sn in neg:
            if sp > sn:
                total += 1.0
            elif sp == sn:
                total += 0.5
    return round(total / (len(pos) * len(neg)), 4)


print(roc_auc([0.9, 0.1, 0.8, 0.4], [1, 0, 1, 0]))
`,
    },
    hints: [
      'Compare every positive score against every negative score.',
      'A tie contributes half a point.',
      'Divide by the number of positive-negative pairs.',
    ],
    tests: [
      { input: 'scores=[0.9,0.1,0.8,0.4], labels=[1,0,1,0]', expected: '1.0' },
      { input: 'scores=[0.5,0.5], labels=[1,0]', expected: '0.5' },
      { input: 'scores=[0.2,0.8], labels=[1,0]', expected: '0.0' },
    ],
  },

  {
    slug: 'r-squared',
    title: 'R-Squared (Coefficient of Determination)',
    difficulty: 'easy',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `\\(R^2\\) reports the fraction of target variance explained by predictions:

\\[ R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2}. \\]

A perfect fit gives 1; predicting the mean gives 0. Return \\(R^2\\) rounded to four decimals.`,
    examples: [
      {
        input: 'y = [1, 2, 3], yhat = [1, 2, 3]',
        output: '1.0',
        explanation: 'Zero residual error means R^2 is 1.',
      },
    ],
    starterCode: {
      python: `def r_squared(y, yhat):
    mean = sum(y) / len(y)
    ss_res = sum((a - b) ** 2 for a, b in zip(y, yhat))
    ss_tot = sum((a - mean) ** 2 for a in y)
    return round(1 - ss_res / ss_tot, 4)


print(r_squared([1, 2, 3], [1, 2, 3]))
`,
    },
    hints: [
      'Residual sum of squares over total sum of squares.',
      'Subtract that ratio from one.',
      'Predicting the mean yields exactly zero.',
    ],
    tests: [
      { input: 'y=[1,2,3], yhat=[1,2,3]', expected: '1.0' },
      { input: 'y=[1,2,3], yhat=[2,2,2]', expected: '0.0' },
      { input: 'y=[1,2,3], yhat=[3,2,1]', expected: '-3.0' },
    ],
  },

  // ===================== Catalog expansion (v2) =====================
  // ------------------------------ Losses --------------------------------

  {
    slug: 'huber-loss',
    title: 'Huber Loss',
    difficulty: 'medium',
    topic: 'Regression',
    category: 'Losses',
    statement: `Huber loss behaves like mean squared error for small residuals and like mean absolute error for large ones, so a few outliers cannot dominate the gradient. With residual \\(a = \\hat{y} - y\\) and threshold \\(\\delta\\):

\\[ L_\\delta(a) = \\begin{cases} \\tfrac{1}{2} a^2 & |a| \\le \\delta \\\\ \\delta\\,(|a| - \\tfrac{1}{2}\\delta) & |a| > \\delta \\end{cases}. \\]

Return the mean Huber loss over all samples, rounded to four decimals.`,
    examples: [
      {
        input: 'preds = [1.0, 5.0], targets = [1.5, 1.0], delta = 1.0',
        output: '1.8125',
        explanation: 'First residual 0.5 stays quadratic (0.125); second residual 4.0 goes linear (3.5); mean is 1.8125.',
      },
    ],
    starterCode: {
      python: `def huber_loss(preds, targets, delta=1.0):
    n = len(preds)
    total = 0.0
    for p, y in zip(preds, targets):
        a = abs(p - y)
        if a <= delta:
            total += 0.5 * a * a
        else:
            total += delta * (a - 0.5 * delta)
    return round(total / n, 4)


print(huber_loss([1.0, 5.0], [1.5, 1.0], 1.0))
`,
    },
    hints: [
      'Switch on whether the absolute residual is within delta of zero.',
      'The linear branch is delta * (|a| - delta/2), which makes the two pieces meet smoothly at |a| = delta.',
      'Average over all samples at the end.',
    ],
    tests: [
      { input: 'preds=[1.0,5.0], targets=[1.5,1.0], delta=1.0', expected: '1.8125' },
      { input: 'preds=[2.0], targets=[2.0], delta=1.0', expected: '0.0' },
    ],
  },

  {
    slug: 'kl-divergence-loss',
    title: 'KL Divergence Between Distributions',
    difficulty: 'medium',
    topic: 'Information theory',
    category: 'Losses',
    statement: `The Kullback-Leibler divergence measures how far a predicted distribution \\(q\\) sits from a target distribution \\(p\\):

\\[ D_{\\mathrm{KL}}(p \\,\\|\\, q) = \\sum_i p_i \\log \\frac{p_i}{q_i}. \\]

It is zero exactly when \\(p = q\\) and never negative. Add a tiny epsilon inside the log to stay finite when a probability is zero. Return the divergence rounded to four decimals.`,
    examples: [
      {
        input: 'p = [1.0, 0.0], q = [0.5, 0.5]',
        output: '0.6931',
        explanation: 'Only the first term survives: 1 * log(1/0.5) = log 2 ~ 0.6931.',
      },
    ],
    starterCode: {
      python: `import math


def kl_divergence(p, q, eps=1e-12):
    total = 0.0
    for pi, qi in zip(p, q):
        total += pi * math.log((pi + eps) / (qi + eps))
    return round(total, 4)


print(kl_divergence([1.0, 0.0], [0.5, 0.5]))
`,
    },
    hints: [
      'Sum p_i * log(p_i / q_i) over the support.',
      'KL is asymmetric: swapping p and q gives a different number.',
      'A term with p_i = 0 contributes nothing, so the epsilon only guards q_i = 0.',
    ],
    tests: [
      { input: 'p=[0.5,0.5], q=[0.5,0.5]', expected: '0.0' },
      { input: 'p=[1.0,0.0], q=[0.5,0.5]', expected: '0.6931' },
    ],
  },

  {
    slug: 'triplet-loss',
    title: 'Triplet Margin Loss',
    difficulty: 'medium',
    topic: 'Metric learning',
    category: 'Losses',
    statement: `Triplet loss pulls an anchor toward a positive and pushes it away from a negative until their squared-distance gap exceeds a margin. With anchor \\(a\\), positive \\(p\\), negative \\(n\\):

\\[ L = \\max\\big(0,\\; \\lVert a - p \\rVert^2 - \\lVert a - n \\rVert^2 + \\text{margin}\\big). \\]

Once the negative is far enough relative to the positive, the loss is exactly zero. Return the loss rounded to four decimals.`,
    examples: [
      {
        input: 'a = [0,0], p = [0,1], n = [3,0], margin = 1.0',
        output: '0.0',
        explanation: 'Positive distance 1, negative distance 9: the gap already beats the margin, so loss clamps to 0.',
      },
    ],
    starterCode: {
      python: `def triplet_loss(a, p, n, margin=1.0):
    dp = sum((x - y) ** 2 for x, y in zip(a, p))
    dn = sum((x - y) ** 2 for x, y in zip(a, n))
    return round(max(0.0, dp - dn + margin), 4)


print(triplet_loss([0, 0], [0, 1], [3, 0], 1.0))
`,
    },
    hints: [
      'Use squared Euclidean distance, not the square root.',
      'The loss is positive only when the negative is too close compared with the positive.',
      'Clamp the final value at zero with max(0, .).',
    ],
    tests: [
      { input: 'a=[0,0], p=[0,1], n=[3,0], margin=1.0', expected: '0.0' },
      { input: 'a=[0,0], p=[3,0], n=[0,1], margin=1.0', expected: '9.0' },
    ],
  },

  {
    slug: 'infonce-loss',
    title: 'InfoNCE Contrastive Loss',
    difficulty: 'hard',
    topic: 'Self-supervised learning',
    category: 'Losses',
    statement: `Contrastive learning treats the matching key as the correct class among a batch of candidates. With a query \\(q\\), keys \\(k_0, k_1, \\dots\\) (index 0 is the positive), and temperature \\(\\tau\\):

\\[ L = -\\log \\frac{\\exp(q \\cdot k_0 / \\tau)}{\\sum_j \\exp(q \\cdot k_j / \\tau)}. \\]

This is just a softmax cross-entropy over similarity scores with the positive as the label. Subtract the max score before exponentiating. Return the loss rounded to four decimals.`,
    examples: [
      {
        input: 'q = [1,0], keys = [[1,0],[0,1]], temp = 1.0',
        output: '0.3133',
        explanation: 'Positive similarity 1 vs negative 0: softmax gives the positive ~0.731, and -log(0.731) ~ 0.3133.',
      },
    ],
    starterCode: {
      python: `import math


def infonce_loss(q, keys, temp=1.0):
    sims = [sum(qi * ki for qi, ki in zip(q, k)) / temp for k in keys]
    m = max(sims)
    exps = [math.exp(s - m) for s in sims]
    p_pos = exps[0] / sum(exps)
    return round(-math.log(p_pos), 4)


print(infonce_loss([1, 0], [[1, 0], [0, 1]], 1.0))
`,
    },
    hints: [
      'Score every key by dot product with the query, then divide by temperature.',
      'The positive key sits at index 0; it plays the role of the true label.',
      'A lower temperature sharpens the softmax and punishes wrong matches harder.',
    ],
    tests: [
      { input: 'q=[1,0], keys=[[1,0],[0,1]], temp=1.0', expected: '0.3133' },
      { input: 'q=[1,0], keys=[[1,0],[1,0]], temp=1.0', expected: '0.6931' },
    ],
  },

  // --------------------------- Activations ------------------------------

  {
    slug: 'silu-swish',
    title: 'SiLU / Swish Activation',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `SiLU (also called Swish) gates the input by its own sigmoid, giving a smooth, non-monotonic curve that often outperforms ReLU:

\\[ \\mathrm{SiLU}(x) = x \\cdot \\sigma(x) = \\frac{x}{1 + e^{-x}}. \\]

Apply it element-wise to a list and return the values rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [0, 1, -1]',
        output: '[0.0, 0.7311, -0.2689]',
        explanation: 'At 0 the output is 0; SiLU dips slightly below zero for moderate negatives before flattening.',
      },
    ],
    starterCode: {
      python: `import math


def silu(xs):
    return [round(x / (1.0 + math.exp(-x)), 4) for x in xs]


print(silu([0, 1, -1]))
`,
    },
    hints: [
      'SiLU is just x times the sigmoid of x.',
      'It is not monotonic: the curve has a small negative dip for x < 0.',
      'As x grows large positive, sigmoid approaches 1 and SiLU approaches x.',
    ],
    tests: [
      { input: 'xs=[0,1,-1]', expected: '[0.0, 0.7311, -0.2689]' },
      { input: 'xs=[2]', expected: '[1.7616]' },
    ],
  },

  {
    slug: 'softplus-activation',
    title: 'Softplus Activation',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Softplus is a smooth approximation to ReLU whose derivative is the sigmoid:

\\[ \\mathrm{softplus}(x) = \\log(1 + e^{x}). \\]

Computed naively this overflows for large \\(x\\), so use the stable form \\(\\max(x, 0) + \\log(1 + e^{-|x|})\\). Apply it element-wise and round to four decimals.`,
    examples: [
      {
        input: 'xs = [0, 1, -1]',
        output: '[0.6931, 1.3133, 0.3133]',
        explanation: 'softplus(0) = log 2 ~ 0.6931; the curve hugs ReLU but stays positive everywhere.',
      },
    ],
    starterCode: {
      python: `import math


def softplus(xs):
    return [round(math.log1p(math.exp(-abs(x))) + max(x, 0), 4) for x in xs]


print(softplus([0, 1, -1]))
`,
    },
    hints: [
      'The stable form pulls the positive part out: max(x,0) + log(1 + e^{-|x|}).',
      'math.log1p is more accurate than log(1 + .) for small arguments.',
      'For large positive x, softplus(x) is approximately x.',
    ],
    tests: [
      { input: 'xs=[0,1,-1]', expected: '[0.6931, 1.3133, 0.3133]' },
      { input: 'xs=[100]', expected: '[100.0]' },
    ],
  },

  {
    slug: 'leaky-relu',
    title: 'Leaky ReLU Activation',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Leaky ReLU keeps a small slope for negative inputs so gradients never fully die:

\\[ \\mathrm{LeakyReLU}(x) = \\begin{cases} x & x > 0 \\\\ \\alpha x & x \\le 0 \\end{cases}, \\qquad \\alpha = 0.01 \\text{ by default}. \\]

Apply it element-wise and return the values rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [-2, 3, 0], alpha = 0.01',
        output: '[-0.02, 3.0, 0.0]',
        explanation: 'Positives pass through; the negative is scaled by alpha to -0.02.',
      },
    ],
    starterCode: {
      python: `def leaky_relu(xs, alpha=0.01):
    return [round(float(x) if x > 0 else alpha * x, 4) for x in xs]


print(leaky_relu([-2, 3, 0], 0.01))
`,
    },
    hints: [
      'Positive inputs are untouched; negatives are multiplied by alpha.',
      'The small negative slope is what prevents the dead-neuron problem of plain ReLU.',
      'At exactly zero the output is zero.',
    ],
    tests: [
      { input: 'xs=[-2,3,0], alpha=0.01', expected: '[-0.02, 3.0, 0.0]' },
      { input: 'xs=[-10], alpha=0.1', expected: '[-1.0]' },
    ],
  },

  {
    slug: 'mish-activation',
    title: 'Mish Activation',
    difficulty: 'medium',
    topic: 'Neural networks',
    category: 'Activations',
    statement: `Mish is a smooth, self-gating activation defined through softplus and tanh:

\\[ \\mathrm{Mish}(x) = x \\cdot \\tanh\\big(\\mathrm{softplus}(x)\\big) = x \\cdot \\tanh\\big(\\log(1 + e^{x})\\big). \\]

Use the stable softplus form so large inputs do not overflow. Apply Mish element-wise and round to four decimals.`,
    examples: [
      {
        input: 'xs = [0, 1, -1]',
        output: '[0.0, 0.8651, -0.3034]',
        explanation: 'Like SiLU, Mish is non-monotonic and dips slightly negative for x < 0.',
      },
    ],
    starterCode: {
      python: `import math


def mish(xs):
    out = []
    for x in xs:
        sp = math.log1p(math.exp(-abs(x))) + max(x, 0)
        out.append(round(x * math.tanh(sp), 4))
    return out


print(mish([0, 1, -1]))
`,
    },
    hints: [
      'Compute softplus first, then take tanh of it, then multiply by x.',
      'Reuse the stable softplus trick to avoid overflow on large inputs.',
      'Mish stays bounded below but unbounded above, much like SiLU.',
    ],
    tests: [
      { input: 'xs=[0,1,-1]', expected: '[0.0, 0.8651, -0.3034]' },
      { input: 'xs=[2]', expected: '[1.944]' },
    ],
  },

  // ---------------------------- Optimizers ------------------------------

  {
    slug: 'adamw-step',
    title: 'AdamW Update Step',
    difficulty: 'medium',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `AdamW decouples weight decay from the adaptive gradient step, applying decay directly to the weights rather than folding it into the gradient. For one parameter starting from zero moments at step \\(t = 1\\):

\\[ m = (1 - \\beta_1) g, \\quad v = (1 - \\beta_2) g^2, \\quad \\hat{m} = \\tfrac{m}{1 - \\beta_1}, \\quad \\hat{v} = \\tfrac{v}{1 - \\beta_2}, \\]
\\[ w \\leftarrow w - \\eta\\,\\lambda\\,w, \\qquad w \\leftarrow w - \\eta\\,\\frac{\\hat{m}}{\\sqrt{\\hat{v}} + \\epsilon}. \\]

Return the updated weight after one step, rounded to four decimals.`,
    examples: [
      {
        input: 'w = 1.0, g = 0.5, lr = 0.1, weight_decay = 0.01',
        output: '0.899',
        explanation: 'Decay nudges w to 0.999, then the bias-corrected adaptive step (~0.1) brings it to ~0.899.',
      },
    ],
    starterCode: {
      python: `import math


def adamw_step(w, g, lr=0.1, b1=0.9, b2=0.999, eps=1e-8, weight_decay=0.01):
    m = (1 - b1) * g
    v = (1 - b2) * g * g
    m_hat = m / (1 - b1)
    v_hat = v / (1 - b2)
    w = w - lr * weight_decay * w
    w = w - lr * m_hat / (math.sqrt(v_hat) + eps)
    return round(w, 4)


print(adamw_step(1.0, 0.5))
`,
    },
    hints: [
      'Apply weight decay to w directly before the adaptive update, not to the gradient.',
      'At t=1 the bias correction divides each moment by its (1 - beta) factor.',
      'The adaptive magnitude is m_hat / sqrt(v_hat), which is roughly the learning rate for a steady gradient.',
    ],
    tests: [
      { input: 'w=1.0, g=0.5', expected: '0.899' },
      { input: 'w=0.0, g=0.0', expected: '0.0' },
    ],
  },

  {
    slug: 'nadam-step',
    title: 'Nadam Update Step',
    difficulty: 'hard',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Nadam folds Nesterov look-ahead into Adam. For one parameter from zero moments at step \\(t = 1\\):

\\[ m = (1 - \\beta_1) g, \\quad v = (1 - \\beta_2) g^2, \\quad \\hat{m} = \\tfrac{m}{1 - \\beta_1}, \\quad \\hat{v} = \\tfrac{v}{1 - \\beta_2}, \\]

and the Nesterov-corrected numerator

\\[ \\tilde{m} = \\beta_1 \\hat{m} + \\frac{(1 - \\beta_1) g}{1 - \\beta_1}, \\qquad w \\leftarrow w - \\eta\\,\\frac{\\tilde{m}}{\\sqrt{\\hat{v}} + \\epsilon}. \\]

Return the updated weight after one step, rounded to four decimals.`,
    examples: [
      {
        input: 'w = 1.0, g = 0.5, lr = 0.1',
        output: '0.81',
        explanation: 'The look-ahead term inflates the step slightly past plain Adam, landing near 0.81.',
      },
    ],
    starterCode: {
      python: `import math


def nadam_step(w, g, lr=0.1, b1=0.9, b2=0.999, eps=1e-8):
    t = 1
    m = (1 - b1) * g
    v = (1 - b2) * g * g
    m_hat = m / (1 - b1 ** t)
    v_hat = v / (1 - b2 ** t)
    nesterov = b1 * m_hat + (1 - b1) * g / (1 - b1 ** t)
    w = w - lr * nesterov / (math.sqrt(v_hat) + eps)
    return round(w, 4)


print(nadam_step(1.0, 0.5))
`,
    },
    hints: [
      'Nadam differs from Adam only in the numerator: it blends the corrected moment with the current gradient.',
      'At t=1 the bias corrections divide by (1 - beta), same as Adam.',
      'The look-ahead makes the effective step a touch larger than plain Adam for a fresh gradient.',
    ],
    tests: [
      { input: 'w=1.0, g=0.5', expected: '0.81' },
      { input: 'w=2.0, g=0.0', expected: '2.0' },
    ],
  },

  {
    slug: 'lookahead-step',
    title: 'Lookahead Slow-Weight Update',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Lookahead wraps any inner optimizer with a slow set of weights that periodically interpolates toward the fast weights:

\\[ \\phi \\leftarrow \\phi + \\alpha\\,(\\theta - \\phi), \\]

where \\(\\phi\\) is the slow weight, \\(\\theta\\) the fast weight after several inner steps, and \\(\\alpha\\) the slow step size. Apply this synchronization element-wise and return the new slow weights rounded to four decimals.`,
    examples: [
      {
        input: 'slow = [0.0, 0.0], fast = [1.0, 2.0], alpha = 0.5',
        output: '[0.5, 1.0]',
        explanation: 'Each slow weight moves halfway toward its fast counterpart.',
      },
    ],
    starterCode: {
      python: `def lookahead_step(slow, fast, alpha=0.5):
    return [round(s + alpha * (f - s), 4) for s, f in zip(slow, fast)]


print(lookahead_step([0.0, 0.0], [1.0, 2.0], 0.5))
`,
    },
    hints: [
      'This is a linear interpolation: alpha=1 jumps fully to the fast weights, alpha=0 stays put.',
      'The fast weights come from the inner optimizer; Lookahead only blends them in.',
      'Apply the same alpha to every coordinate.',
    ],
    tests: [
      { input: 'slow=[0,0], fast=[1,2], alpha=0.5', expected: '[0.5, 1.0]' },
      { input: 'slow=[1,1], fast=[1,1], alpha=0.5', expected: '[1.0, 1.0]' },
    ],
  },

  {
    slug: 'gradient-centralization',
    title: 'Gradient Centralization',
    difficulty: 'easy',
    topic: 'Optimization',
    category: 'Optimizers',
    statement: `Gradient centralization subtracts the mean from a gradient vector before the optimizer uses it, which acts as a projection that regularizes the weight space:

\\[ g \\leftarrow g - \\frac{1}{d}\\sum_{j=1}^{d} g_j. \\]

The centralized gradient always sums to zero. Return it rounded to four decimals.`,
    examples: [
      {
        input: 'g = [1.0, 2.0, 3.0]',
        output: '[-1.0, 0.0, 1.0]',
        explanation: 'The mean is 2.0; subtracting it centers the vector around zero.',
      },
    ],
    starterCode: {
      python: `def gradient_centralization(g):
    mu = sum(g) / len(g)
    return [round(x - mu, 4) for x in g]


print(gradient_centralization([1.0, 2.0, 3.0]))
`,
    },
    hints: [
      'Compute the mean of the gradient, then subtract it from every entry.',
      'The result is mean-zero by construction.',
      'It is a cheap, free-to-add operation that can stabilize training.',
    ],
    tests: [
      { input: 'g=[1,2,3]', expected: '[-1.0, 0.0, 1.0]' },
      { input: 'g=[5,5,5]', expected: '[0.0, 0.0, 0.0]' },
    ],
  },

  // -------------------------- Neural Networks ---------------------------

  {
    slug: 'dropout-forward-scale',
    title: 'Inverted Dropout Forward',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Inverted dropout zeroes a random subset of activations during training and rescales the survivors by \\(1/(1-p)\\) so the expected output is unchanged and inference needs no adjustment. Given a fixed mask (1 = keep, 0 = drop) and drop probability \\(p\\):

\\[ y_i = \\frac{x_i \\cdot \\text{mask}_i}{1 - p}. \\]

Return the masked, rescaled activations rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1,2,3,4], mask = [1,0,1,1], p = 0.5',
        output: '[2.0, 0.0, 6.0, 8.0]',
        explanation: 'Dropped units go to zero; survivors are doubled because 1/(1-0.5) = 2.',
      },
    ],
    starterCode: {
      python: `def dropout_forward(xs, mask, p=0.5):
    keep = 1 - p
    return [round(x * m / keep, 4) for x, m in zip(xs, mask)]


print(dropout_forward([1, 2, 3, 4], [1, 0, 1, 1], 0.5))
`,
    },
    hints: [
      'Multiply by the mask first, then divide every entry by (1 - p).',
      'The rescaling is what lets you skip dropout entirely at inference time.',
      'With p=0 the keep factor is 1 and nothing changes.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], mask=[1,0,1,1], p=0.5', expected: '[2.0, 0.0, 6.0, 8.0]' },
      { input: 'xs=[1,2], mask=[1,1], p=0.0', expected: '[1.0, 2.0]' },
    ],
  },

  {
    slug: 'weight-tying-logits',
    title: 'Weight-Tied Output Logits',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Many language models tie the input embedding matrix and the output projection: the logits are the hidden state projected against the same embedding rows used for token lookup. With hidden state \\(h \\in \\mathbb{R}^{d}\\) and embedding matrix \\(E \\in \\mathbb{R}^{V \\times d}\\):

\\[ \\text{logit}_v = \\sum_{j=1}^{d} h_j \\, E_{vj}. \\]

This halves the parameter count of the head. Return the per-token logits rounded to four decimals.`,
    examples: [
      {
        input: 'h = [1.0, 2.0], E = [[1,0],[0,1],[1,1]]',
        output: '[1.0, 2.0, 3.0]',
        explanation: 'Each logit is the dot product of h with the corresponding embedding row.',
      },
    ],
    starterCode: {
      python: `def tied_logits(h, E):
    return [round(sum(hj * ej for hj, ej in zip(h, row)), 4) for row in E]


print(tied_logits([1.0, 2.0], [[1, 0], [0, 1], [1, 1]]))
`,
    },
    hints: [
      'The output projection is just E (the embedding matrix), not a separate weight.',
      'Each vocabulary entry contributes one logit: dot product of h with its embedding row.',
      'Tying weights is a regularizer and a memory saver in large-vocab models.',
    ],
    tests: [
      { input: 'h=[1,2], E=[[1,0],[0,1],[1,1]]', expected: '[1.0, 2.0, 3.0]' },
      { input: 'h=[0,0], E=[[1,2],[3,4]]', expected: '[0.0, 0.0]' },
    ],
  },

  {
    slug: 'gradient-accumulation',
    title: 'Gradient Accumulation',
    difficulty: 'easy',
    topic: 'Neural networks',
    category: 'Neural Networks',
    statement: `Gradient accumulation simulates a large batch on limited memory by summing gradients across several micro-batches and averaging before the optimizer step. Given a list of per-micro-batch gradient vectors, return the averaged gradient

\\[ \\bar{g}_j = \\frac{1}{B}\\sum_{b=1}^{B} g^{(b)}_j, \\]

rounded to four decimals. This matches the gradient you would get from one big batch.`,
    examples: [
      {
        input: 'grads = [[1,2],[3,4]]',
        output: '[2.0, 3.0]',
        explanation: 'Sum the two micro-batch gradients coordinate-wise, then divide by 2.',
      },
    ],
    starterCode: {
      python: `def accumulate_gradients(grads):
    n = len(grads)
    d = len(grads[0])
    return [round(sum(g[j] for g in grads) / n, 4) for j in range(d)]


print(accumulate_gradients([[1, 2], [3, 4]]))
`,
    },
    hints: [
      'Add the gradient vectors element-wise, then divide by the number of micro-batches.',
      'Averaging (not summing) keeps the effective learning rate consistent with a single large batch.',
      'All micro-batch gradients share the same dimension.',
    ],
    tests: [
      { input: 'grads=[[1,2],[3,4]]', expected: '[2.0, 3.0]' },
      { input: 'grads=[[2,2],[2,2],[2,2]]', expected: '[2.0, 2.0]' },
    ],
  },

  // --------------------------- Sequence Models --------------------------

  {
    slug: 'lstm-cell-step',
    title: 'LSTM Cell Step (Scalar)',
    difficulty: 'hard',
    topic: 'Sequence models',
    category: 'Sequence Models',
    statement: `A single-unit LSTM updates its cell and hidden state through four gates. With input \\(x\\), previous hidden \\(h\\), previous cell \\(c\\), and per-gate weights \\((w_x, w_h, b)\\):

\\[ i = \\sigma(\\cdot),\\ f = \\sigma(\\cdot),\\ g = \\tanh(\\cdot),\\ o = \\sigma(\\cdot), \\]
\\[ c' = f \\odot c + i \\odot g, \\qquad h' = o \\odot \\tanh(c'). \\]

The weight dictionary holds entries for keys 'i', 'f', 'g', 'o', each a tuple \\((w_x, w_h, b)\\). Return \\((h', c')\\) rounded to four decimals.`,
    examples: [
      {
        input: "x=1, h=0, c=0, all weights zero",
        output: '(0.0, 0.0)',
        explanation: 'With zero pre-activations, g=tanh(0)=0, so the cell stays at 0 and so does the hidden state.',
      },
    ],
    starterCode: {
      python: `import math


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def lstm_cell(x, h, c, W):
    def pre(name):
        wx, wh, b = W[name]
        return wx * x + wh * h + b
    i = sigmoid(pre('i'))
    f = sigmoid(pre('f'))
    g = math.tanh(pre('g'))
    o = sigmoid(pre('o'))
    c_new = f * c + i * g
    h_new = o * math.tanh(c_new)
    return (round(h_new, 4), round(c_new, 4))


zero = (0.0, 0.0, 0.0)
W = {'i': zero, 'f': zero, 'g': zero, 'o': zero}
print(lstm_cell(1.0, 0.0, 0.0, W))
`,
    },
    hints: [
      'The forget gate scales the old cell; the input gate scales the new candidate g.',
      'g uses tanh; the three gates i, f, o use sigmoid.',
      'The hidden state is the output gate times tanh of the new cell state.',
    ],
    tests: [
      { input: 'x=1, h=0, c=0, W all zeros', expected: '(0.0, 0.0)' },
      { input: "x=0, h=0, c=2, forget bias large (~sigmoid->1), others zero", expected: '(0.482, 2.0)' },
    ],
  },

  {
    slug: 'gru-cell-step',
    title: 'GRU Cell Step (Scalar)',
    difficulty: 'hard',
    topic: 'Sequence models',
    category: 'Sequence Models',
    statement: `A single-unit GRU blends the previous state with a candidate through update and reset gates. With input \\(x\\), previous hidden \\(h\\), and per-gate weights \\((w_x, w_h, b)\\) for keys 'z', 'r', 'h':

\\[ z = \\sigma(\\cdot),\\quad r = \\sigma(\\cdot),\\quad \\tilde{h} = \\tanh\\!\\big(w_x x + w_h (r \\odot h) + b\\big), \\]
\\[ h' = (1 - z)\\,h + z\\,\\tilde{h}. \\]

Return the new hidden state \\(h'\\) rounded to four decimals.`,
    examples: [
      {
        input: "x=1, h=0, all weights zero",
        output: '0.0',
        explanation: 'With h=0 and a zero candidate (tanh(0)=0), the blended state is 0.',
      },
    ],
    starterCode: {
      python: `import math


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def gru_cell(x, h, W):
    wzx, wzh, bz = W['z']
    wrx, wrh, br = W['r']
    whx, whh, bh = W['h']
    z = sigmoid(wzx * x + wzh * h + bz)
    r = sigmoid(wrx * x + wrh * h + br)
    h_cand = math.tanh(whx * x + whh * (r * h) + bh)
    h_new = (1 - z) * h + z * h_cand
    return round(h_new, 4)


zero = (0.0, 0.0, 0.0)
W = {'z': zero, 'r': zero, 'h': zero}
print(gru_cell(1.0, 0.0, W))
`,
    },
    hints: [
      'The reset gate r modulates the previous hidden state inside the candidate.',
      'The update gate z interpolates between the old state and the candidate.',
      'When z is near 1 the cell mostly adopts the candidate; near 0 it keeps the old state.',
    ],
    tests: [
      { input: 'x=1, h=0, W all zeros', expected: '0.0' },
      { input: "x=1, h=0, update bias large (z->1), candidate wx=1", expected: '0.7616' },
    ],
  },

  {
    slug: 'teacher-forcing-step',
    title: 'Teacher Forcing Step',
    difficulty: 'easy',
    topic: 'Sequence models',
    category: 'Sequence Models',
    statement: `When training a sequence decoder, teacher forcing feeds the ground-truth previous token as the next input instead of the model's own prediction, which stabilizes early training. Given the model's predicted token, the ground-truth token, and a boolean flag, return the token that should be fed to the next step:

\\[ \\text{next} = \\begin{cases} \\text{ground truth} & \\text{teacher forcing on} \\\\ \\text{prediction} & \\text{otherwise} \\end{cases}. \\]`,
    examples: [
      {
        input: 'pred = 5, gt = 3, use_teacher = True',
        output: '3',
        explanation: 'With teacher forcing on, the next input is the ground-truth token, not the prediction.',
      },
    ],
    starterCode: {
      python: `def teacher_forcing_step(pred_token, gt_token, use_teacher):
    return gt_token if use_teacher else pred_token


print(teacher_forcing_step(5, 3, True))
print(teacher_forcing_step(5, 3, False))
`,
    },
    hints: [
      'The flag chooses between the ground-truth token and the model prediction.',
      'Teacher forcing speeds up convergence but can cause exposure bias at inference.',
      'At inference the flag is off, so the model consumes its own outputs.',
    ],
    tests: [
      { input: 'pred=5, gt=3, use_teacher=True', expected: '3' },
      { input: 'pred=5, gt=3, use_teacher=False', expected: '5' },
    ],
  },

  {
    slug: 'beam-search-step',
    title: 'Beam Search Expansion Step',
    difficulty: 'medium',
    topic: 'Sequence models',
    category: 'Sequence Models',
    statement: `Beam search keeps the \\(k\\) highest-scoring partial sequences. At each step it expands every beam by all next tokens, accumulating log-probabilities, then prunes back to the top \\(k\\). Given current beams as \\((\\text{sequence}, \\text{score})\\) and a list of next-token log-prob vectors aligned to the beams, return the top-\\(k\\) expanded beams as \\([\\text{sequence}, \\text{score}]\\), score rounded to four decimals.`,
    examples: [
      {
        input: 'beams = [([1], 0.0)], logprobs = [[log 0.6, log 0.4]], k = 2',
        output: '[[[1, 0], -0.5108], [[1, 1], -0.9163]]',
        explanation: 'Both extensions of the single beam survive, ordered by accumulated log-probability.',
      },
    ],
    starterCode: {
      python: `def beam_search_step(beams, logprobs, k):
    cand = []
    for (seq, score), lp in zip(beams, logprobs):
        for tok, l in enumerate(lp):
            cand.append((tuple(seq) + (tok,), score + l))
    cand.sort(key=lambda x: -x[1])
    return [[list(s), round(sc, 4)] for s, sc in cand[:k]]


import math
beams = [((1,), 0.0)]
logprobs = [[math.log(0.6), math.log(0.4)]]
print(beam_search_step(beams, logprobs, 2))
`,
    },
    hints: [
      'Scores accumulate by adding log-probabilities, not multiplying probabilities.',
      'Expand every beam by every token before sorting.',
      'Keep only the k best candidates after sorting in descending score.',
    ],
    tests: [
      { input: 'beams=[([1],0.0)], logprobs=[[log0.6,log0.4]], k=2', expected: '[[[1, 0], -0.5108], [[1, 1], -0.9163]]' },
      { input: 'beams=[([1],0.0)], logprobs=[[log0.6,log0.4]], k=1', expected: '[[[1, 0], -0.5108]]' },
    ],
  },

  // ----------------------------- Probability ----------------------------

  {
    slug: 'log-sum-exp',
    title: 'Stable Log-Sum-Exp',
    difficulty: 'easy',
    topic: 'Probability',
    category: 'Probability',
    statement: `The log-sum-exp operator turns a sum in probability space into a stable computation in log space, the backbone of softmax and partition-function math:

\\[ \\mathrm{LSE}(z) = \\log \\sum_i e^{z_i} = m + \\log \\sum_i e^{z_i - m}, \\qquad m = \\max_i z_i. \\]

Subtracting the max prevents overflow. Return the result rounded to four decimals.`,
    examples: [
      {
        input: 'z = [0, 0]',
        output: '0.6931',
        explanation: 'log(e^0 + e^0) = log 2 ~ 0.6931.',
      },
    ],
    starterCode: {
      python: `import math


def log_sum_exp(z):
    m = max(z)
    return round(m + math.log(sum(math.exp(v - m) for v in z)), 4)


print(log_sum_exp([0, 0]))
print(log_sum_exp([1, 2, 3]))
`,
    },
    hints: [
      'Pull out the maximum before exponentiating to stay numerically safe.',
      'LSE of equal values v repeated n times is v + log n.',
      'It is the smooth maximum: LSE is always at least max(z).',
    ],
    tests: [
      { input: 'z=[0,0]', expected: '0.6931' },
      { input: 'z=[1,2,3]', expected: '3.4076' },
    ],
  },

  {
    slug: 'softmax-cross-entropy-grad',
    title: 'Softmax Cross-Entropy Gradient',
    difficulty: 'medium',
    topic: 'Probability',
    category: 'Probability',
    statement: `The gradient of softmax cross-entropy with respect to the logits collapses to a famously clean form: the softmax probabilities minus the one-hot target.

\\[ \\frac{\\partial L}{\\partial z_i} = \\mathrm{softmax}(z)_i - \\mathbb{1}[i = y]. \\]

Compute a numerically stable softmax, then subtract 1 from the entry at the true-class index. Return the gradient rounded to four decimals.`,
    examples: [
      {
        input: 'logits = [1, 2, 3], target = 2',
        output: '[0.09, 0.2447, -0.3348]',
        explanation: 'Softmax is [0.09, 0.2447, 0.6652]; subtracting 1 from index 2 gives the gradient.',
      },
    ],
    starterCode: {
      python: `import math


def softmax_ce_grad(logits, target):
    m = max(logits)
    exps = [math.exp(z - m) for z in logits]
    s = sum(exps)
    probs = [e / s for e in exps]
    return [round(probs[i] - (1.0 if i == target else 0.0), 4) for i in range(len(logits))]


print(softmax_ce_grad([1, 2, 3], 2))
`,
    },
    hints: [
      'First compute the stable softmax, then subtract the one-hot label.',
      'The gradient entries sum to zero because softmax sums to one and the one-hot sums to one.',
      'Only the true-class entry gets the minus-one correction.',
    ],
    tests: [
      { input: 'logits=[1,2,3], target=2', expected: '[0.09, 0.2447, -0.3348]' },
      { input: 'logits=[0,0], target=0', expected: '[-0.5, 0.5]' },
    ],
  },

  {
    slug: 'gumbel-softmax-sample',
    title: 'Gumbel-Softmax Sample',
    difficulty: 'medium',
    topic: 'Probability',
    category: 'Probability',
    statement: `The Gumbel-softmax produces a differentiable, near-discrete sample from a categorical distribution by adding Gumbel noise to the logits and applying a temperature-scaled softmax:

\\[ y_i = \\frac{\\exp\\big((z_i + g_i)/\\tau\\big)}{\\sum_j \\exp\\big((z_j + g_j)/\\tau\\big)}, \\]

where \\(g_i\\) are given Gumbel samples. As \\(\\tau \\to 0\\) the output approaches a one-hot vector. Return the sample rounded to four decimals.`,
    examples: [
      {
        input: 'logits = [1,1], gumbel = [0,0], temp = 1.0',
        output: '[0.5, 0.5]',
        explanation: 'Equal logits with zero noise give a uniform soft sample.',
      },
    ],
    starterCode: {
      python: `import math


def gumbel_softmax(logits, gumbel, temp=1.0):
    y = [(l + g) / temp for l, g in zip(logits, gumbel)]
    m = max(y)
    exps = [math.exp(v - m) for v in y]
    s = sum(exps)
    return [round(e / s, 4) for e in exps]


print(gumbel_softmax([1.0, 1.0], [0.0, 0.0], 1.0))
`,
    },
    hints: [
      'Add the Gumbel noise to the logits, divide by temperature, then softmax.',
      'A smaller temperature sharpens the output toward one-hot.',
      'Use the max-subtraction trick for a stable softmax.',
    ],
    tests: [
      { input: 'logits=[1,1], gumbel=[0,0], temp=1.0', expected: '[0.5, 0.5]' },
      { input: 'logits=[2,0], gumbel=[0,0], temp=1.0', expected: '[0.8808, 0.1192]' },
    ],
  },

  {
    slug: 'categorical-sampling',
    title: 'Categorical Sampling by Inverse CDF',
    difficulty: 'easy',
    topic: 'Probability',
    category: 'Probability',
    statement: `To sample a category from a probability vector with a single uniform draw \\(u \\in [0, 1)\\), walk the cumulative distribution and return the first index whose running total exceeds \\(u\\):

\\[ \\text{return } \\min\\{\\, i : \\textstyle\\sum_{j \\le i} p_j > u \\,\\}. \\]

This is the inverse-CDF (roulette-wheel) method. Return the sampled index.`,
    examples: [
      {
        input: 'probs = [0.2, 0.5, 0.3], u = 0.6',
        output: '1',
        explanation: 'Cumulative sums are 0.2, 0.7, 1.0; u=0.6 first lands inside the second bucket.',
      },
    ],
    starterCode: {
      python: `def categorical_sample(probs, u):
    c = 0.0
    for i, p in enumerate(probs):
        c += p
        if u < c:
            return i
    return len(probs) - 1


print(categorical_sample([0.2, 0.5, 0.3], 0.6))
print(categorical_sample([0.2, 0.5, 0.3], 0.1))
`,
    },
    hints: [
      'Accumulate the probabilities and stop at the first bucket that passes u.',
      'A larger bucket covers more of the [0,1) line, so it is chosen more often.',
      'The final fallback handles floating-point edge cases at u close to 1.',
    ],
    tests: [
      { input: 'probs=[0.2,0.5,0.3], u=0.6', expected: '1' },
      { input: 'probs=[0.2,0.5,0.3], u=0.1', expected: '0' },
    ],
  },

  // --------------------- Attention / Transformers -----------------------

  {
    slug: 'sdpa-with-mask',
    title: 'Scaled Dot-Product Attention with Mask',
    difficulty: 'medium',
    topic: 'Attention',
    category: 'Attention',
    statement: `For one query attending over keys and values, scaled dot-product attention scores each key, masks the disallowed positions to \\(-\\infty\\), softmaxes, and mixes the values:

\\[ s_j = \\frac{q \\cdot k_j}{\\sqrt{d}}, \\quad s_j \\leftarrow -\\infty \\text{ if masked}, \\quad w = \\mathrm{softmax}(s), \\quad o = \\sum_j w_j v_j. \\]

The mask is a list (1 = attend, 0 = block). Return the output vector rounded to four decimals.`,
    examples: [
      {
        input: 'q=[1,0], K=[[1,0],[0,1]], V=[[1,0],[0,1]], mask=[1,1]',
        output: '[0.6698, 0.3302]',
        explanation: 'Query aligns with the first key, so it weights the first value more heavily.',
      },
    ],
    starterCode: {
      python: `import math


def sdpa_masked(q, K, V, mask):
    d = len(q)
    scores = [sum(qi * ki for qi, ki in zip(q, k)) / math.sqrt(d) for k in K]
    scores = [s if m else -1e9 for s, m in zip(scores, mask)]
    mx = max(scores)
    exps = [math.exp(s - mx) for s in scores]
    total = sum(exps)
    w = [e / total for e in exps]
    out_dim = len(V[0])
    return [round(sum(w[j] * V[j][t] for j in range(len(V))), 4) for t in range(out_dim)]


print(sdpa_masked([1, 0], [[1, 0], [0, 1]], [[1.0, 0.0], [0.0, 1.0]], [1, 1]))
`,
    },
    hints: [
      'Divide the dot-product scores by sqrt of the key dimension before softmax.',
      'Masked positions get a large negative score so softmax sends them to zero.',
      'The output is the weighted average of value vectors.',
    ],
    tests: [
      { input: 'mask=[1,1]', expected: '[0.6698, 0.3302]' },
      { input: 'mask=[1,0]', expected: '[1.0, 0.0]' },
    ],
  },

  {
    slug: 'alibi-bias',
    title: 'ALiBi Attention Bias',
    difficulty: 'medium',
    topic: 'Attention',
    category: 'Attention',
    statement: `ALiBi replaces positional embeddings with a static, per-head linear bias added to the attention scores. The bias penalizes attending to distant positions in proportion to their distance:

\\[ \\text{bias}_{ij} = -\\,\\text{slope} \\cdot |i - j|. \\]

Build the full \\(n \\times n\\) bias matrix for a given head slope. Return it rounded to four decimals (use 0.0 on the diagonal, not -0.0).`,
    examples: [
      {
        input: 'n = 3, slope = 0.5',
        output: '[[0.0, -0.5, -1.0], [-0.5, 0.0, -0.5], [-1.0, -0.5, 0.0]]',
        explanation: 'Distance grows away from the diagonal; the slope scales the linear penalty.',
      },
    ],
    starterCode: {
      python: `def alibi_bias(n, slope):
    return [[(round(-slope * abs(i - j), 4) or 0.0) for j in range(n)] for i in range(n)]


print(alibi_bias(3, 0.5))
`,
    },
    hints: [
      'The bias depends only on the absolute distance between query and key positions.',
      'A steeper slope makes the model favor nearby tokens more aggressively.',
      'The diagonal distance is zero, so guard against printing -0.0.',
    ],
    tests: [
      { input: 'n=3, slope=0.5', expected: '[[0.0, -0.5, -1.0], [-0.5, 0.0, -0.5], [-1.0, -0.5, 0.0]]' },
      { input: 'n=2, slope=1.0', expected: '[[0.0, -1.0], [-1.0, 0.0]]' },
    ],
  },

  {
    slug: 'attention-dropout',
    title: 'Attention Weight Dropout',
    difficulty: 'easy',
    topic: 'Attention',
    category: 'Attention',
    statement: `Transformers apply dropout directly to the attention weights after softmax. Using inverted dropout, the kept weights are rescaled by \\(1/(1-p)\\) so the expected contribution is preserved:

\\[ w_i \\leftarrow \\frac{w_i \\cdot \\text{mask}_i}{1 - p}. \\]

Given softmax weights, a keep/drop mask, and drop probability \\(p\\), return the dropped-and-rescaled weights rounded to four decimals.`,
    examples: [
      {
        input: 'weights = [0.25, 0.25, 0.5], mask = [1, 0, 1], p = 0.5',
        output: '[0.5, 0.0, 1.0]',
        explanation: 'The dropped weight goes to zero; the survivors are doubled.',
      },
    ],
    starterCode: {
      python: `def attention_dropout(weights, mask, p=0.5):
    keep = 1 - p
    return [round(w * m / keep, 4) for w, m in zip(weights, mask)]


print(attention_dropout([0.25, 0.25, 0.5], [1, 0, 1], 0.5))
`,
    },
    hints: [
      'Apply the mask, then rescale by 1/(1-p) just like activation dropout.',
      'Dropout sits between the softmax and the value mixing.',
      'After dropout the weights no longer sum to one, and that is expected.',
    ],
    tests: [
      { input: 'weights=[0.25,0.25,0.5], mask=[1,0,1], p=0.5', expected: '[0.5, 0.0, 1.0]' },
      { input: 'weights=[0.5,0.5], mask=[1,1], p=0.0', expected: '[0.5, 0.5]' },
    ],
  },

  {
    slug: 'kv-cache-eviction',
    title: 'KV-Cache Sliding-Window Eviction',
    difficulty: 'easy',
    topic: 'LLMs',
    category: 'Attention',
    statement: `Long-context inference bounds memory by keeping only the most recent window of cached keys and values. Given the full ordered cache of keys and values and a window size \\(w\\), drop everything older than the last \\(w\\) entries and return the retained \\((\\text{keys}, \\text{values})\\) in order.`,
    examples: [
      {
        input: 'keys = [1,2,3,4], values = [10,20,30,40], w = 2',
        output: '([3, 4], [30, 40])',
        explanation: 'Only the two most recent entries survive the eviction.',
      },
    ],
    starterCode: {
      python: `def kv_cache_evict(keys, values, w):
    return (keys[-w:], values[-w:])


print(kv_cache_evict([1, 2, 3, 4], [10, 20, 30, 40], 2))
`,
    },
    hints: [
      'Slicing the last w entries keeps the newest tokens.',
      'Keys and values must be evicted together to stay aligned.',
      'A window larger than the cache simply keeps everything.',
    ],
    tests: [
      { input: 'keys=[1,2,3,4], values=[10,20,30,40], w=2', expected: '([3, 4], [30, 40])' },
      { input: 'keys=[1,2], values=[5,6], w=5', expected: '([1, 2], [5, 6])' },
    ],
  },

  // ------------------------------- Metrics ------------------------------

  {
    slug: 'top-k-accuracy',
    title: 'Top-k Accuracy',
    difficulty: 'easy',
    topic: 'Evaluation',
    category: 'Metrics',
    statement: `Top-\\(k\\) accuracy counts a prediction correct if the true label appears among the \\(k\\) highest-scoring classes. For each example, take the indices of the \\(k\\) largest logits and check membership:

\\[ \\text{acc}@k = \\frac{1}{N}\\sum_{i=1}^{N} \\mathbb{1}\\big[y_i \\in \\text{top-}k(\\text{logits}_i)\\big]. \\]

Return the accuracy rounded to four decimals.`,
    examples: [
      {
        input: 'logits = [[0.1,0.5,0.4],[0.9,0.05,0.05]], labels = [2,1], k = 2',
        output: '1.0',
        explanation: 'Label 2 is in the top-2 of the first row; label 1 is in the top-2 of the second.',
      },
    ],
    starterCode: {
      python: `def top_k_accuracy(logits_list, labels, k):
    correct = 0
    for logits, y in zip(logits_list, labels):
        top = sorted(range(len(logits)), key=lambda i: -logits[i])[:k]
        if y in top:
            correct += 1
    return round(correct / len(labels), 4)


print(top_k_accuracy([[0.1, 0.5, 0.4], [0.9, 0.05, 0.05]], [2, 1], 2))
`,
    },
    hints: [
      'Rank the class indices by descending logit and slice the first k.',
      'A hit means the true label is anywhere in that top-k set.',
      'Top-1 accuracy is the special case k=1.',
    ],
    tests: [
      { input: 'logits=[[0.1,0.5,0.4],[0.9,0.05,0.05]], labels=[2,1], k=2', expected: '1.0' },
      { input: 'logits=[[0.1,0.5,0.4]], labels=[0], k=1', expected: '0.0' },
    ],
  },

  {
    slug: 'mean-average-precision',
    title: 'Mean Average Precision',
    difficulty: 'hard',
    topic: 'Evaluation',
    category: 'Metrics',
    statement: `Average precision averages the precision values measured at each relevant item in a ranked list; mean average precision (mAP) averages that over queries. For one query with binary relevances in ranked order:

\\[ \\text{AP} = \\frac{1}{R}\\sum_{i:\\,\\text{rel}_i = 1} \\frac{\\#\\{\\text{relevant} \\le i\\}}{i}, \\]

where \\(R\\) is the total number of relevant items. Return the mAP over all query lists, rounded to four decimals.`,
    examples: [
      {
        input: 'queries = [[1,0,1],[0,1,1]]',
        output: '0.7083',
        explanation: 'First query AP = (1/1 + 2/3)/2 ~ 0.8333; second = (1/2 + 2/3)/2 ~ 0.5833; mean ~ 0.7083.',
      },
    ],
    starterCode: {
      python: `def average_precision(relevances):
    hits = 0
    total = 0.0
    for i, r in enumerate(relevances):
        if r:
            hits += 1
            total += hits / (i + 1)
    return total / hits if hits else 0.0


def mean_average_precision(queries):
    return round(sum(average_precision(q) for q in queries) / len(queries), 4)


print(mean_average_precision([[1, 0, 1], [0, 1, 1]]))
`,
    },
    hints: [
      'Precision at a relevant item is (relevant seen so far) / (rank position).',
      'Average those precision values only at the relevant positions.',
      'mAP is the mean of per-query average precision.',
    ],
    tests: [
      { input: 'queries=[[1,0,1],[0,1,1]]', expected: '0.7083' },
      { input: 'queries=[[1,1,1]]', expected: '1.0' },
    ],
  },

  {
    slug: 'bleu-unigram',
    title: 'Unigram BLEU Precision',
    difficulty: 'medium',
    topic: 'Evaluation',
    category: 'Metrics',
    statement: `Unigram BLEU measures how many candidate words appear in the reference, but clips each word's count by how often it occurs in the reference so repetition cannot be gamed:

\\[ p_1 = \\frac{\\sum_{w} \\min\\big(\\text{count}_{\\text{cand}}(w),\\ \\text{count}_{\\text{ref}}(w)\\big)}{\\sum_{w} \\text{count}_{\\text{cand}}(w)}. \\]

Return the clipped unigram precision rounded to four decimals.`,
    examples: [
      {
        input: "candidate = ['the','cat','sat'], reference = ['the','cat','is','here']",
        output: '0.6667',
        explanation: "'the' and 'cat' match; 'sat' does not, giving 2 out of 3.",
      },
    ],
    starterCode: {
      python: `from collections import Counter


def bleu_unigram(candidate, reference):
    if not candidate:
        return 0.0
    cc = Counter(candidate)
    rc = Counter(reference)
    clipped = sum(min(cc[w], rc[w]) for w in cc)
    return round(clipped / len(candidate), 4)


print(bleu_unigram(['the', 'cat', 'sat'], ['the', 'cat', 'is', 'here']))
`,
    },
    hints: [
      'Clip each candidate word count by its reference count before summing.',
      'Divide by the candidate length, not the reference length.',
      'Clipping is what stops a candidate of all "the" from scoring perfectly.',
    ],
    tests: [
      { input: "cand=['the','cat','sat'], ref=['the','cat','is','here']", expected: '0.6667' },
      { input: "cand=['the','the','the'], ref=['the','cat']", expected: '0.3333' },
    ],
  },

  {
    slug: 'perplexity-from-logits',
    title: 'Perplexity from Logits',
    difficulty: 'medium',
    topic: 'Evaluation',
    category: 'Metrics',
    statement: `Perplexity is the exponential of the average negative log-likelihood a model assigns to the true tokens — lower is better, and a perplexity of \\(V\\) means the model is as uncertain as a uniform guess over \\(V\\) options. Given per-position logits and the true token indices:

\\[ \\text{PPL} = \\exp\\!\\Big(\\frac{1}{T}\\sum_{t=1}^{T} -\\log \\mathrm{softmax}(\\text{logits}_t)_{y_t}\\Big). \\]

Return perplexity rounded to four decimals.`,
    examples: [
      {
        input: 'logits = [[0,0],[0,0]], targets = [0, 1]',
        output: '2.0',
        explanation: 'Uniform logits give probability 0.5 to each token, so perplexity equals 2.',
      },
    ],
    starterCode: {
      python: `import math


def perplexity(logits_seq, targets):
    nll = 0.0
    for logits, t in zip(logits_seq, targets):
        m = max(logits)
        exps = [math.exp(z - m) for z in logits]
        s = sum(exps)
        p = exps[t] / s
        nll += -math.log(p)
    return round(math.exp(nll / len(targets)), 4)


print(perplexity([[0, 0], [0, 0]], [0, 1]))
`,
    },
    hints: [
      'Softmax each logit vector, take the probability of the true token, accumulate negative log.',
      'Average the negative log-likelihood over tokens before exponentiating.',
      'Perplexity equal to the vocabulary size means a uniform, uninformed model.',
    ],
    tests: [
      { input: 'logits=[[0,0],[0,0]], targets=[0,1]', expected: '2.0' },
      { input: 'logits=[[1,2,3]], targets=[2]', expected: '1.5032' },
    ],
  },

  // ----------------------------- Convolutions ---------------------------

  {
    slug: 'conv-output-size',
    title: 'Strided Convolution Output Size',
    difficulty: 'easy',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `The spatial size of a convolution output follows a single formula in terms of input length \\(n\\), kernel size \\(k\\), stride \\(s\\), and padding \\(p\\):

\\[ \\text{out} = \\left\\lfloor \\frac{n + 2p - k}{s} \\right\\rfloor + 1. \\]

Return the integer output length for a 1-D (or per-axis) convolution.`,
    examples: [
      {
        input: 'n = 7, k = 3, stride = 2, pad = 0',
        output: '3',
        explanation: 'floor((7 - 3)/2) + 1 = floor(2) + 1 = 3.',
      },
    ],
    starterCode: {
      python: `def conv_output_size(n, k, stride, pad=0):
    return (n + 2 * pad - k) // stride + 1


print(conv_output_size(7, 3, 2, 0))
print(conv_output_size(8, 3, 2, 1))
`,
    },
    hints: [
      'Padding adds 2p to the effective input length.',
      'Integer-divide by the stride, then add one for the final window.',
      'Stride 1 with no padding shrinks the length by exactly k-1.',
    ],
    tests: [
      { input: 'n=7, k=3, stride=2, pad=0', expected: '3' },
      { input: 'n=8, k=3, stride=2, pad=1', expected: '4' },
    ],
  },

  {
    slug: 'transposed-conv-size',
    title: 'Transposed Convolution Output Size',
    difficulty: 'easy',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `Transposed convolution (deconvolution) upsamples, so its output-size formula inverts the forward one. With input length \\(n\\), kernel \\(k\\), stride \\(s\\), padding \\(p\\), and output padding \\(p_o\\):

\\[ \\text{out} = (n - 1)\\,s - 2p + k + p_o. \\]

Return the integer output length.`,
    examples: [
      {
        input: 'n = 3, k = 3, stride = 2, pad = 0, out_pad = 0',
        output: '7',
        explanation: '(3-1)*2 - 0 + 3 + 0 = 7, roughly doubling the input.',
      },
    ],
    starterCode: {
      python: `def transposed_conv_size(n, k, stride, pad=0, out_pad=0):
    return (n - 1) * stride - 2 * pad + k + out_pad


print(transposed_conv_size(3, 3, 2, 0, 0))
print(transposed_conv_size(4, 2, 2, 0, 0))
`,
    },
    hints: [
      'This formula is the algebraic inverse of the forward convolution size.',
      'Stride here spreads the inputs apart, increasing the output length.',
      'Output padding nudges the size up by one to disambiguate stride collisions.',
    ],
    tests: [
      { input: 'n=3, k=3, stride=2, pad=0, out_pad=0', expected: '7' },
      { input: 'n=4, k=2, stride=2, pad=0, out_pad=0', expected: '8' },
    ],
  },

  {
    slug: 'depthwise-conv-1d',
    title: 'Depthwise 1-D Convolution',
    difficulty: 'medium',
    topic: 'Convolutions',
    category: 'Convolutions',
    statement: `A depthwise convolution applies one independent filter per channel instead of mixing channels, which is the cheap core of MobileNet-style blocks. Given \\(C\\) input channels (each a length-\\(L\\) signal) and one kernel per channel, convolve each channel with its own kernel (valid, stride 1):

\\[ y_{c,i} = \\sum_{j} x_{c,\\,i+j}\\, k_{c,j}. \\]

Return the list of per-channel output signals, values rounded to four decimals.`,
    examples: [
      {
        input: 'x = [[1,2,3,4],[1,1,1,1]], kernels = [[1,0],[1,1]]',
        output: '[[1.0, 2.0, 3.0], [2.0, 2.0, 2.0]]',
        explanation: 'Channel 0 picks the left element of each pair; channel 1 sums adjacent pairs.',
      },
    ],
    starterCode: {
      python: `def depthwise_conv1d(x, kernels):
    out = []
    for c in range(len(x)):
        k = kernels[c]
        ksz = len(k)
        L = len(x[c])
        row = [round(float(sum(x[c][i + j] * k[j] for j in range(ksz))), 4)
               for i in range(L - ksz + 1)]
        out.append(row)
    return out


print(depthwise_conv1d([[1, 2, 3, 4], [1, 1, 1, 1]], [[1, 0], [1, 1]]))
`,
    },
    hints: [
      'Each channel uses only its own kernel; channels never interact.',
      'Valid convolution gives output length L - k + 1.',
      'Depthwise conv is far cheaper than a full conv because it skips channel mixing.',
    ],
    tests: [
      { input: 'x=[[1,2,3,4],[1,1,1,1]], kernels=[[1,0],[1,1]]', expected: '[[1.0, 2.0, 3.0], [2.0, 2.0, 2.0]]' },
      { input: 'x=[[2,2,2]], kernels=[[1,1]]', expected: '[[4.0, 4.0]]' },
    ],
  },

  {
    slug: 'color-to-grayscale',
    title: 'RGB to Grayscale',
    difficulty: 'easy',
    topic: 'Computer Vision',
    category: 'Computer Vision',
    statement: `A colour image stores three channels per pixel — red, green, and blue. To collapse it to a single intensity channel, you do not simply average them: the human eye is far more sensitive to green than to red or blue. The standard luminance weighting reflects this:

\\[ Y = 0.299\\,R + 0.587\\,G + 0.114\\,B. \\]

Given an \\(H \\times W \\times 3\\) image as nested lists of integers in \\([0, 255]\\), compute \\(Y\\) for every pixel and round to the nearest integer. Return the \\(H \\times W\\) grayscale image.`,
    examples: [
      {
        input: 'image = [[[255,0,0],[0,255,0]],[[0,0,255],[255,255,255]]]',
        output: '[[76, 150], [29, 255]]',
        explanation: 'Pure green (150) reads far brighter than pure red (76) or blue (29); white stays 255.',
      },
      {
        input: 'image = [[[0,0,0]],[[100,150,200]]]',
        output: '[[0], [141]]',
        explanation: 'Black maps to 0; the mixed pixel weights green most heavily.',
      },
    ],
    starterCode: {
      python: `def rgb_to_grayscale(image):
    out = []
    for row in image:
        out.append([round(0.299 * r + 0.587 * g + 0.114 * b) for (r, g, b) in row])
    return out


print(rgb_to_grayscale([[[255, 0, 0], [0, 255, 0]], [[0, 0, 255], [255, 255, 255]]]))
`,
    },
    hints: [
      'Apply the weighting to each pixel independently; the channels do not interact across pixels.',
      'Green carries the largest weight, so a pure-green pixel is brighter than pure red or blue.',
      'Round the weighted sum to the nearest integer rather than truncating.',
    ],
    tests: [
      { input: 'image=[[[255,255,255]]]', expected: '[[255]]' },
      { input: 'image=[[[10,20,30],[40,50,60]]]', expected: '[[18, 48]]' },
      { input: 'image=[[[0,0,0],[255,0,0]],[[0,255,0],[0,0,255]]]', expected: '[[0, 76], [150, 29]]' },
    ],
  },

  {
    slug: 'bilinear-interpolation',
    title: 'Bilinear Interpolation',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Computer Vision',
    statement: `When you resize or warp an image, the sampled coordinates rarely land exactly on a pixel. Bilinear interpolation estimates the value at a fractional location by blending the four surrounding integer-grid points.

Let \\((r_0, c_0)\\) be the floor of the query \\((r, c)\\), with fractional offsets \\(\\Delta r, \\Delta c\\). Interpolate first along the columns of the top and bottom rows, then between those two results:

\\[ v = (1-\\Delta r)\\big[(1-\\Delta c)\\,g_{r_0,c_0} + \\Delta c\\,g_{r_0,c_1}\\big] + \\Delta r\\big[(1-\\Delta c)\\,g_{r_1,c_0} + \\Delta c\\,g_{r_1,c_1}\\big]. \\]

Clamp neighbour indices to the grid edge. Return the interpolated value rounded to three decimals.`,
    examples: [
      {
        input: 'grid = [[0,10],[20,30]], row = 0.5, col = 0.5',
        output: '15.0',
        explanation: 'The exact centre of the four corners is their average: (0+10+20+30)/4 = 15.',
      },
      {
        input: 'grid = [[1,2],[3,4]], row = 0.0, col = 0.5',
        output: '1.5',
        explanation: 'On the top row only, the result is the midpoint of 1 and 2.',
      },
    ],
    starterCode: {
      python: `import math


def bilinear_interpolate(grid, row, col):
    r0 = int(math.floor(row))
    c0 = int(math.floor(col))
    r1 = min(r0 + 1, len(grid) - 1)
    c1 = min(c0 + 1, len(grid[0]) - 1)
    dr = row - r0
    dc = col - c0
    top = grid[r0][c0] * (1 - dc) + grid[r0][c1] * dc
    bot = grid[r1][c0] * (1 - dc) + grid[r1][c1] * dc
    return round(top * (1 - dr) + bot * dr, 3)


print(bilinear_interpolate([[0, 10], [20, 30]], 0.5, 0.5))
print(bilinear_interpolate([[1, 2], [3, 4]], 0.0, 0.5))
`,
    },
    hints: [
      'Floor the coordinate to find the top-left neighbour, then take the fractional parts as blend weights.',
      'Interpolate across columns twice (top and bottom rows), then interpolate those two values across rows.',
      'Clamp the +1 neighbour indices so a query on the last row or column does not run off the grid.',
    ],
    tests: [
      { input: 'grid=[[0,10],[20,30]], row=0.5, col=0.5', expected: '15.0' },
      { input: 'grid=[[0,0],[0,4]], row=0.25, col=0.75', expected: '0.75' },
      { input: 'grid=[[5,5],[5,5]], row=0.3, col=0.7', expected: '5.0' },
    ],
  },

  {
    slug: 'conv2d-image-filtering',
    title: '2D Convolution Image Filter',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Convolutions',
    statement: `Convolutional filters slide a small kernel across an image, computing a weighted sum of the pixels under it at every position. This is how edge detectors, blurs, and sharpening filters work.

Use *cross-correlation* (the convention deep-learning frameworks call convolution): place the kernel without flipping it. With 'valid' padding the kernel must fit entirely inside the image, so a \\(K \\times K\\) kernel over an \\(H \\times W\\) image yields an \\((H-K+1) \\times (W-K+1)\\) output where

\\[ \\text{out}_{i,j} = \\sum_{u}\\sum_{v} \\text{image}_{i+u,\\,j+v}\\;\\text{kernel}_{u,v}. \\]

Return the filtered output, rounding any non-integer result to two decimals.`,
    examples: [
      {
        input: 'image = [[1,2,3],[4,5,6],[7,8,9]], kernel = [[1,0],[0,1]]',
        output: '[[6.0, 8.0], [12.0, 14.0]]',
        explanation: 'This kernel sums each top-left and bottom-right diagonal pair, e.g. 1+5 = 6.',
      },
      {
        input: 'image = 3x3 of ones, kernel = 3x3 of ones',
        output: '[[9.0]]',
        explanation: 'A single valid position sums all nine ones to 9.',
      },
    ],
    starterCode: {
      python: `def conv2d(image, kernel):
    H, W = len(image), len(image[0])
    kh, kw = len(kernel), len(kernel[0])
    out = []
    for i in range(H - kh + 1):
        row = []
        for j in range(W - kw + 1):
            s = 0.0
            for u in range(kh):
                for v in range(kw):
                    s += image[i + u][j + v] * kernel[u][v]
            row.append(round(s, 2))
        out.append(row)
    return out


print(conv2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[1, 0], [0, 1]]))
print(conv2d([[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]]))
`,
    },
    hints: [
      'Cross-correlation does not flip the kernel — index the image and kernel in the same direction.',
      'With valid padding the output shrinks: an H by W image and K by K kernel give (H-K+1) by (W-K+1).',
      'Accumulate the elementwise product of the kernel and the patch it currently overlaps.',
    ],
    tests: [
      { input: 'image=[[1,2,3],[4,5,6],[7,8,9]], kernel=[[1,0],[0,1]]', expected: '[[6.0, 8.0], [12.0, 14.0]]' },
      { input: 'image=[[1,2,3,4],[5,6,7,8]], kernel=[[1,1]]', expected: '[[3.0, 5.0, 7.0], [11.0, 13.0, 15.0]]' },
      { input: 'image=[[1,2],[3,4]], kernel=[[0.5,0.5],[0.5,0.5]]', expected: '[[5.0]]' },
    ],
  },

  {
    slug: 'maxpool-forward',
    title: 'Max Pooling Forward Pass',
    difficulty: 'easy',
    topic: 'Computer Vision',
    category: 'Convolutions',
    statement: `Max pooling downsamples a feature map by keeping only the strongest activation in each small region. It shrinks the spatial size and grants a little translation invariance — a feature counts whether it sits at the top or bottom of its window.

Apply \\(2 \\times 2\\) pooling with stride \\(2\\) over a 2D image (dimensions are even, so the windows tile perfectly). Each output cell is the maximum of its non-overlapping \\(2 \\times 2\\) block:

\\[ \\text{out}_{i,j} = \\max\\big(\\text{img}_{2i,2j},\\, \\text{img}_{2i,2j+1},\\, \\text{img}_{2i+1,2j},\\, \\text{img}_{2i+1,2j+1}\\big). \\]

Return the pooled image, half the height and half the width.`,
    examples: [
      {
        input: 'image = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]',
        output: '[[6, 8], [14, 16]]',
        explanation: 'Each 2x2 block keeps its largest entry, e.g. max(1,2,5,6) = 6.',
      },
      {
        input: 'image = [[1,0],[0,1]]',
        output: '[[1]]',
        explanation: 'A single 2x2 block reduces to its maximum, 1.',
      },
    ],
    starterCode: {
      python: `def maxpool2x2(image):
    H, W = len(image), len(image[0])
    out = []
    for i in range(0, H, 2):
        row = []
        for j in range(0, W, 2):
            window = [image[i + u][j + v] for u in range(2) for v in range(2)]
            row.append(max(window))
        out.append(row)
    return out


print(maxpool2x2([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]))
print(maxpool2x2([[1, 0], [0, 1]]))
`,
    },
    hints: [
      'Step the row and column indices by 2 so the windows never overlap.',
      'Each output cell is the maximum of exactly four input values.',
      'The output is half the height and half the width of the input.',
    ],
    tests: [
      { input: 'image=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]', expected: '[[6, 8], [14, 16]]' },
      { input: 'image=[[1,0],[0,1]]', expected: '[[1]]' },
      { input: 'image=[[4,3,2,1],[3,2,1,0]]', expected: '[[4, 2]]' },
    ],
  },

  {
    slug: 'max-pooling-2d',
    title: 'Max Pooling 2D with Stride',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Convolutions',
    statement: `Generalise max pooling to an arbitrary window size and stride. The window is \\(K \\times K\\); the stride controls how far it hops between positions. When the stride is smaller than the window the pooled regions overlap; when it equals the window they tile.

With 'valid' coverage the window must fit fully inside the image, so it starts only at positions \\(i, j\\) where \\(i + K \\le H\\) and \\(j + K \\le W\\). Each output cell is

\\[ \\text{out} = \\max_{0 \\le u, v < K} \\text{img}_{i+u,\\,j+v}. \\]

Return the pooled 2D list.`,
    examples: [
      {
        input: 'image = [[1,2,3],[4,5,6],[7,8,9]], size = 2, stride = 1',
        output: '[[5, 6], [8, 9]]',
        explanation: 'Stride 1 overlaps the windows; the bottom-right of each 2x2 block is the max.',
      },
      {
        input: 'image = 4x4 counting grid, size = 2, stride = 2',
        output: '[[6, 8], [14, 16]]',
        explanation: 'Stride equal to the window reduces to non-overlapping 2x2 pooling.',
      },
    ],
    starterCode: {
      python: `def max_pool_2d(image, size, stride):
    H, W = len(image), len(image[0])
    out = []
    i = 0
    while i + size <= H:
        row = []
        j = 0
        while j + size <= W:
            window = [image[i + u][j + v] for u in range(size) for v in range(size)]
            row.append(max(window))
            j += stride
        out.append(row)
        i += stride
    return out


print(max_pool_2d([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 2, 1))
print(max_pool_2d([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]], 2, 2))
`,
    },
    hints: [
      'Advance the window start by the stride, not by one, after each position.',
      'Only start a window where the full K by K block stays inside the image (valid coverage).',
      'When the stride matches the window size the result is plain non-overlapping pooling.',
    ],
    tests: [
      { input: 'image=[[1,2,3],[4,5,6],[7,8,9]], size=2, stride=1', expected: '[[5, 6], [8, 9]]' },
      { input: 'image=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]], size=2, stride=2', expected: '[[6, 8], [14, 16]]' },
      { input: 'image=[[1,2,3,4,5]], size=1, stride=2', expected: '[[1, 3, 5]]' },
    ],
  },

  {
    slug: 'global-avg-pooling',
    title: 'Global Average Pooling',
    difficulty: 'easy',
    topic: 'Computer Vision',
    category: 'Convolutions',
    statement: `Global average pooling collapses each channel of a feature map to a single number — its mean activation. Modern classifiers use it in place of a flattening layer: it has no parameters and is robust to the spatial size of the input.

Given a \\(C \\times H \\times W\\) tensor represented as a list of \\(C\\) two-dimensional channels, compute the mean of every channel:

\\[ \\bar{a}_c = \\frac{1}{H W} \\sum_{i,j} a_{c,i,j}. \\]

Return a length-\\(C\\) list of channel means, each rounded to three decimals.`,
    examples: [
      {
        input: 'tensor = [[[1,2],[3,4]], [[10,10],[10,10]]]',
        output: '[2.5, 10.0]',
        explanation: 'Channel 0 averages 1,2,3,4 to 2.5; channel 1 is constant 10.',
      },
      {
        input: 'tensor = [[[1,1,1]]]',
        output: '[1.0]',
        explanation: 'A single channel of all ones averages to 1.0.',
      },
    ],
    starterCode: {
      python: `def global_avg_pool(tensor):
    out = []
    for channel in tensor:
        total = sum(sum(row) for row in channel)
        count = sum(len(row) for row in channel)
        out.append(round(total / count, 3))
    return out


print(global_avg_pool([[[1, 2], [3, 4]], [[10, 10], [10, 10]]]))
print(global_avg_pool([[[1, 1, 1]]]))
`,
    },
    hints: [
      'Treat each channel independently — the output length equals the number of channels.',
      'Sum every value in a channel and divide by its total number of elements.',
      'Global pooling has no learnable weights; it is just a mean over space.',
    ],
    tests: [
      { input: 'tensor=[[[1,2],[3,4]], [[10,10],[10,10]]]', expected: '[2.5, 10.0]' },
      { input: 'tensor=[[[0,0],[0,0]]]', expected: '[0.0]' },
      { input: 'tensor=[[[1,2,3]], [[4,5,6]], [[7,8,9]]]', expected: '[2.0, 5.0, 8.0]' },
    ],
  },

  {
    slug: 'simple-cnn-layer',
    title: 'Single Conv Layer Forward',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Convolutions',
    statement: `Assemble the three pieces a single convolutional unit applies at every spatial position: a \\(K \\times K\\) filter, a bias, and a ReLU non-linearity.

For each valid window, take the cross-correlation of the filter with the patch, add the bias, then clamp negatives to zero:

\\[ \\text{out}_{i,j} = \\max\\!\\Big(0,\\; b + \\sum_{u}\\sum_{v} \\text{img}_{i+u,\\,j+v}\\,K_{u,v}\\Big). \\]

This is exactly what one feature channel of a conv layer computes. Return the activated output, rounding to two decimals.`,
    examples: [
      {
        input: 'image = [[1,2,3],[4,5,6],[7,8,9]], kernel = [[1,1],[1,1]], bias = -10',
        output: '[[2.0, 6.0], [14.0, 18.0]]',
        explanation: 'Each 2x2 block sums to 12,16,24,28; subtracting 10 and applying ReLU leaves 2,6,14,18.',
      },
      {
        input: 'image = [[1,1],[1,1]], kernel = [[1,1],[1,1]], bias = -5',
        output: '[[0.0]]',
        explanation: 'The window sums to 4; with bias -5 the pre-activation is -1, which ReLU clips to 0.',
      },
    ],
    starterCode: {
      python: `def conv_layer(image, kernel, bias):
    H, W = len(image), len(image[0])
    kh, kw = len(kernel), len(kernel[0])
    out = []
    for i in range(H - kh + 1):
        row = []
        for j in range(W - kw + 1):
            s = 0.0
            for u in range(kh):
                for v in range(kw):
                    s += image[i + u][j + v] * kernel[u][v]
            s += bias
            row.append(round(max(0.0, s), 2))
        out.append(row)
    return out


print(conv_layer([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[1, 1], [1, 1]], -10.0))
print(conv_layer([[1, 1], [1, 1]], [[1, 1], [1, 1]], -5.0))
`,
    },
    hints: [
      'Compute the cross-correlation first, then add the bias, then apply ReLU — order matters.',
      'ReLU is just max(0, x); it zeros out every negative pre-activation.',
      'The bias shifts every output cell uniformly before the non-linearity.',
    ],
    tests: [
      { input: 'image=[[1,2,3],[4,5,6],[7,8,9]], kernel=[[1,1],[1,1]], bias=-10', expected: '[[2.0, 6.0], [14.0, 18.0]]' },
      { input: 'image=[[1,1],[1,1]], kernel=[[1,1],[1,1]], bias=-5', expected: '[[0.0]]' },
      { input: 'image=[[2,2,2],[2,2,2]], kernel=[[0.5,0.5]], bias=1', expected: '[[3.0, 3.0], [3.0, 3.0]]' },
    ],
  },

  {
    slug: 'iou-bounding-box',
    title: 'IoU of Bounding Boxes',
    difficulty: 'easy',
    topic: 'Computer Vision',
    category: 'Computer Vision',
    statement: `Intersection over Union measures how well two boxes overlap. Object detectors use it to decide whether a predicted box matches a ground-truth box and to suppress duplicate detections.

Each box is axis-aligned, given as \\([x_1, y_1, x_2, y_2]\\) with \\(x_1 < x_2\\) and \\(y_1 < y_2\\). The intersection is the overlapping rectangle (zero area if they miss each other), and

\\[ \\text{IoU} = \\frac{\\text{area of intersection}}{\\text{area of union}} = \\frac{I}{A + B - I}. \\]

Return the IoU rounded to three decimals; non-overlapping boxes score \\(0.0\\).`,
    examples: [
      {
        input: 'box_a = [0,0,2,2], box_b = [1,1,3,3]',
        output: '0.143',
        explanation: 'Overlap area 1, areas 4 and 4, union 7, so IoU = 1/7 = 0.143.',
      },
      {
        input: 'box_a = [0,0,1,1], box_b = [2,2,3,3]',
        output: '0.0',
        explanation: 'The boxes do not touch, so the intersection is empty and IoU is 0.',
      },
    ],
    starterCode: {
      python: `def iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter
    if union == 0:
        return 0.0
    return round(inter / union, 3)


print(iou([0, 0, 2, 2], [1, 1, 3, 3]))
print(iou([0, 0, 1, 1], [2, 2, 3, 3]))
`,
    },
    hints: [
      'The intersection rectangle uses the max of the left/top edges and the min of the right/bottom edges.',
      'Clamp the intersection width and height to zero so disjoint boxes contribute no area.',
      'The union is areaA + areaB minus the intersection — do not double-count the overlap.',
    ],
    tests: [
      { input: 'box_a=[0,0,2,2], box_b=[1,1,3,3]', expected: '0.143' },
      { input: 'box_a=[0,0,1,1], box_b=[2,2,3,3]', expected: '0.0' },
      { input: 'box_a=[0,0,4,4], box_b=[0,0,2,2]', expected: '0.25' },
    ],
  },

  {
    slug: 'anchor-box-generation',
    title: 'Anchor Box Generation',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Computer Vision',
    statement: `Detectors like Faster R-CNN and SSD do not predict boxes from scratch; they refine a fixed set of reference *anchors* placed across the image. At each location you generate one anchor per (scale, aspect-ratio) pair.

Given a base size, a list of scales, and a list of aspect ratios \\(\\rho = w/h\\), build each anchor's width and height as

\\[ w = \\text{base}\\cdot\\text{scale}\\cdot\\sqrt{\\rho}, \\qquad h = \\frac{\\text{base}\\cdot\\text{scale}}{\\sqrt{\\rho}}. \\]

Centre every anchor at the origin, so its corners are \\([-w/2, -h/2, w/2, h/2]\\). Iterate scales in the outer loop and ratios in the inner loop. Round every coordinate to two decimals and return the list of boxes.`,
    examples: [
      {
        input: 'base = 16, scales = [1], ratios = [1, 2]',
        output: '[[-8.0, -8.0, 8.0, 8.0], [-11.31, -5.66, 11.31, 5.66]]',
        explanation: 'Ratio 1 gives a 16x16 square; ratio 2 stretches width and shrinks height while keeping area.',
      },
      {
        input: 'base = 10, scales = [1, 2], ratios = [1]',
        output: '[[-5.0, -5.0, 5.0, 5.0], [-10.0, -10.0, 10.0, 10.0]]',
        explanation: 'A square ratio at two scales produces a 10x10 and a 20x20 box.',
      },
    ],
    starterCode: {
      python: `import math


def generate_anchors(base, scales, ratios):
    anchors = []
    for scale in scales:
        for ratio in ratios:
            w = base * scale * math.sqrt(ratio)
            h = base * scale / math.sqrt(ratio)
            anchors.append([round(-w / 2, 2), round(-h / 2, 2),
                            round(w / 2, 2), round(h / 2, 2)])
    return anchors


print(generate_anchors(16, [1], [1, 2]))
print(generate_anchors(10, [1, 2], [1]))
`,
    },
    hints: [
      'The aspect ratio splits as sqrt: width multiplies by sqrt(ratio), height divides by it.',
      'Centring at the origin means the corners are symmetric: -w/2, -h/2, w/2, h/2.',
      'Loop scales on the outside and ratios on the inside to match the expected ordering.',
    ],
    tests: [
      { input: 'base=16, scales=[1], ratios=[1,2]', expected: '[[-8.0, -8.0, 8.0, 8.0], [-11.31, -5.66, 11.31, 5.66]]' },
      { input: 'base=10, scales=[1,2], ratios=[1]', expected: '[[-5.0, -5.0, 5.0, 5.0], [-10.0, -10.0, 10.0, 10.0]]' },
      { input: 'base=4, scales=[1], ratios=[0.5]', expected: '[[-1.41, -2.83, 1.41, 2.83]]' },
    ],
  },

  {
    slug: 'morphological-operations',
    title: 'Binary Erosion and Dilation',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Computer Vision',
    statement: `Morphological operations reshape the foreground of a binary image by probing it with a small structuring element. With a full \\(3 \\times 3\\) element centred on each pixel:

- **Erosion** keeps a pixel set only if *every* cell in its \\(3 \\times 3\\) neighbourhood is \\(1\\). This shrinks blobs and removes thin spurs.
- **Dilation** sets a pixel if *any* cell in its neighbourhood is \\(1\\). This grows blobs and fills small gaps.

Treat positions that fall outside the image as \\(0\\). Write \\(\\text{op}(image, mode)\\) with \\(mode \\in \\{\\text{'erode'}, \\text{'dilate'}\\}\\) and return the resulting 2D list.`,
    examples: [
      {
        input: "image = [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], mode = 'erode'",
        output: '[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]',
        explanation: 'No pixel has a fully-1 neighbourhood, so erosion wipes it out.',
      },
      {
        input: "same image, mode = 'dilate'",
        output: '[[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]',
        explanation: 'Every pixel sits within one step of the central block, so dilation fills the whole grid.',
      },
    ],
    starterCode: {
      python: `def morphology(image, mode):
    H, W = len(image), len(image[0])

    def get(r, c):
        if 0 <= r < H and 0 <= c < W:
            return image[r][c]
        return 0

    out = []
    for i in range(H):
        row = []
        for j in range(W):
            window = [get(i + u, j + v) for u in (-1, 0, 1) for v in (-1, 0, 1)]
            if mode == 'erode':
                row.append(1 if all(x == 1 for x in window) else 0)
            else:
                row.append(1 if any(x == 1 for x in window) else 0)
        out.append(row)
    return out


img = [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]]
print(morphology(img, 'erode'))
print(morphology(img, 'dilate'))
`,
    },
    hints: [
      'Erosion uses all() over the 3x3 window; dilation uses any() over the same window.',
      'Out-of-bounds neighbours count as 0, which makes erosion aggressive near the borders.',
      'The window always includes the centre pixel plus its eight neighbours.',
    ],
    tests: [
      { input: "image=[[1,1,1],[1,1,1],[1,1,1]], mode='erode'", expected: '[[0, 0, 0], [0, 1, 0], [0, 0, 0]]' },
      { input: "image=[[0,0,0],[0,1,0],[0,0,0]], mode='dilate'", expected: '[[1, 1, 1], [1, 1, 1], [1, 1, 1]]' },
      { input: "image=[[0,0,0],[0,1,0],[0,0,0]], mode='erode'", expected: '[[0, 0, 0], [0, 0, 0], [0, 0, 0]]' },
    ],
  },

  {
    slug: 'dice-loss',
    title: 'Dice Loss',
    difficulty: 'medium',
    topic: 'Computer Vision',
    category: 'Losses',
    statement: `Segmentation models are often trained with Dice loss, which measures overlap directly and copes well with class imbalance — handy when the foreground is a small fraction of the image.

Given predicted probabilities \\(p\\) and binary targets \\(t\\) as flat lists, the (soft) Dice coefficient and its loss are

\\[ \\text{Dice} = \\frac{2\\sum_i p_i t_i + \\varepsilon}{\\sum_i p_i + \\sum_i t_i + \\varepsilon}, \\qquad \\mathcal{L} = 1 - \\text{Dice}, \\]

with a small \\(\\varepsilon = 10^{-8}\\) for numerical stability. A perfect overlap drives the loss to \\(0\\). Return the loss rounded to four decimals.`,
    examples: [
      {
        input: 'preds = [1.0,1.0,0.0,0.0], targets = [1,1,0,0]',
        output: '0.0',
        explanation: 'Predictions match the targets exactly, so Dice is 1 and the loss is 0.',
      },
      {
        input: 'preds = [0.5,0.5,0.5,0.5], targets = [1,1,0,0]',
        output: '0.5',
        explanation: 'Overlap sum is 1, total mass is 2+2; Dice = 2/4 = 0.5, so loss = 0.5.',
      },
    ],
    starterCode: {
      python: `def dice_loss(preds, targets, eps=1e-8):
    inter = sum(p * t for p, t in zip(preds, targets))
    dice = (2 * inter + eps) / (sum(preds) + sum(targets) + eps)
    return round(1 - dice, 4)


print(dice_loss([1.0, 1.0, 0.0, 0.0], [1, 1, 0, 0]))
print(dice_loss([0.5, 0.5, 0.5, 0.5], [1, 1, 0, 0]))
`,
    },
    hints: [
      'The numerator is twice the elementwise product summed over all positions.',
      'The epsilon keeps the ratio defined when both sums are zero (an all-background case).',
      'Loss is 1 minus the coefficient, so higher overlap means lower loss.',
    ],
    tests: [
      { input: 'preds=[1.0,1.0,0.0,0.0], targets=[1,1,0,0]', expected: '0.0' },
      { input: 'preds=[0.0,0.0,0.0,0.0], targets=[0,0,0,0]', expected: '0.0' },
      { input: 'preds=[0.5,0.5,0.5,0.5], targets=[1,1,0,0]', expected: '0.5' },
    ],
  },

  {
    slug: 'mean-median-mode',
    title: 'Mean, Median, and Mode',
    difficulty: 'easy',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `Summarize a list of numbers with its three classic centres.

The **mean** is the arithmetic average \\( \\bar{x} = \\frac{1}{n} \\sum_i x_i \\). The **median** is the middle value of the sorted data — for an even count, average the two middle entries. The **mode** is the most frequent value; when several values tie for the top count, report the smallest of them.

Return the tuple \\((\\text{mean}, \\text{median}, \\text{mode})\\) with the mean and median rounded to three decimals.`,
    examples: [
      {
        input: 'nums = [1, 2, 2, 3, 4]',
        output: '(2.4, 2, 2)',
        explanation: 'Mean 12/5 = 2.4, the middle of the sorted list is 2, and 2 occurs most often.',
      },
      {
        input: 'nums = [5, 3, 8, 3, 9, 1]',
        output: '(4.833, 4.0, 3)',
        explanation: 'Six values, so the median averages the two middle entries 3 and 5; 3 is the only repeated value.',
      },
    ],
    starterCode: {
      python: `from collections import Counter


def mean_median_mode(nums):
    n = len(nums)
    mean = sum(nums) / n
    s = sorted(nums)
    if n % 2 == 1:
        median = s[n // 2]
    else:
        median = (s[n // 2 - 1] + s[n // 2]) / 2
    counts = Counter(nums)
    top = max(counts.values())
    mode = min(v for v, c in counts.items() if c == top)
    return (round(mean, 3), round(median, 3), mode)


print(mean_median_mode([1, 2, 2, 3, 4]))
`,
    },
    hints: [
      'Sort once, then index the middle for the median — even counts need the average of two entries.',
      'Count frequencies with a dictionary, then keep the values whose count equals the maximum.',
      'Break a mode tie by taking the smallest of the tied values.',
    ],
    tests: [
      { input: 'nums=[1,2,2,3,4]', expected: '(2.4, 2, 2)' },
      { input: 'nums=[4,4,7,7]', expected: '(5.5, 5.5, 4)' },
      { input: 'nums=[10]', expected: '(10.0, 10, 10)' },
    ],
  },

  {
    slug: 'percentiles',
    title: 'Percentile (Linear Interpolation)',
    difficulty: 'medium',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `Find the value below which a given fraction of the data falls. With \\(q\\) in \\([0, 100]\\), the target rank on the sorted data is

\\[ r = \\frac{q}{100} (n - 1), \\]

a position counted from zero. When \\(r\\) lands between two sorted entries, interpolate linearly: with \\(\\lfloor r \\rfloor = \\ell\\) and fractional part \\(f = r - \\ell\\),

\\[ P_q = s_\\ell + f \\, (s_{\\ell+1} - s_\\ell). \\]

This is the default 'linear' method used by NumPy. Return the percentile rounded to three decimals.`,
    examples: [
      {
        input: 'data = [1, 2, 3, 4], q = 50',
        output: '2.5',
        explanation: 'Rank 0.5*3 = 1.5 sits halfway between sorted entries 2 and 3.',
      },
      {
        input: 'data = [15, 20, 35, 40, 50], q = 40',
        output: '29.0',
        explanation: 'Rank 0.4*4 = 1.6 lies 0.6 of the way from 20 to 35.',
      },
    ],
    starterCode: {
      python: `import math


def percentile(data, q):
    s = sorted(data)
    n = len(s)
    rank = (q / 100) * (n - 1)
    lo = int(math.floor(rank))
    hi = int(math.ceil(rank))
    if lo == hi:
        return round(float(s[lo]), 3)
    frac = rank - lo
    return round(s[lo] + (s[hi] - s[lo]) * frac, 3)


print(percentile([1, 2, 3, 4], 50))
`,
    },
    hints: [
      'Counting ranks from zero, the maximum rank is n-1, not n.',
      'Split the rank into an integer floor index and a fractional weight.',
      'When the rank is a whole number, no interpolation is needed — return that entry directly.',
    ],
    tests: [
      { input: 'data=[1,2,3,4], q=50', expected: '2.5' },
      { input: 'data=[15,20,35,40,50], q=40', expected: '29.0' },
      { input: 'data=[1,2,3,4], q=25', expected: '1.75' },
    ],
  },

  {
    slug: 'bootstrap-mean',
    title: 'Bootstrap Mean Estimate',
    difficulty: 'medium',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `The bootstrap estimates a statistic by resampling the data with replacement many times. Here the resamples are supplied as lists of indices so the result is deterministic.

For each resample, gather \\(\\{ x_i : i \\in \\text{idx} \\}\\) and take its mean. The bootstrap estimate of the mean is the average of those per-resample means:

\\[ \\hat{\\mu}_{\\text{boot}} = \\frac{1}{B} \\sum_{b=1}^{B} \\Big( \\frac{1}{|R_b|} \\sum_{i \\in R_b} x_i \\Big). \\]

Return the estimate rounded to four decimals.`,
    examples: [
      {
        input: 'data = [1, 2, 3, 4]\nresamples = [[0,0,1,2], [1,2,3,3], [0,1,2,3]]',
        output: '2.5',
        explanation: 'Resample means are 1.75, 3.25, 2.5; their average is 2.5.',
      },
      {
        input: 'data = [10, 20, 30]\nresamples = [[0,1], [1,2], [0,2]]',
        output: '20.0',
        explanation: 'Resample means 15, 25, 20 average to 20.',
      },
    ],
    starterCode: {
      python: `def bootstrap_mean(data, resamples):
    means = []
    for idx in resamples:
        sample = [data[i] for i in idx]
        means.append(sum(sample) / len(sample))
    return round(sum(means) / len(means), 4)


print(bootstrap_mean([1, 2, 3, 4], [[0, 0, 1, 2], [1, 2, 3, 3], [0, 1, 2, 3]]))
`,
    },
    hints: [
      'Index lists may repeat an index — that is resampling with replacement.',
      'Compute each resample mean first, then average those means; do not pool all indices together.',
      'The number of resamples B is just len(resamples).',
    ],
    tests: [
      { input: 'data=[1,2,3,4], resamples=[[0,0,1,2],[1,2,3,3],[0,1,2,3]]', expected: '2.5' },
      { input: 'data=[10,20,30], resamples=[[0,1],[1,2],[0,2]]', expected: '20.0' },
      { input: 'data=[5,5,5], resamples=[[0,1,2],[2,2,2]]', expected: '5.0' },
    ],
  },

  {
    slug: 'expected-value-discrete',
    title: 'Expected Value of a Discrete Distribution',
    difficulty: 'easy',
    topic: 'Probability',
    category: 'Probability',
    statement: `A discrete random variable takes value \\(v_i\\) with probability \\(p_i\\), where the probabilities sum to one. Its expected value is the probability-weighted average

\\[ \\mathbb{E}[X] = \\sum_i v_i \\, p_i. \\]

Given matching lists of values and probabilities, return \\(\\mathbb{E}[X]\\) rounded to four decimals.`,
    examples: [
      {
        input: 'values = [1, 2, 3], probs = [0.2, 0.5, 0.3]',
        output: '2.1',
        explanation: '1*0.2 + 2*0.5 + 3*0.3 = 0.2 + 1.0 + 0.9 = 2.1.',
      },
      {
        input: 'values = [0, 10], probs = [0.5, 0.5]',
        output: '5.0',
        explanation: 'A fair coin paying 0 or 10 has expected payout 5.',
      },
    ],
    starterCode: {
      python: `def expected_value(values, probs):
    return round(sum(v * p for v, p in zip(values, probs)), 4)


print(expected_value([1, 2, 3], [0.2, 0.5, 0.3]))
`,
    },
    hints: [
      'Pair each value with its probability and sum the products.',
      'The expected value need not be an attainable outcome — it is a weighted average.',
      'If the probabilities truly sum to 1, no normalisation step is required.',
    ],
    tests: [
      { input: 'values=[1,2,3], probs=[0.2,0.5,0.3]', expected: '2.1' },
      { input: 'values=[0,10], probs=[0.5,0.5]', expected: '5.0' },
      { input: 'values=[1,2,3,4,5,6], probs=[1/6]*6', expected: '3.5' },
    ],
  },

  {
    slug: 'bernoulli-pmf',
    title: 'Bernoulli PMF',
    difficulty: 'easy',
    topic: 'Probability',
    category: 'Probability',
    statement: `A Bernoulli trial succeeds with probability \\(p\\) and fails with probability \\(1 - p\\). Its probability mass function over \\(k \\in \\{0, 1\\}\\) is

\\[ P(X = k) = p^k (1 - p)^{1 - k} = \\begin{cases} p & k = 1 \\\\ 1 - p & k = 0. \\end{cases} \\]

Given \\(p\\) and \\(k\\), return \\(P(X = k)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'p = 0.3, k = 1',
        output: '0.3',
        explanation: 'The success probability is p itself.',
      },
      {
        input: 'p = 0.3, k = 0',
        output: '0.7',
        explanation: 'Failure probability is 1 - p = 0.7.',
      },
    ],
    starterCode: {
      python: `def bernoulli_pmf(p, k):
    return round(p if k == 1 else 1 - p, 4)


print(bernoulli_pmf(0.3, 1))
`,
    },
    hints: [
      'Only two outcomes exist: k=1 gives p and k=0 gives 1-p.',
      'The exponent form p**k * (1-p)**(1-k) collapses to the same two cases.',
      'No factorials or sums are involved — it is a single lookup.',
    ],
    tests: [
      { input: 'p=0.3, k=1', expected: '0.3' },
      { input: 'p=0.3, k=0', expected: '0.7' },
      { input: 'p=0.75, k=1', expected: '0.75' },
    ],
  },

  {
    slug: 'binomial-pmf-cdf',
    title: 'Binomial PMF and CDF',
    difficulty: 'medium',
    topic: 'Probability',
    category: 'Probability',
    statement: `Count successes in \\(n\\) independent Bernoulli trials, each with success probability \\(p\\). The probability of exactly \\(i\\) successes is

\\[ P(X = i) = \\binom{n}{i} p^i (1 - p)^{n - i}. \\]

The cumulative probability up to and including \\(k\\) sums those masses:

\\[ P(X \\le k) = \\sum_{i=0}^{k} \\binom{n}{i} p^i (1 - p)^{n - i}. \\]

Given \\(n\\), \\(p\\), \\(k\\), return the tuple \\((\\text{pmf at } k, \\text{cdf at } k)\\) rounded to five decimals. Use \\(\\binom{n}{i}\\) from math.comb.`,
    examples: [
      {
        input: 'n = 5, p = 0.5, k = 2',
        output: '(0.3125, 0.5)',
        explanation: 'C(5,2)*0.5^5 = 10/32 = 0.3125; the lower half sums to 0.5 by symmetry.',
      },
      {
        input: 'n = 10, p = 0.3, k = 3',
        output: '(0.26683, 0.64961)',
        explanation: 'The single-term mass at 3 plus the masses at 0,1,2 give the cumulative value.',
      },
    ],
    starterCode: {
      python: `import math


def binomial(n, p, k):
    def pm(i):
        return math.comb(n, i) * p ** i * (1 - p) ** (n - i)
    pmf = pm(k)
    cdf = sum(pm(i) for i in range(k + 1))
    return (round(pmf, 5), round(cdf, 5))


print(binomial(5, 0.5, 2))
`,
    },
    hints: [
      'math.comb(n, i) gives the binomial coefficient exactly, no factorial juggling.',
      'The CDF is just the sum of pmf values from i=0 through i=k inclusive.',
      'Reuse a single pmf helper for both the point mass and the cumulative sum.',
    ],
    tests: [
      { input: 'n=5, p=0.5, k=2', expected: '(0.3125, 0.5)' },
      { input: 'n=10, p=0.3, k=3', expected: '(0.26683, 0.64961)' },
      { input: 'n=4, p=0.25, k=0', expected: '(0.31641, 0.31641)' },
    ],
  },

  {
    slug: 'poisson-pmf-cdf',
    title: 'Poisson PMF and CDF',
    difficulty: 'medium',
    topic: 'Probability',
    category: 'Probability',
    statement: `The Poisson distribution models the count of rare events with average rate \\(\\lambda\\). The probability of exactly \\(i\\) events is

\\[ P(X = i) = \\frac{e^{-\\lambda} \\lambda^i}{i!}, \\]

and the cumulative probability up to and including \\(k\\) is

\\[ P(X \\le k) = \\sum_{i=0}^{k} \\frac{e^{-\\lambda} \\lambda^i}{i!}. \\]

Given \\(\\lambda\\) and \\(k\\), return the tuple \\((\\text{pmf at } k, \\text{cdf at } k)\\) rounded to five decimals.`,
    examples: [
      {
        input: 'lam = 2.0, k = 3',
        output: '(0.18045, 0.85712)',
        explanation: 'e^-2 * 2^3 / 6 gives the point mass; summing i=0..3 gives the cumulative value.',
      },
      {
        input: 'lam = 1.0, k = 0',
        output: '(0.36788, 0.36788)',
        explanation: 'P(X=0) = e^-1 = 0.36788, which is also the entire cumulative mass at k=0.',
      },
    ],
    starterCode: {
      python: `import math


def poisson(lam, k):
    def pm(i):
        return math.exp(-lam) * lam ** i / math.factorial(i)
    pmf = pm(k)
    cdf = sum(pm(i) for i in range(k + 1))
    return (round(pmf, 5), round(cdf, 5))


print(poisson(2.0, 3))
`,
    },
    hints: [
      'math.factorial(i) handles the i! denominator cleanly.',
      'The exponential prefactor e^-lambda is the same for every term.',
      'At k=0 the pmf and cdf coincide because there is only one term.',
    ],
    tests: [
      { input: 'lam=2.0, k=3', expected: '(0.18045, 0.85712)' },
      { input: 'lam=1.0, k=0', expected: '(0.36788, 0.36788)' },
      { input: 'lam=4.0, k=2', expected: '(0.14653, 0.2381)' },
    ],
  },

  {
    slug: 'geometric-pmf-mean',
    title: 'Geometric PMF and Mean',
    difficulty: 'easy',
    topic: 'Probability',
    category: 'Probability',
    statement: `Count the trials until the first success, where each trial succeeds with probability \\(p\\). On the support \\(\\{1, 2, 3, \\dots\\}\\) the probability of the first success on trial \\(k\\) is

\\[ P(X = k) = (1 - p)^{k - 1} p, \\]

since the first \\(k - 1\\) trials must fail. The mean number of trials is

\\[ \\mathbb{E}[X] = \\frac{1}{p}. \\]

Given \\(p\\) and \\(k\\), return the tuple \\((\\text{pmf at } k, \\text{mean})\\) rounded to five decimals.`,
    examples: [
      {
        input: 'p = 0.5, k = 3',
        output: '(0.125, 2.0)',
        explanation: 'Two failures then a success: 0.5^2 * 0.5 = 0.125; expected trials 1/0.5 = 2.',
      },
      {
        input: 'p = 0.2, k = 1',
        output: '(0.2, 5.0)',
        explanation: 'Success on the first trial has probability p; the mean is 1/0.2 = 5.',
      },
    ],
    starterCode: {
      python: `def geometric(p, k):
    pmf = (1 - p) ** (k - 1) * p
    mean = 1 / p
    return (round(pmf, 5), round(mean, 5))


print(geometric(0.5, 3))
`,
    },
    hints: [
      'The support starts at 1, so the exponent on (1-p) is k-1, not k.',
      'The first k-1 trials fail and the k-th succeeds.',
      'The mean of a geometric on {1,2,...} is simply 1/p.',
    ],
    tests: [
      { input: 'p=0.5, k=3', expected: '(0.125, 2.0)' },
      { input: 'p=0.2, k=1', expected: '(0.2, 5.0)' },
      { input: 'p=0.25, k=4', expected: '(0.10547, 4.0)' },
    ],
  },

  {
    slug: 't-test-one-sample',
    title: 'One-Sample t-Statistic',
    difficulty: 'medium',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `Test whether a sample mean differs from a hypothesized population mean \\(\\mu_0\\). With sample mean \\(\\bar{x}\\), sample standard deviation \\(s\\) (using Bessel's correction, ddof = 1), and size \\(n\\), the t-statistic is

\\[ t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}, \\qquad s = \\sqrt{ \\frac{1}{n - 1} \\sum_i (x_i - \\bar{x})^2 }. \\]

The denominator \\(s / \\sqrt{n}\\) is the standard error of the mean. Return \\(t\\) rounded to four decimals.`,
    examples: [
      {
        input: 'sample = [5, 6, 7, 8, 9], mu0 = 5',
        output: '2.8284',
        explanation: 'Mean 7 sits two units above mu0; the standard error scales that into a t of about 2.83.',
      },
      {
        input: 'sample = [2, 4, 4, 4, 5, 5, 7, 9], mu0 = 5',
        output: '0.0',
        explanation: 'The sample mean equals mu0, so the numerator is zero.',
      },
    ],
    starterCode: {
      python: `import math


def t_stat(sample, mu0):
    n = len(sample)
    xbar = sum(sample) / n
    var = sum((x - xbar) ** 2 for x in sample) / (n - 1)
    s = math.sqrt(var)
    return round((xbar - mu0) / (s / math.sqrt(n)), 4)


print(t_stat([5, 6, 7, 8, 9], 5))
`,
    },
    hints: [
      'Divide the squared deviations by n-1, not n — that is the ddof=1 sample variance.',
      'The standard error is s divided by the square root of n.',
      'When the sample mean equals mu0 the statistic is exactly zero regardless of spread.',
    ],
    tests: [
      { input: 'sample=[5,6,7,8,9], mu0=5', expected: '2.8284' },
      { input: 'sample=[2,4,4,4,5,5,7,9], mu0=5', expected: '0.0' },
      { input: 'sample=[10,12,14], mu0=12', expected: '0.0' },
    ],
  },

  {
    slug: 'chi2-independence',
    title: 'Chi-Square Statistic for Independence',
    difficulty: 'hard',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `Given a contingency table of observed counts \\(O_{ij}\\), test whether the two categorical variables are independent. Under independence the expected count in each cell is

\\[ E_{ij} = \\frac{(\\text{row } i \\text{ total})(\\text{column } j \\text{ total})}{\\text{grand total}}. \\]

The chi-square statistic compares observed against expected across every cell:

\\[ \\chi^2 = \\sum_{i,j} \\frac{(O_{ij} - E_{ij})^2}{E_{ij}}. \\]

Return \\(\\chi^2\\) rounded to four decimals.`,
    examples: [
      {
        input: 'table = [[10, 20], [20, 40]]',
        output: '0.0',
        explanation: 'The rows are perfectly proportional, so every observed count equals its expectation.',
      },
      {
        input: 'table = [[30, 10], [20, 40]]',
        output: '16.6667',
        explanation: 'Strong departure from the expected counts inflates the statistic.',
      },
    ],
    starterCode: {
      python: `def chi2_independence(table):
    rows = len(table)
    cols = len(table[0])
    row_tot = [sum(r) for r in table]
    col_tot = [sum(table[i][j] for i in range(rows)) for j in range(cols)]
    grand = sum(row_tot)
    chi = 0.0
    for i in range(rows):
        for j in range(cols):
            e = row_tot[i] * col_tot[j] / grand
            chi += (table[i][j] - e) ** 2 / e
    return round(chi, 4)


print(chi2_independence([[10, 20], [20, 40]]))
`,
    },
    hints: [
      'Compute row totals, column totals, and the grand total first.',
      'Each expected cell is row_total times column_total divided by the grand total.',
      'Proportional rows give zero — observed equals expected everywhere.',
    ],
    tests: [
      { input: 'table=[[10,20],[20,40]]', expected: '0.0' },
      { input: 'table=[[30,10],[20,40]]', expected: '16.6667' },
      { input: 'table=[[12,8,10],[8,12,10]]', expected: '1.6' },
    ],
  },

  {
    slug: 'cohens-kappa',
    title: "Cohen's Kappa",
    difficulty: 'medium',
    topic: 'Statistics',
    category: 'Statistics',
    statement: `Two raters label the same items; Cohen's kappa measures their agreement beyond what chance would give. Let \\(p_o\\) be the observed agreement (fraction of items where the labels match) and \\(p_e\\) the agreement expected by chance, computed from the marginal proportions of each label:

\\[ p_e = \\sum_{\\ell} \\Big( \\frac{\\#\\{a = \\ell\\}}{n} \\Big) \\Big( \\frac{\\#\\{b = \\ell\\}}{n} \\Big). \\]

Then

\\[ \\kappa = \\frac{p_o - p_e}{1 - p_e}. \\]

Return \\(\\kappa\\) rounded to four decimals. Kappa is 1 for perfect agreement, 0 for chance-level, and can go negative.`,
    examples: [
      {
        input: 'a = [1, 1, 0, 0, 1], b = [1, 0, 0, 0, 1]',
        output: '0.6154',
        explanation: 'Four of five labels match; correcting for chance agreement gives kappa 0.6154.',
      },
      {
        input: 'a = [1, 0, 1, 0, 1, 0], b = [1, 0, 1, 0, 1, 0]',
        output: '1.0',
        explanation: 'Identical label lists give perfect agreement, kappa 1.',
      },
    ],
    starterCode: {
      python: `def cohens_kappa(a, b):
    n = len(a)
    po = sum(1 for x, y in zip(a, b) if x == y) / n
    labels = set(a) | set(b)
    pe = 0.0
    for lab in labels:
        pa = sum(1 for x in a if x == lab) / n
        pb = sum(1 for y in b if y == lab) / n
        pe += pa * pb
    return round((po - pe) / (1 - pe), 4)


print(cohens_kappa([1, 1, 0, 0, 1], [1, 0, 0, 0, 1]))
`,
    },
    hints: [
      'Observed agreement is the fraction of positions where the two raters match.',
      "Chance agreement multiplies each label's marginal proportion across the two raters, summed over labels.",
      'Systematic disagreement can push kappa below zero.',
    ],
    tests: [
      { input: 'a=[1,1,0,0,1], b=[1,0,0,0,1]', expected: '0.6154' },
      { input: 'a=[1,0,1,0,1,0], b=[1,0,1,0,1,0]', expected: '1.0' },
      { input: 'a=[1,1,1,0], b=[0,0,0,1]', expected: '-0.6' },
    ],
  },

  {
    slug: 'expected-calibration-error',
    title: 'Expected Calibration Error',
    difficulty: 'hard',
    topic: 'Statistics',
    category: 'Metrics',
    statement: `A well-calibrated classifier's confidence should match its accuracy. Expected Calibration Error (ECE) measures the gap. Split the confidences into \\(M\\) equal-width bins over \\([0, 1]\\). For each bin \\(B_m\\) compute its accuracy \\(\\text{acc}(B_m)\\) (mean correctness) and its average confidence \\(\\text{conf}(B_m)\\), then take the size-weighted absolute gap:

\\[ \\text{ECE} = \\sum_{m=1}^{M} \\frac{|B_m|}{N} \\big| \\, \\text{acc}(B_m) - \\text{conf}(B_m) \\, \\big|. \\]

Empty bins contribute nothing. Each confidence falls in the bin \\((\\frac{m-1}{M}, \\frac{m}{M}]\\), with the first bin also including its left edge. Return ECE rounded to four decimals.`,
    examples: [
      {
        input: 'confidences = [0.9, 0.8, 0.3, 0.6], correct = [1, 1, 0, 1], M = 2',
        output: '0.25',
        explanation: 'The two bins each compare their mean confidence against their mean correctness; the weighted gaps sum to 0.25.',
      },
      {
        input: 'confidences = [0.95, 0.85, 0.55, 0.45, 0.15], correct = [1, 0, 1, 0, 0], M = 5',
        output: '0.19',
        explanation: 'With each point in its own bin, the gap is the per-point |correct - confidence| averaged over N.',
      },
    ],
    starterCode: {
      python: `def ece(confidences, correct, M):
    N = len(confidences)
    total = 0.0
    for m in range(M):
        lo = m / M
        hi = (m + 1) / M
        idx = [i for i in range(N)
               if (confidences[i] > lo or (m == 0 and confidences[i] >= lo))
               and confidences[i] <= hi]
        if not idx:
            continue
        acc = sum(correct[i] for i in idx) / len(idx)
        conf = sum(confidences[i] for i in idx) / len(idx)
        total += (len(idx) / N) * abs(acc - conf)
    return round(total, 4)


print(ece([0.9, 0.8, 0.3, 0.6], [1, 1, 0, 1], 2))
`,
    },
    hints: [
      'Each bin spans width 1/M; assign a confidence by which interval it lands in.',
      'Within a bin, accuracy is the mean of the correctness flags and confidence is the mean of the predicted confidences.',
      'Weight every bin gap by its share of the total count, and skip empty bins.',
    ],
    tests: [
      { input: 'confidences=[0.9,0.8,0.3,0.6], correct=[1,1,0,1], M=2', expected: '0.25' },
      { input: 'confidences=[0.95,0.85,0.55,0.45,0.15], correct=[1,0,1,0,0], M=5', expected: '0.19' },
      { input: 'confidences=[0.7,0.7,0.7,0.7], correct=[1,1,0,0], M=1', expected: '0.2' },
    ],
  },

  {
    slug: 'dot-product',
    title: 'Dot Product',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `The dot product collapses two equal-length vectors into a single number by multiplying them entry-by-entry and summing the results:

\\[ \\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^{n} a_i b_i . \\]

It is the workhorse behind projections, cosine similarity, and every linear layer in a neural network — a single weighted sum. Return the dot product. If the result is a float, round it to four decimals; if both vectors are integer-valued, return the exact integer.`,
    examples: [
      {
        input: 'a = [1, 2, 3], b = [4, 5, 6]',
        output: '32',
        explanation: '1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32, an exact integer.',
      },
      {
        input: 'a = [1.5, 2.0], b = [2.0, 4.0]',
        output: '11.0',
        explanation: '1.5*2.0 + 2.0*4.0 = 3.0 + 8.0 = 11.0, a float result.',
      },
    ],
    starterCode: {
      python: `def dot_product(a, b):
    s = sum(x * y for x, y in zip(a, b))
    return round(s, 4) if isinstance(s, float) else s


print(dot_product([1, 2, 3], [4, 5, 6]))
print(dot_product([1.5, 2.0], [2.0, 4.0]))
`,
    },
    hints: [
      'zip(a, b) pairs the matching components so you can multiply them together.',
      'Accumulate the running sum of products rather than building an intermediate list.',
      'Check isinstance(s, float) to decide between rounding and returning an exact int.',
    ],
    tests: [
      { input: 'a=[1,2,3], b=[4,5,6]', expected: '32' },
      { input: 'a=[0,0,0], b=[1,2,3]', expected: '0' },
      { input: 'a=[-1,2,-3], b=[4,-5,6]', expected: '-32' },
    ],
  },

  {
    slug: 'euclidean-distance',
    title: 'Euclidean Distance',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `The Euclidean distance is the straight-line length between two points, the metric behind k-nearest-neighbours and k-means:

\\[ d(\\mathbf{a}, \\mathbf{b}) = \\sqrt{\\sum_{i=1}^{n} (a_i - b_i)^2} . \\]

Square each coordinate difference, sum them, then take the square root. Return the distance rounded to four decimals.`,
    examples: [
      {
        input: 'a = [0, 0], b = [3, 4]',
        output: '5.0',
        explanation: 'The classic 3-4-5 right triangle: sqrt(9 + 16) = 5.0.',
      },
      {
        input: 'a = [1, 2, 3], b = [4, 6, 8]',
        output: '7.0711',
        explanation: 'Differences (3, 4, 5) give sqrt(9 + 16 + 25) = sqrt(50) = 7.0711.',
      },
    ],
    starterCode: {
      python: `import math


def euclidean_distance(a, b):
    return round(math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b))), 4)


print(euclidean_distance([0, 0], [3, 4]))
print(euclidean_distance([1, 2, 3], [4, 6, 8]))
`,
    },
    hints: [
      'Pair the coordinates with zip, subtract, and square each difference.',
      'Sum the squared differences before taking a single square root at the end.',
      'Identical points have every difference zero, so the distance is exactly 0.0.',
    ],
    tests: [
      { input: 'a=[0,0], b=[3,4]', expected: '5.0' },
      { input: 'a=[1,1], b=[1,1]', expected: '0.0' },
      { input: 'a=[0,0,0], b=[1,1,1]', expected: '1.7321' },
    ],
  },

  {
    slug: 'matrix-transpose',
    title: 'Matrix Transpose',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `Transposing flips a matrix across its main diagonal, turning rows into columns:

\\[ (A^\\top)_{ij} = A_{ji} . \\]

An \\(M \\times N\\) matrix becomes \\(N \\times M\\). It shows up everywhere — aligning shapes for matrix multiplication, swapping between row-major and column-major views of your data. Given a nested list, return its transpose as a new nested list.`,
    examples: [
      {
        input: 'm = [[1, 2, 3], [4, 5, 6]]',
        output: '[[1, 4], [2, 5], [3, 6]]',
        explanation: 'The 2x3 input becomes 3x2; old column j is now row j.',
      },
      {
        input: 'm = [[1, 2], [3, 4], [5, 6]]',
        output: '[[1, 3, 5], [2, 4, 6]]',
        explanation: 'The 3x2 input becomes 2x3, the inverse of the first example.',
      },
    ],
    starterCode: {
      python: `def matrix_transpose(m):
    return [list(row) for row in zip(*m)]


print(matrix_transpose([[1, 2, 3], [4, 5, 6]]))
print(matrix_transpose([[1, 2], [3, 4], [5, 6]]))
`,
    },
    hints: [
      'zip(*m) walks the rows in parallel, yielding one column of the original per step.',
      'Each zip tuple is a column — wrap it in list() to get a clean row of the transpose.',
      'The output has as many rows as the input had columns, and vice versa.',
    ],
    tests: [
      { input: 'm=[[1,2,3],[4,5,6]]', expected: '[[1, 4], [2, 5], [3, 6]]' },
      { input: 'm=[[1],[2],[3]]', expected: '[[1, 2, 3]]' },
      { input: 'm=[[7,8],[9,10]]', expected: '[[7, 9], [8, 10]]' },
    ],
  },

  {
    slug: 'matrix-trace',
    title: 'Matrix Trace',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `The trace of a square matrix is the sum of its main-diagonal entries:

\\[ \\mathrm{tr}(A) = \\sum_{i=1}^{n} A_{ii} . \\]

It equals the sum of the eigenvalues and stays invariant under a change of basis, which makes it a handy summary statistic in covariance and optimisation work. Return the trace of the given square matrix.`,
    examples: [
      {
        input: 'm = [[1, 2], [3, 4]]',
        output: '5',
        explanation: 'The diagonal is 1 and 4, so the trace is 1 + 4 = 5.',
      },
      {
        input: 'm = [[1, 0, 0], [0, 2, 0], [0, 0, 3]]',
        output: '6',
        explanation: 'A diagonal matrix; its trace is just 1 + 2 + 3 = 6.',
      },
    ],
    starterCode: {
      python: `def matrix_trace(m):
    return sum(m[i][i] for i in range(len(m)))


print(matrix_trace([[1, 2], [3, 4]]))
print(matrix_trace([[1, 0, 0], [0, 2, 0], [0, 0, 3]]))
`,
    },
    hints: [
      'The diagonal entries are exactly those where the row index equals the column index.',
      'Index m[i][i] as i runs from 0 to n-1.',
      'Off-diagonal values never enter the sum — only m[i][i] matters.',
    ],
    tests: [
      { input: 'm=[[1,2],[3,4]]', expected: '5' },
      { input: 'm=[[5]]', expected: '5' },
      { input: 'm=[[2,1,3],[0,4,5],[1,1,6]]', expected: '12' },
    ],
  },

  {
    slug: 'make-diagonal',
    title: 'Diagonal Matrix from Vector',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `Given a length-\\(n\\) vector \\(\\mathbf{v}\\), build the \\(n \\times n\\) matrix that carries \\(\\mathbf{v}\\) on its main diagonal and zeros everywhere else:

\\[ D_{ij} = \\begin{cases} v_i & i = j \\\\ 0 & i \\neq j \\end{cases} . \\]

Diagonal matrices scale each axis independently and are trivial to invert — they appear in eigendecompositions and as the singular-value core of an SVD. Return the matrix as a nested list.`,
    examples: [
      {
        input: 'v = [1, 2, 3]',
        output: '[[1, 0, 0], [0, 2, 0], [0, 0, 3]]',
        explanation: 'Each v_i lands at position (i, i); every other entry is 0.',
      },
      {
        input: 'v = [4, 0]',
        output: '[[4, 0], [0, 0]]',
        explanation: 'A zero in the vector simply produces a zero on the diagonal.',
      },
    ],
    starterCode: {
      python: `def make_diagonal(v):
    n = len(v)
    return [[v[i] if i == j else 0 for j in range(n)] for i in range(n)]


print(make_diagonal([1, 2, 3]))
print(make_diagonal([4, 0]))
`,
    },
    hints: [
      'The output is square, with side length equal to the length of the vector.',
      'For row i, place v[i] at column i and 0 in every other column.',
      'A nested comprehension over i (rows) and j (columns) reads cleanly here.',
    ],
    tests: [
      { input: 'v=[1,2,3]', expected: '[[1, 0, 0], [0, 2, 0], [0, 0, 3]]' },
      { input: 'v=[5]', expected: '[[5]]' },
      { input: 'v=[1,1,1,1]', expected: '[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]' },
    ],
  },

  {
    slug: 'matrix-normalization',
    title: 'Matrix Normalization (Frobenius)',
    difficulty: 'medium',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `The Frobenius norm treats a matrix as one long vector — the square root of the sum of every squared entry:

\\[ \\lVert A \\rVert_F = \\sqrt{\\sum_{i} \\sum_{j} A_{ij}^2} . \\]

Normalizing divides every entry by this norm, producing a matrix of unit Frobenius length. It is a common preprocessing step for weight matrices and gradients. Return the normalized matrix with each entry rounded to four decimals.`,
    examples: [
      {
        input: 'm = [[3, 4]]',
        output: '[[0.6, 0.8]]',
        explanation: 'The norm is sqrt(9 + 16) = 5, so the entries become 3/5 and 4/5.',
      },
      {
        input: 'm = [[1, 0], [0, 1]]',
        output: '[[0.7071, 0.0], [0.0, 0.7071]]',
        explanation: 'The norm is sqrt(2); each 1 becomes 1/sqrt(2) = 0.7071.',
      },
    ],
    starterCode: {
      python: `import math


def matrix_normalization(m):
    fro = math.sqrt(sum(x * x for row in m for x in row))
    return [[round(x / fro, 4) for x in row] for row in m]


print(matrix_normalization([[3, 4]]))
print(matrix_normalization([[1, 0], [0, 1]]))
`,
    },
    hints: [
      'Flatten the matrix conceptually: sum the squares of every entry across all rows.',
      'Take one square root of that total sum to get the Frobenius norm.',
      'Divide each entry by the same scalar norm, then round to four decimals.',
    ],
    tests: [
      { input: 'm=[[3,4]]', expected: '[[0.6, 0.8]]' },
      { input: 'm=[[1,2],[3,4]]', expected: '[[0.1826, 0.3651], [0.5477, 0.7303]]' },
      { input: 'm=[[2,2,2,2]]', expected: '[[0.5, 0.5, 0.5, 0.5]]' },
    ],
  },

  {
    slug: 'matrix-inverse',
    title: '2x2 / 3x3 Matrix Inverse',
    difficulty: 'hard',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `Invert a square matrix with Gauss-Jordan elimination. Augment \\(A\\) with the identity \\([A \\mid I]\\), then row-reduce the left block to the identity; the right block becomes \\(A^{-1}\\):

\\[ [A \\mid I] \\longrightarrow [I \\mid A^{-1}] . \\]

Use partial pivoting (swap in the row with the largest pivot magnitude) for numerical stability, normalize each pivot row, then eliminate the pivot column from every other row. Return \\(A^{-1}\\) with each entry rounded to four decimals.`,
    examples: [
      {
        input: 'm = [[4, 7], [2, 6]]',
        output: '[[0.6, -0.7], [-0.2, 0.4]]',
        explanation: 'The determinant is 4*6 - 7*2 = 10; the inverse is the adjugate divided by 10.',
      },
      {
        input: 'm = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]',
        output: '[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]',
        explanation: 'The identity is its own inverse.',
      },
    ],
    starterCode: {
      python: `def matrix_inverse(m):
    n = len(m)
    a = [[float(m[i][j]) for j in range(n)] for i in range(n)]
    inv = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for col in range(n):
        piv = col
        for r in range(col, n):
            if abs(a[r][col]) > abs(a[piv][col]):
                piv = r
        a[col], a[piv] = a[piv], a[col]
        inv[col], inv[piv] = inv[piv], inv[col]
        p = a[col][col]
        for j in range(n):
            a[col][j] /= p
            inv[col][j] /= p
        for r in range(n):
            if r != col:
                f = a[r][col]
                for j in range(n):
                    a[r][j] -= f * a[col][j]
                    inv[r][j] -= f * inv[col][j]
    return [[round(inv[i][j], 4) for j in range(n)] for i in range(n)]


print(matrix_inverse([[4, 7], [2, 6]]))
print(matrix_inverse([[1, 0, 0], [0, 1, 0], [0, 0, 1]]))
`,
    },
    hints: [
      'Carry the identity alongside A and apply the exact same row operations to both.',
      'Before clearing a column, swap in the row with the largest pivot to avoid dividing by near-zero.',
      'Scale the pivot row so its pivot becomes 1, then subtract multiples of it from every other row.',
    ],
    tests: [
      { input: 'm=[[4,7],[2,6]]', expected: '[[0.6, -0.7], [-0.2, 0.4]]' },
      { input: 'm=[[2,0],[0,4]]', expected: '[[0.5, 0.0], [0.0, 0.25]]' },
      { input: 'm=[[1,2],[3,4]]', expected: '[[-2.0, 1.0], [1.5, -0.5]]' },
    ],
  },

  {
    slug: 'eigenvalues',
    title: 'Eigenvalues of a 2x2 Matrix',
    difficulty: 'medium',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `For a \\(2 \\times 2\\) matrix \\(\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}\\), the eigenvalues are the roots of the characteristic polynomial:

\\[ \\lambda^2 - (a + d)\\lambda + (ad - bc) = 0 . \\]

Here \\(a + d\\) is the trace and \\(ad - bc\\) is the determinant. Solve the quadratic and return the two real eigenvalues sorted in descending order, each rounded to four decimals. Assume the discriminant is non-negative so both roots are real.`,
    examples: [
      {
        input: 'm = [[2, 0], [0, 3]]',
        output: '[3.0, 2.0]',
        explanation: 'A diagonal matrix has its diagonal entries as eigenvalues, sorted high to low.',
      },
      {
        input: 'm = [[2, 1], [1, 2]]',
        output: '[3.0, 1.0]',
        explanation: 'Trace 4, determinant 3; roots of lambda^2 - 4*lambda + 3 are 3 and 1.',
      },
    ],
    starterCode: {
      python: `import math


def eigenvalues(m):
    a, b = m[0]
    c, d = m[1]
    tr = a + d
    det = a * d - b * c
    disc = math.sqrt(tr * tr - 4 * det)
    l1 = (tr + disc) / 2
    l2 = (tr - disc) / 2
    return [round(l1, 4), round(l2, 4)]


print(eigenvalues([[2, 0], [0, 3]]))
print(eigenvalues([[2, 1], [1, 2]]))
`,
    },
    hints: [
      'The trace (a + d) is the coefficient sum and the determinant (ad - bc) is the constant term.',
      'Apply the quadratic formula to lambda^2 - trace*lambda + det = 0.',
      'Adding the discriminant gives the larger root; subtracting gives the smaller one.',
    ],
    tests: [
      { input: 'm=[[2,1],[1,2]]', expected: '[3.0, 1.0]' },
      { input: 'm=[[4,1],[2,3]]', expected: '[5.0, 2.0]' },
      { input: 'm=[[1,0],[0,1]]', expected: '[1.0, 1.0]' },
    ],
  },

  {
    slug: 'angle-between-3d',
    title: 'Angle Between 3D Vectors',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `The angle between two 3D vectors follows directly from the dot product:

\\[ \\cos\\theta = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert} . \\]

Compute the dot product, divide by the product of the magnitudes, then take the inverse cosine. Clamp the cosine to \\([-1, 1]\\) so floating-point drift never breaks acos. Return the angle in degrees, rounded to two decimals.`,
    examples: [
      {
        input: 'a = [1, 0, 0], b = [0, 1, 0]',
        output: '90.0',
        explanation: 'Two perpendicular axes meet at a right angle.',
      },
      {
        input: 'a = [1, 0, 0], b = [1, 0, 0]',
        output: '0.0',
        explanation: 'Identical directions have zero angle between them.',
      },
    ],
    starterCode: {
      python: `import math


def angle_between_3d(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    ma = math.sqrt(sum(x * x for x in a))
    mb = math.sqrt(sum(x * x for x in b))
    cos = dot / (ma * mb)
    cos = max(-1.0, min(1.0, cos))
    return round(math.degrees(math.acos(cos)), 2)


print(angle_between_3d([1, 0, 0], [0, 1, 0]))
print(angle_between_3d([1, 0, 0], [1, 0, 0]))
`,
    },
    hints: [
      'The dot product over the product of magnitudes gives the cosine of the angle.',
      'Clamp the cosine into [-1, 1] before acos so rounding errors never raise a math domain error.',
      'math.acos returns radians — convert with math.degrees before rounding.',
    ],
    tests: [
      { input: 'a=[1,0,0], b=[0,1,0]', expected: '90.0' },
      { input: 'a=[1,2,2], b=[2,2,1]', expected: '27.27' },
      { input: 'a=[1,0,0], b=[-1,0,0]', expected: '180.0' },
    ],
  },

  {
    slug: 'normalize-3d',
    title: 'Normalize a 3D Vector',
    difficulty: 'easy',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `Normalizing a vector rescales it to unit length while preserving its direction:

\\[ \\hat{\\mathbf{v}} = \\frac{\\mathbf{v}}{\\lVert \\mathbf{v} \\rVert}, \\qquad \\lVert \\mathbf{v} \\rVert = \\sqrt{v_x^2 + v_y^2 + v_z^2} . \\]

Unit vectors are how you encode pure directions — surface normals, camera rays, gradient directions. Divide each component by the magnitude and return the unit vector with each component rounded to four decimals.`,
    examples: [
      {
        input: 'v = [3, 0, 4]',
        output: '[0.6, 0.0, 0.8]',
        explanation: 'The magnitude is 5, so the components scale to 3/5, 0, 4/5.',
      },
      {
        input: 'v = [0, 0, 5]',
        output: '[0.0, 0.0, 1.0]',
        explanation: 'A vector along one axis normalizes to the unit vector on that axis.',
      },
    ],
    starterCode: {
      python: `import math


def normalize_3d(v):
    mag = math.sqrt(sum(x * x for x in v))
    return [round(x / mag, 4) for x in v]


print(normalize_3d([3, 0, 4]))
print(normalize_3d([0, 0, 5]))
`,
    },
    hints: [
      'The magnitude is the square root of the sum of the squared components.',
      'Divide every component by that single magnitude value.',
      'A correctly normalized vector has length 1 — a useful self-check.',
    ],
    tests: [
      { input: 'v=[3,0,4]', expected: '[0.6, 0.0, 0.8]' },
      { input: 'v=[1,1,1]', expected: '[0.5774, 0.5774, 0.5774]' },
      { input: 'v=[2,2,1]', expected: '[0.6667, 0.6667, 0.3333]' },
    ],
  },

  {
    slug: 'homogeneous-transform',
    title: 'Homogeneous Transform of a 3D Point',
    difficulty: 'medium',
    topic: 'Linear Algebra',
    category: 'Linear Algebra',
    statement: `Graphics and robotics pack rotation, scaling, and translation into a single \\(4 \\times 4\\) matrix \\(T\\) acting on points written in homogeneous coordinates. Lift the 3D point \\(\\mathbf{p}\\) to \\([p_x, p_y, p_z, 1]\\), apply \\(T\\), then read back the Cartesian point:

\\[ \\begin{bmatrix} x' \\\\ y' \\\\ z' \\\\ w \\end{bmatrix} = T \\begin{bmatrix} p_x \\\\ p_y \\\\ p_z \\\\ 1 \\end{bmatrix}, \\qquad \\mathbf{p}' = \\left( \\tfrac{x'}{w}, \\tfrac{y'}{w}, \\tfrac{z'}{w} \\right) . \\]

If \\(w \\neq 1\\) (a perspective row), divide the first three components by \\(w\\). Return the transformed 3D point with each component rounded to four decimals.`,
    examples: [
      {
        input: 'T = translate by (5, -3, 2), p = [1, 1, 1]',
        output: '[6.0, -2.0, 3.0]',
        explanation: 'A pure translation adds the offset column: (1+5, 1-3, 1+2).',
      },
      {
        input: 'T = scale by 2, p = [1, 2, 3]',
        output: '[2.0, 4.0, 6.0]',
        explanation: 'A diagonal scale matrix multiplies each coordinate by 2.',
      },
    ],
    starterCode: {
      python: `def homogeneous_transform(T, p):
    pt = [p[0], p[1], p[2], 1.0]
    res = [sum(T[i][j] * pt[j] for j in range(4)) for i in range(4)]
    w = res[3]
    if w != 1:
        res = [res[i] / w for i in range(3)]
    else:
        res = res[:3]
    return [round(x, 4) for x in res]


print(homogeneous_transform([[1, 0, 0, 5], [0, 1, 0, -3], [0, 0, 1, 2], [0, 0, 0, 1]], [1, 1, 1]))
print(homogeneous_transform([[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1]], [1, 2, 3]))
`,
    },
    hints: [
      'Append a 1 to the point so it becomes a length-4 homogeneous vector before multiplying.',
      'Each output component is the dot product of one row of T with the lifted point.',
      'The fourth output is w — divide x, y, z by it when it is not exactly 1.',
    ],
    tests: [
      { input: 'T=identity, p=[2,3,4]', expected: '[2.0, 3.0, 4.0]' },
      { input: 'T=scale by 2, p=[1,2,3]', expected: '[2.0, 4.0, 6.0]' },
      { input: 'T=perspective w-row [0,0,0,2], p=[2,4,6]', expected: '[1.0, 2.0, 3.0]' },
    ],
  },

  {
    slug: 'bag-of-words',
    title: 'Bag of Words Vectorizer',
    difficulty: 'medium',
    topic: 'NLP',
    category: 'Data Processing',
    statement: `Turn tokenized documents into count vectors over a fixed vocabulary. Each document becomes a list aligned to the vocabulary, where position \\(j\\) holds the number of times \\(\\text{vocab}[j]\\) appears in that document.

Given a vocabulary list and a list of documents (each a list of tokens), return one count list per document. Tokens that are not in the vocabulary are ignored.

The output preserves the vocabulary's order, so the same word always lands in the same column across every document.`,
    examples: [
      {
        input: 'vocab = ["cat", "dog", "bird"]\ndocs = [["cat","dog","cat"], ["bird","cat"]]',
        output: '[[2, 1, 0], [1, 0, 1]]',
        explanation: 'First doc has two "cat" and one "dog"; second has one "cat" and one "bird".',
      },
      {
        input: 'vocab = ["a", "b"]\ndocs = [["a","a","a"], ["b"], ["c"]]',
        output: '[[3, 0], [0, 1], [0, 0]]',
        explanation: 'The token "c" is outside the vocabulary, so the third doc is all zeros.',
      },
    ],
    starterCode: {
      python: `def bag_of_words(vocab, docs):
    index = {token: j for j, token in enumerate(vocab)}
    vectors = []
    for doc in docs:
        counts = [0] * len(vocab)
        for token in doc:
            if token in index:
                counts[index[token]] += 1
        vectors.append(counts)
    return vectors


print(bag_of_words(["cat", "dog", "bird"], [["cat", "dog", "cat"], ["bird", "cat"]]))
`,
    },
    hints: [
      'Build a token-to-column lookup once so each count is an O(1) update.',
      'Start every document at a fresh zero vector the length of the vocabulary.',
      'Skip any token missing from the lookup instead of growing the vector.',
    ],
    tests: [
      { input: 'vocab=["x","y","z"], docs=[["x","y","z","x"]]', expected: '[[2, 1, 1]]' },
      { input: 'vocab=["red","blue"], docs=[["red"],["blue","blue"],["green"]]', expected: '[[1, 0], [0, 2], [0, 0]]' },
      { input: 'vocab=["the","fox"], docs=[["the","quick","fox"],["the","the"]]', expected: '[[1, 1], [2, 0]]' },
    ],
  },

  {
    slug: 'tfidf-vectorizer',
    title: 'TF-IDF Vectorizer',
    difficulty: 'hard',
    topic: 'NLP',
    category: 'Data Processing',
    statement: `Weight each token by how often it appears in a document against how rare it is across the corpus. For a vocabulary of size \\(V\\) and \\(N\\) documents, the term frequency is the count divided by the document length,

\\[ \\text{tf}_{ij} = \\frac{\\text{count}(j \\text{ in } i)}{|d_i|}, \\]

and the smoothed inverse document frequency follows scikit-learn,

\\[ \\text{idf}_j = \\ln\\!\\left(\\frac{1 + N}{1 + \\text{df}_j}\\right) + 1, \\]

where \\(\\text{df}_j\\) is the number of documents containing token \\(j\\). The raw weight is \\(\\text{tf}_{ij}\\,\\text{idf}_j\\); then L2-normalize each document vector. Round every entry to four decimals.`,
    examples: [
      {
        input: 'docs = [["cat","dog"], ["cat","cat"]]\nvocab = ["cat", "dog"]',
        output: '[[0.5797, 0.8148], [1.0, 0.0]]',
        explanation: '"dog" is rarer than "cat", so it carries more weight in the first document.',
      },
      {
        input: 'docs = [["a","b","c"], ["a","b"], ["a"]]\nvocab = ["a", "b", "c"]',
        output: '[[0.4254, 0.5478, 0.7203], [0.6134, 0.7898, 0.0], [1.0, 0.0, 0.0]]',
        explanation: '"a" appears everywhere so its idf is smallest; "c" is unique and dominates doc one.',
      },
    ],
    starterCode: {
      python: `import math


def tfidf_vectorizer(docs, vocab):
    n_docs = len(docs)
    index = {token: j for j, token in enumerate(vocab)}
    df = [0] * len(vocab)
    for doc in docs:
        for token in set(doc):
            if token in index:
                df[index[token]] += 1
    idf = [math.log((1 + n_docs) / (1 + df[j])) + 1 for j in range(len(vocab))]
    vectors = []
    for doc in docs:
        counts = [0] * len(vocab)
        for token in doc:
            if token in index:
                counts[index[token]] += 1
        length = len(doc)
        weighted = [(counts[j] / length) * idf[j] for j in range(len(vocab))]
        norm = math.sqrt(sum(v * v for v in weighted))
        if norm > 0:
            weighted = [v / norm for v in weighted]
        vectors.append([round(v, 4) for v in weighted])
    return vectors


print(tfidf_vectorizer([["cat", "dog"], ["cat", "cat"]], ["cat", "dog"]))
`,
    },
    hints: [
      'Count document frequency from the set of distinct tokens per document, not the raw list.',
      'Apply the smoothed idf formula exactly — the +1 outside the log keeps common words from vanishing.',
      'Divide each weighted vector by its own L2 norm before rounding.',
    ],
    tests: [
      { input: 'docs=[["x","y"],["x"]], vocab=["x","y"]', expected: '[[0.5797, 0.8148], [1.0, 0.0]]' },
      { input: 'docs=[["the","cat"],["the","dog"],["the","bird"]], vocab=["the","cat","dog"]', expected: '[[0.5085, 0.861, 0.0], [0.5085, 0.0, 0.861], [1.0, 0.0, 0.0]]' },
      { input: 'docs=[["a"],["b"]], vocab=["a","b"]', expected: '[[1.0, 0.0], [0.0, 1.0]]' },
    ],
  },

  {
    slug: 'text-chunking',
    title: 'Text Chunking with Overlap',
    difficulty: 'medium',
    topic: 'NLP',
    category: 'Data Processing',
    statement: `Split a long token list into overlapping windows, the way a retrieval pipeline prepares passages for embedding. A window of size \\(c\\) slides forward by a stride of \\(c - o\\) tokens, where \\(o\\) is the overlap.

Given a list of tokens, a \\(\\text{chunk\\_size}\\), and an \\(\\text{overlap}\\), return the list of chunks. Each chunk is a slice of up to \\(\\text{chunk\\_size}\\) tokens; the final chunk may be shorter when the tokens run out. Stop once a window reaches the end of the sequence.`,
    examples: [
      {
        input: 'tokens = [1,2,3,4,5,6,7]\nchunk_size = 3, overlap = 1',
        output: '[[1, 2, 3], [3, 4, 5], [5, 6, 7]]',
        explanation: 'Stride is 3 - 1 = 2, so each window shares its last token with the next window first.',
      },
      {
        input: 'tokens = ["a","b","c","d","e"]\nchunk_size = 2, overlap = 0',
        output: "[['a', 'b'], ['c', 'd'], ['e']]",
        explanation: 'With no overlap the windows tile the sequence; the last one is a single leftover token.',
      },
    ],
    starterCode: {
      python: `def text_chunking(tokens, chunk_size, overlap):
    step = chunk_size - overlap
    chunks = []
    start = 0
    n = len(tokens)
    while start < n:
        chunks.append(tokens[start:start + chunk_size])
        if start + chunk_size >= n:
            break
        start += step
    return chunks


print(text_chunking([1, 2, 3, 4, 5, 6, 7], 3, 1))
`,
    },
    hints: [
      'The stride between window starts is chunk_size minus overlap.',
      'Slicing past the end is safe in Python, so the final partial chunk falls out naturally.',
      'Break as soon as a window already reaches the last token to avoid emitting duplicates.',
    ],
    tests: [
      { input: 'tokens=[1,2,3,4,5], chunk_size=3, overlap=1', expected: '[[1, 2, 3], [3, 4, 5]]' },
      { input: 'tokens=[1,2,3,4,5,6], chunk_size=4, overlap=2', expected: '[[1, 2, 3, 4], [3, 4, 5, 6]]' },
      { input: 'tokens=[1,2,3], chunk_size=5, overlap=2', expected: '[[1, 2, 3]]' },
    ],
  },

  {
    slug: 'edit-distance',
    title: 'Levenshtein Edit Distance',
    difficulty: 'medium',
    topic: 'NLP',
    category: 'Data Processing',
    statement: `Measure how different two strings are by the fewest single-character edits — insertions, deletions, or substitutions — needed to turn one into the other.

Fill a table \\(D\\) where \\(D[i][j]\\) is the distance between the first \\(i\\) characters of \\(a\\) and the first \\(j\\) characters of \\(b\\):

\\[ D[i][j] = \\min\\big( D[i-1][j] + 1,; D[i][j-1] + 1,; D[i-1][j-1] + \\mathbb{1}[a_i \\neq b_j] \\big). \\]

The base cases are \\(D[i][0] = i\\) and \\(D[0][j] = j\\). Return the integer \\(D[m][n]\\).`,
    examples: [
      {
        input: 'a = "kitten", b = "sitting"',
        output: '3',
        explanation: 'Substitute k to s, substitute e to i, and insert g — three edits.',
      },
      {
        input: 'a = "flaw", b = "lawn"',
        output: '2',
        explanation: 'Delete the leading f, then append n.',
      },
    ],
    starterCode: {
      python: `def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[m][n]


print(edit_distance("kitten", "sitting"))
`,
    },
    hints: [
      'Seed the first row and column with 0..n and 0..m — those are pure insert or delete costs.',
      'The diagonal step costs 0 when the current characters match, 1 when they differ.',
      'Each cell only needs the three neighbours above, left, and diagonally up-left.',
    ],
    tests: [
      { input: 'a="", b="abc"', expected: '3' },
      { input: 'a="abc", b="abc"', expected: '0' },
      { input: 'a="sunday", b="saturday"', expected: '3' },
    ],
  },

  {
    slug: 'pad-sequences',
    title: 'Pad Sequences',
    difficulty: 'easy',
    topic: 'NLP',
    category: 'Data Processing',
    statement: `Batch models need equal-length inputs, so variable-length integer sequences get padded or truncated to a common length.

Given a list of integer sequences and a target \\(\\text{maxlen}\\), reshape each sequence to exactly \\(\\text{maxlen}\\) elements. Use post-padding and post-truncation: append zeros to the end of short sequences, and cut extra elements from the end of long ones. Return the list of equal-length lists.`,
    examples: [
      {
        input: 'seqs = [[1,2,3], [4,5], [6,7,8,9]]\nmaxlen = 3',
        output: '[[1, 2, 3], [4, 5, 0], [6, 7, 8]]',
        explanation: 'The second sequence gains a trailing zero; the third loses its last element.',
      },
      {
        input: 'seqs = [[1], [2,3]]\nmaxlen = 2',
        output: '[[1, 0], [2, 3]]',
        explanation: 'The first sequence is padded with one zero; the second already fits.',
      },
    ],
    starterCode: {
      python: `def pad_sequences(seqs, maxlen):
    result = []
    for seq in seqs:
        if len(seq) >= maxlen:
            result.append(list(seq[:maxlen]))
        else:
            result.append(list(seq) + [0] * (maxlen - len(seq)))
    return result


print(pad_sequences([[1, 2, 3], [4, 5], [6, 7, 8, 9]], 3))
`,
    },
    hints: [
      'Compare each sequence length against maxlen to decide pad versus truncate.',
      'Post-truncation keeps the front, so slice the first maxlen elements.',
      'Post-padding appends zeros, so add them after the existing tokens.',
    ],
    tests: [
      { input: 'seqs=[[1,2,3,4,5]], maxlen=3', expected: '[[1, 2, 3]]' },
      { input: 'seqs=[[7]], maxlen=4', expected: '[[7, 0, 0, 0]]' },
      { input: 'seqs=[[1,2],[3,4,5,6]], maxlen=3', expected: '[[1, 2, 0], [3, 4, 5]]' },
    ],
  },

  {
    slug: 'one-hot-encode-categories',
    title: 'One-Hot Encode Categories',
    difficulty: 'easy',
    topic: 'Data Processing',
    category: 'Data Processing',
    statement: `Convert categorical labels into binary indicator rows that a model can consume. Each distinct category becomes a column, and every label turns into a row with a single \\(1\\) in its category's column and \\(0\\) elsewhere.

Given a list of labels, use the sorted unique categories as the column order. Return one 0/1 row per label, in the same order the labels arrived.`,
    examples: [
      {
        input: 'labels = ["cat","dog","cat","bird"]',
        output: '[[0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0]]',
        explanation: 'Sorted categories are bird, cat, dog — so "cat" lights up the middle column.',
      },
      {
        input: 'labels = ["b","a","b"]',
        output: '[[0, 1], [1, 0], [0, 1]]',
        explanation: 'Columns follow sorted order a, b regardless of first appearance.',
      },
    ],
    starterCode: {
      python: `def one_hot_encode_categories(labels):
    categories = sorted(set(labels))
    index = {category: j for j, category in enumerate(categories)}
    rows = []
    for label in labels:
        row = [0] * len(categories)
        row[index[label]] = 1
        rows.append(row)
    return rows


print(one_hot_encode_categories(["cat", "dog", "cat", "bird"]))
`,
    },
    hints: [
      'Sort the unique labels to fix a stable column order.',
      'Map each category to its column index once, then reuse it per row.',
      'Every row is all zeros except for the single column of its own label.',
    ],
    tests: [
      { input: 'labels=["x"]', expected: '[[1]]' },
      { input: 'labels=["red","green","blue"]', expected: '[[0, 0, 1], [0, 1, 0], [1, 0, 0]]' },
      { input: 'labels=["a","a","a"]', expected: '[[1], [1], [1]]' },
    ],
  },

  {
    slug: 'impute-missing',
    title: 'Impute Missing Values (Mean)',
    difficulty: 'easy',
    topic: 'Data Processing',
    category: 'Data Processing',
    statement: `Fill gaps in a numeric column by substituting the mean of the values that are present — the simplest imputation a preprocessing step can apply.

Given a list that may contain \\(\\text{None}\\), compute the mean of the non-missing entries, rounded to four decimals, and replace each \\(\\text{None}\\) with it. Leave the present values untouched. Return the new list.`,
    examples: [
      {
        input: 'values = [1, 2, None, 4]',
        output: '[1, 2, 2.3333, 4]',
        explanation: 'The mean of 1, 2, 4 is 2.3333, which fills the single gap.',
      },
      {
        input: 'values = [None, 10, 20]',
        output: '[15.0, 10, 20]',
        explanation: 'The mean of the two present values is 15.0.',
      },
    ],
    starterCode: {
      python: `def impute_missing(values):
    present = [v for v in values if v is not None]
    mean = round(sum(present) / len(present), 4)
    return [mean if v is None else v for v in values]


print(impute_missing([1, 2, None, 4]))
`,
    },
    hints: [
      'Collect the non-None values first so the mean ignores the gaps.',
      'Round the mean to four decimals before substituting it.',
      'Keep existing values exactly as they are; only None gets replaced.',
    ],
    tests: [
      { input: 'values=[5, None, 5]', expected: '[5, 5.0, 5]' },
      { input: 'values=[1, 2, 3]', expected: '[1, 2, 3]' },
      { input: 'values=[None, 1, 2, None]', expected: '[1.5, 1, 2, 1.5]' },
    ],
  },

  {
    slug: 'binning',
    title: 'Equal-Width Binning',
    difficulty: 'medium',
    topic: 'Data Processing',
    category: 'Data Processing',
    statement: `Discretize a continuous feature into equal-width buckets. Split the range \\([\\min, \\max]\\) into \\(b\\) bins of equal width \\(w = (\\max - \\min) / b\\), then assign each value the index of the bin it lands in.

Given the data and the number of bins, return a bin index in \\(0 \\ldots b-1\\) for each value. A value's index is \\(\\lfloor (x - \\min) / w \\rfloor\\); the maximum value sits exactly on the upper edge, so place it in the last bin.`,
    examples: [
      {
        input: 'data = [1,2,3,4,5,6,7,8,9,10], bins = 2',
        output: '[0, 0, 0, 0, 0, 1, 1, 1, 1, 1]',
        explanation: 'Width is 4.5; values 1-5 fall in bin 0, values 6-10 in bin 1.',
      },
      {
        input: 'data = [0,5,10], bins = 5',
        output: '[0, 2, 4]',
        explanation: 'Width is 2; the midpoint lands in bin 2 and the max sits in the last bin.',
      },
    ],
    starterCode: {
      python: `def binning(data, bins):
    low, high = min(data), max(data)
    width = (high - low) / bins
    indices = []
    for x in data:
        if x == high:
            indices.append(bins - 1)
        else:
            indices.append(int((x - low) / width))
    return indices


print(binning([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2))
`,
    },
    hints: [
      'Bin width is the span divided by the number of bins.',
      'The maximum value would overflow to index bins, so special-case it into the last bin.',
      'Use integer floor of (x - min) / width for everything below the maximum.',
    ],
    tests: [
      { input: 'data=[1,2,3,4], bins=2', expected: '[0, 0, 1, 1]' },
      { input: 'data=[0,1,2,3,4,5,6,7,8,9,10], bins=5', expected: '[0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4]' },
      { input: 'data=[10,20,30,40], bins=4', expected: '[0, 1, 2, 3]' },
    ],
  },

  {
    slug: 'batch-generator',
    title: 'Mini-Batch Generator',
    difficulty: 'easy',
    topic: 'Data Processing',
    category: 'Data Processing',
    statement: `Training loops consume data in mini-batches rather than all at once. Slice a dataset into consecutive batches of a fixed size, keeping the original order.

Given a list and a \\(\\text{batch\\_size}\\), return a list of batches where each batch holds up to \\(\\text{batch\\_size}\\) consecutive elements. The final batch may be smaller when the data does not divide evenly.`,
    examples: [
      {
        input: 'data = [1,2,3,4,5], batch_size = 2',
        output: '[[1, 2], [3, 4], [5]]',
        explanation: 'Two full batches of two, then a final batch with the single leftover.',
      },
      {
        input: 'data = [1,2,3,4], batch_size = 2',
        output: '[[1, 2], [3, 4]]',
        explanation: 'The data divides evenly, so every batch is full.',
      },
    ],
    starterCode: {
      python: `def batch_generator(data, batch_size):
    return [data[i:i + batch_size] for i in range(0, len(data), batch_size)]


print(batch_generator([1, 2, 3, 4, 5], 2))
`,
    },
    hints: [
      'Step through the data in jumps of batch_size starting from index 0.',
      'Slicing past the end is safe, so the trailing partial batch needs no special handling.',
      'Preserve the input order — do not shuffle inside the splitter.',
    ],
    tests: [
      { input: 'data=[1,2,3,4,5,6,7], batch_size=3', expected: '[[1, 2, 3], [4, 5, 6], [7]]' },
      { input: 'data=[1], batch_size=4', expected: '[[1]]' },
      { input: 'data=[1,2,3,4,5,6], batch_size=2', expected: '[[1, 2], [3, 4], [5, 6]]' },
    ],
  },

  {
    slug: 'differencing',
    title: 'First-Order Differencing',
    difficulty: 'easy',
    topic: 'Time Series',
    category: 'Time Series',
    statement: `Remove trend from a time series by replacing each point with its change from the previous step. The first difference of a series \\(x\\) is

\\[ \\Delta x_t = x_t - x_{t-1}, \\qquad t = 1, \\ldots, n-1, \\]

which has length \\(n - 1\\). Return the differenced series, rounding any floating-point result to four decimals.`,
    examples: [
      {
        input: 'series = [1, 3, 6, 10]',
        output: '[2, 3, 4]',
        explanation: 'Consecutive gaps are 2, 3, and 4 — the series of triangular numbers.',
      },
      {
        input: 'series = [2.5, 2.0, 3.5]',
        output: '[-0.5, 1.5]',
        explanation: 'The level drops by 0.5 then rises by 1.5.',
      },
    ],
    starterCode: {
      python: `def differencing(series):
    diffs = [series[t] - series[t - 1] for t in range(1, len(series))]
    return [round(d, 4) for d in diffs]


print(differencing([1, 3, 6, 10]))
`,
    },
    hints: [
      'The output is one element shorter than the input.',
      'Each entry subtracts the previous value from the current one.',
      'Rounding integers leaves them unchanged, so a single round call is safe for both cases.',
    ],
    tests: [
      { input: 'series=[5,5,5,5]', expected: '[0, 0, 0]' },
      { input: 'series=[1,2,4,7,11]', expected: '[1, 2, 3, 4]' },
      { input: 'series=[10.0, 7.5, 5.0]', expected: '[-2.5, -2.5]' },
    ],
  },

  {
    slug: 'percent-change',
    title: 'Percent Change',
    difficulty: 'easy',
    topic: 'Time Series',
    category: 'Time Series',
    statement: `Express each step of a series as a percentage move from the previous value — the standard way to compare returns across different scales. The percent change at step \\(t\\) is

\\[ r_t = \\frac{x_t - x_{t-1}}{x_{t-1}} \\times 100, \\qquad t = 1, \\ldots, n-1. \\]

Return the list of percent changes, length \\(n - 1\\), each rounded to four decimals.`,
    examples: [
      {
        input: 'series = [100, 110, 99]',
        output: '[10.0, -10.0]',
        explanation: 'A rise from 100 to 110 is +10%; a fall from 110 to 99 is -10%.',
      },
      {
        input: 'series = [50, 75]',
        output: '[50.0]',
        explanation: 'Growing from 50 to 75 is a 50% increase.',
      },
    ],
    starterCode: {
      python: `def percent_change(series):
    changes = []
    for t in range(1, len(series)):
        changes.append(round((series[t] - series[t - 1]) / series[t - 1] * 100, 4))
    return changes


print(percent_change([100, 110, 99]))
`,
    },
    hints: [
      'Divide the step difference by the previous value, not the current one.',
      'Multiply by 100 to express the ratio as a percentage.',
      'The result has one fewer element than the input series.',
    ],
    tests: [
      { input: 'series=[10,20,10]', expected: '[100.0, -50.0]' },
      { input: 'series=[200,150,300]', expected: '[-25.0, 100.0]' },
      { input: 'series=[1,2,3]', expected: '[100.0, 50.0]' },
    ],
  },

  {
    slug: 'rolling-standard-deviation',
    title: 'Rolling Standard Deviation',
    difficulty: 'medium',
    topic: 'Time Series',
    category: 'Time Series',
    statement: `Track local volatility by computing the standard deviation inside a sliding window. For a window of size \\(w\\) ending at each position, the population standard deviation is

\\[ \\sigma = \\sqrt{\\frac{1}{w} \\sum_{i} (x_i - \\bar{x})^2}, \\]

using \\(\\text{ddof} = 0\\) and the window mean \\(\\bar{x}\\). Slide the window one step at a time over every full window and return the rounded values. The output has length \\(n - w + 1\\); round each to four decimals.`,
    examples: [
      {
        input: 'data = [1,2,3,4,5], w = 3',
        output: '[0.8165, 0.8165, 0.8165]',
        explanation: 'Every length-3 window has the same spread, so the volatility is constant.',
      },
      {
        input: 'data = [2,4,6,8], w = 2',
        output: '[1.0, 1.0, 1.0]',
        explanation: 'Each adjacent pair differs by 2, giving a population std of 1.0.',
      },
    ],
    starterCode: {
      python: `import math


def rolling_std(data, w):
    result = []
    for i in range(len(data) - w + 1):
        window = data[i:i + w]
        mean = sum(window) / w
        variance = sum((x - mean) ** 2 for x in window) / w
        result.append(round(math.sqrt(variance), 4))
    return result


print(rolling_std([1, 2, 3, 4, 5], 3))
`,
    },
    hints: [
      'Divide the squared deviations by w, not w - 1 — this is the population variance.',
      'Recompute the window mean for each slice before measuring spread.',
      'There are exactly n - w + 1 full windows to report.',
    ],
    tests: [
      { input: 'data=[1,1,1,1], w=2', expected: '[0.0, 0.0, 0.0]' },
      { input: 'data=[1,2,3,4,5,6], w=3', expected: '[0.8165, 0.8165, 0.8165, 0.8165]' },
      { input: 'data=[10,12,23,23,16,23,21,16], w=4', expected: '[6.0415, 4.717, 3.0311, 2.8614, 3.0822]' },
    ],
  },

  {
    slug: 'autocorrelation',
    title: 'Autocorrelation at Lag k',
    difficulty: 'medium',
    topic: 'Time Series',
    category: 'Time Series',
    statement: `Measure how a series correlates with a shifted copy of itself. The autocorrelation at lag \\(k\\) is

\\[ \\rho_k = \\frac{\\sum_{t=k}^{n-1} (x_t - \\bar{x})(x_{t-k} - \\bar{x})}{\\sum_{t=0}^{n-1} (x_t - \\bar{x})^2}, \\]

where \\(\\bar{x}\\) is the mean of the whole series. Values near \\(1\\) mean strong repetition at that lag; values near \\(0\\) mean little structure. Return \\(\\rho_k\\) rounded to four decimals.`,
    examples: [
      {
        input: 'series = [1,2,3,4,5], k = 1',
        output: '0.4',
        explanation: 'A steady trend gives moderate positive correlation at lag 1.',
      },
      {
        input: 'series = [1,2,3,4,5], k = 2',
        output: '-0.1',
        explanation: 'At lag 2 the overlap shrinks and the correlation turns slightly negative.',
      },
    ],
    starterCode: {
      python: `def autocorrelation(series, k):
    n = len(series)
    mean = sum(series) / n
    numerator = sum((series[t] - mean) * (series[t - k] - mean) for t in range(k, n))
    denominator = sum((x - mean) ** 2 for x in series)
    return round(numerator / denominator, 4)


print(autocorrelation([1, 2, 3, 4, 5], 1))
`,
    },
    hints: [
      'Use one global mean for the whole series, not a per-window mean.',
      'The numerator sums products of deviations k steps apart, starting at index k.',
      'The denominator is the total sum of squared deviations across all points.',
    ],
    tests: [
      { input: 'series=[1,2,1,2,1,2], k=1', expected: '-0.8333' },
      { input: 'series=[1,2,3,4,5,6], k=1', expected: '0.5' },
      { input: 'series=[3,1,4,1,5,9,2,6], k=2', expected: '0.0443' },
    ],
  },

  {
    slug: 'linear-regression-closed-form',
    title: 'Linear Regression (Closed Form, 1D)',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Fit a line \\(\\hat{y} = w x + b\\) to one-dimensional data with the closed-form least-squares solution — no iteration needed. The slope is the covariance of \\(x\\) and \\(y\\) divided by the variance of \\(x\\), and the intercept follows from the means:

\\[ w = \\frac{\\mathrm{cov}(x, y)}{\\mathrm{var}(x)} = \\frac{\\sum_i (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum_i (x_i - \\bar{x})^2}, \\qquad b = \\bar{y} - w \\bar{x}. \\]

Return the pair \\((w, b)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [3, 5, 7, 9]',
        output: '(2.0, 1.0)',
        explanation: 'The points lie exactly on y = 2x + 1, so the closed form recovers it exactly.',
      },
      {
        input: 'xs = [0, 1, 2, 3], ys = [1, 2, 3, 4]',
        output: '(1.0, 1.0)',
        explanation: 'A unit slope through (0, 1): w = 1, b = 1.',
      },
    ],
    starterCode: {
      python: `def linear_regression_closed_form(xs, ys):
    n = len(xs)
    xbar = sum(xs) / n
    ybar = sum(ys) / n
    cov = sum((x - xbar) * (y - ybar) for x, y in zip(xs, ys)) / n
    var = sum((x - xbar) ** 2 for x in xs) / n
    w = cov / var
    b = ybar - w * xbar
    return (round(w, 4), round(b, 4))


print(linear_regression_closed_form([1, 2, 3, 4], [3, 5, 7, 9]))
`,
    },
    hints: [
      'Compute the means first, then build the covariance and variance from deviations.',
      'The /n in both covariance and variance cancels, so any consistent scaling of the two gives the same w.',
      'Once w is known, the intercept is just ybar - w * xbar.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[3,5,7,9]', expected: '(2.0, 1.0)' },
      { input: 'xs=[1,2,3,4,5], ys=[2,4,5,4,5]', expected: '(0.6, 2.2)' },
      { input: 'xs=[0,1,2], ys=[1,1,1]', expected: '(0.0, 1.0)' },
    ],
  },

  {
    slug: 'logistic-regression-training',
    title: 'Logistic Regression Training (Weights)',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Train a binary logistic classifier with full-batch gradient descent and return the learned parameters rather than predictions. The model is \\(p_i = \\sigma(\\mathbf{w}^\\top \\mathbf{x}_i + b)\\) with \\(\\sigma(z) = 1 / (1 + e^{-z})\\), trained on the binary cross-entropy loss whose gradient simplifies to \\((p_i - y_i)\\,\\mathbf{x}_i\\) averaged over the batch:

\\[ \\mathbf{w} \\leftarrow \\mathbf{w} - \\eta \\cdot \\frac{1}{n} \\sum_i (p_i - y_i)\\,\\mathbf{x}_i, \\qquad b \\leftarrow b - \\eta \\cdot \\frac{1}{n} \\sum_i (p_i - y_i). \\]

Initialize \\(\\mathbf{w} = \\mathbf{0}\\) and \\(b = 0\\) so the run is deterministic. Return the final \\((\\text{weights list}, b)\\) rounded to four decimals.`,
    examples: [
      {
        input: 'X = [[-1], [1]], y = [0, 1]\nlr = 0.5, steps = 100',
        output: '([3.87], 0.0)',
        explanation: 'Symmetric data around 0 keeps the bias at 0 while the weight grows to separate the classes.',
      },
      {
        input: 'X = [[0], [2]], y = [0, 1]\nlr = 0.5, steps = 50',
        output: '([2.5821], -1.9668)',
        explanation: 'The boundary shifts toward x = 1, so the bias becomes negative.',
      },
    ],
    starterCode: {
      python: `import math


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def logistic_regression_train(X, y, lr=0.5, steps=100):
    n = len(X)
    d = len(X[0])
    w = [0.0] * d
    b = 0.0
    for _ in range(steps):
        gw = [0.0] * d
        gb = 0.0
        for xi, yi in zip(X, y):
            z = sum(w[j] * xi[j] for j in range(d)) + b
            p = sigmoid(z)
            diff = p - yi
            for j in range(d):
                gw[j] += diff * xi[j]
            gb += diff
        for j in range(d):
            w[j] -= lr * gw[j] / n
        b -= lr * gb / n
    return ([round(v, 4) for v in w], round(b, 4))


print(logistic_regression_train([[-1], [1]], [0, 1], 0.5, 100))
`,
    },
    hints: [
      'The cross-entropy gradient collapses to (p - y) * x — no log term remains in the update.',
      'Accumulate gradients over every sample, then divide by n before stepping.',
      'Zero initialization makes the run reproducible; the same lr and steps always yield the same weights.',
    ],
    tests: [
      { input: 'X=[[-1],[1]], y=[0,1], lr=0.5, steps=100', expected: '([3.87], 0.0)' },
      { input: 'X=[[0],[2]], y=[0,1], lr=0.5, steps=50', expected: '([2.5821], -1.9668)' },
      { input: 'X=[[-2],[-1],[1],[2]], y=[0,0,1,1], lr=0.3, steps=200', expected: '([3.5328], 0.0)' },
    ],
  },

  {
    slug: 'majority-classifier',
    title: 'Majority-Class Baseline',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Build the simplest possible baseline: ignore the features entirely and predict the most frequent training label for every test point. This is the bar any real model must clear.

Count the labels in the training set, pick the one with the highest count, and break ties by choosing the smallest label. Return a list of predictions whose length equals the number of test points.`,
    examples: [
      {
        input: 'train_labels = [1, 1, 0, 1], test = [5, 6, 7]',
        output: '[1, 1, 1]',
        explanation: 'Label 1 appears three times versus one, so every test point is predicted 1.',
      },
      {
        input: 'train_labels = [0, 1, 0, 1], test = [9]',
        output: '[0]',
        explanation: 'A 2-2 tie resolves to the smaller label, 0.',
      },
    ],
    starterCode: {
      python: `from collections import Counter


def majority_classifier(train_labels, test):
    counts = Counter(train_labels)
    best = max(counts, key=lambda k: (counts[k], -k))
    return [best] * len(test)


print(majority_classifier([1, 1, 0, 1], [5, 6, 7]))
`,
    },
    hints: [
      'A Counter over the training labels gives you the frequencies in one pass.',
      'For ties, rank by (count, -label) so the higher count wins and the smaller label breaks ties.',
      'The test values themselves do not matter — only how many predictions to emit.',
    ],
    tests: [
      { input: 'train=[1,1,0,1], test=[5,6,7]', expected: '[1, 1, 1]' },
      { input: 'train=[0,1,0,1], test=[9]', expected: '[0]' },
      { input: 'train=[2,2,2,3], test=[0,0]', expected: '[2, 2]' },
    ],
  },

  {
    slug: 'decision-tree-split',
    title: 'Best Decision Tree Split (Gini)',
    difficulty: 'hard',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `A decision tree chooses where to split by minimizing impurity. Given a 1D feature and binary labels, consider every threshold that sits at the midpoint between adjacent distinct sorted values. Each threshold partitions the data into a left side (\\(x \\le t\\)) and a right side (\\(x > t\\)).

The Gini impurity of a node with class proportions \\(p_c\\) is

\\[ G = 1 - \\sum_c p_c^2, \\]

and the quality of a split is the size-weighted average of the two sides' impurities:

\\[ G_{\\text{split}} = \\frac{n_L}{n} G_L + \\frac{n_R}{n} G_R. \\]

Return the \\((\\text{best threshold}, \\text{best weighted Gini})\\) that minimizes \\(G_{\\text{split}}\\), each rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [1, 2, 3, 4], ys = [0, 0, 1, 1]',
        output: '(2.5, 0.0)',
        explanation: 'Splitting at 2.5 makes both sides pure, so the weighted Gini is 0.',
      },
      {
        input: 'xs = [1, 2, 3, 4], ys = [0, 1, 0, 1]',
        output: '(1.5, 0.3333)',
        explanation: 'No clean split exists; the best leaves one side pure and the other mixed.',
      },
    ],
    starterCode: {
      python: `from collections import Counter


def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    counts = Counter(labels)
    return 1.0 - sum((c / n) ** 2 for c in counts.values())


def best_split(xs, ys):
    values = sorted(set(xs))
    best_thr = None
    best_g = None
    n = len(xs)
    for i in range(len(values) - 1):
        thr = (values[i] + values[i + 1]) / 2
        left = [ys[j] for j in range(n) if xs[j] <= thr]
        right = [ys[j] for j in range(n) if xs[j] > thr]
        g = len(left) / n * gini(left) + len(right) / n * gini(right)
        if best_g is None or g < best_g:
            best_g = g
            best_thr = thr
    return (round(best_thr, 4), round(best_g, 4))


print(best_split([1, 2, 3, 4], [0, 0, 1, 1]))
`,
    },
    hints: [
      'Candidate thresholds are midpoints between consecutive distinct sorted feature values.',
      'Weight each side by its fraction of the samples — a tiny pure side should not dominate.',
      'A perfectly separating split drives the weighted Gini to exactly 0.',
    ],
    tests: [
      { input: 'xs=[1,2,3,4], ys=[0,0,1,1]', expected: '(2.5, 0.0)' },
      { input: 'xs=[1,2,3,4,5], ys=[0,0,1,1,1]', expected: '(2.5, 0.0)' },
      { input: 'xs=[1,2,3,4], ys=[0,1,0,1]', expected: '(1.5, 0.3333)' },
    ],
  },

  {
    slug: 'entropy-node',
    title: 'Entropy of a Node',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `Information gain in a decision tree is measured against Shannon entropy. For a node holding class labels with proportions \\(p_c\\), the entropy in bits is

\\[ H = -\\sum_c p_c \\log_2 p_c. \\]

A pure node (one class) has entropy 0; a perfectly balanced two-class node has entropy 1. Count the labels, turn the counts into proportions, and return \\(H\\) rounded to four decimals.`,
    examples: [
      {
        input: 'labels = [0, 0, 1, 1]',
        output: '1.0',
        explanation: 'A 50/50 split over two classes is maximally uncertain: 1 bit.',
      },
      {
        input: 'labels = [0, 0, 0, 1]',
        output: '0.8113',
        explanation: 'A 3:1 split is less uncertain than balanced, so entropy drops below 1.',
      },
    ],
    starterCode: {
      python: `import math
from collections import Counter


def node_entropy(labels):
    n = len(labels)
    counts = Counter(labels)
    h = -sum((c / n) * math.log2(c / n) for c in counts.values())
    h = round(h, 4)
    return h if h != 0.0 else 0.0


print(node_entropy([0, 0, 1, 1]))
print(node_entropy([0, 0, 0, 1]))
`,
    },
    hints: [
      'Use log base 2 so the result is in bits — math.log2 does this directly.',
      'A pure node has a single proportion of 1.0, and 1 * log2(1) = 0.',
      'Round at the end, and normalize a -0.0 result to 0.0 for a clean display.',
    ],
    tests: [
      { input: 'labels=[0,0,1,1]', expected: '1.0' },
      { input: 'labels=[0,0,0,1]', expected: '0.8113' },
      { input: 'labels=[1,1,1,1]', expected: '0.0' },
    ],
  },

  {
    slug: 'gaussian-naive-bayes-predict',
    title: 'Gaussian Naive Bayes Prediction',
    difficulty: 'hard',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `A Gaussian naive Bayes classifier already has its parameters fit. For each class it stores per-feature means and variances plus a prior. To classify a query \\(\\mathbf{x}\\), score each class by the log-posterior (dropping the shared evidence term):

\\[ \\text{score}(c) = \\log P(c) + \\sum_j \\log \\mathcal{N}(x_j \\mid \\mu_{cj}, \\sigma^2_{cj}), \\qquad \\log \\mathcal{N}(x \\mid \\mu, \\sigma^2) = -\\tfrac{1}{2}\\log(2\\pi\\sigma^2) - \\frac{(x - \\mu)^2}{2\\sigma^2}. \\]

The parameters arrive as a dict mapping each class key to \\(\\{\\text{'mean'}, \\text{'var'}, \\text{'prior'}\\}\\). Return the class key with the highest score (scan classes in sorted order so ties favor the smaller key).`,
    examples: [
      {
        input: "params = {0: {'mean':[0,0],'var':[1,1],'prior':0.5}, 1: {'mean':[3,3],'var':[1,1],'prior':0.5}}\nx = [0.5, 0.5]",
        output: '0',
        explanation: "The query sits near class 0's mean, so its log-posterior is highest.",
      },
      {
        input: 'x = [2.5, 3.0] with the same params',
        output: '1',
        explanation: "Now the point is closer to class 1's mean at (3, 3).",
      },
    ],
    starterCode: {
      python: `import math


def gnb_predict(params, x):
    best_class = None
    best_score = None
    for cls in sorted(params.keys()):
        p = params[cls]
        score = math.log(p['prior'])
        for j in range(len(x)):
            mean = p['mean'][j]
            var = p['var'][j]
            score += -0.5 * math.log(2 * math.pi * var) - (x[j] - mean) ** 2 / (2 * var)
        if best_score is None or score > best_score:
            best_score = score
            best_class = cls
    return best_class


params = {
    0: {'mean': [0.0, 0.0], 'var': [1.0, 1.0], 'prior': 0.5},
    1: {'mean': [3.0, 3.0], 'var': [1.0, 1.0], 'prior': 0.5},
}
print(gnb_predict(params, [0.5, 0.5]))
`,
    },
    hints: [
      'Work in log-space — summing log-probabilities avoids underflow and turns the product into a sum.',
      'The naive assumption lets you add each feature log-density independently.',
      'Iterate classes in sorted order and keep a strict greater-than so the first (smallest) key wins ties.',
    ],
    tests: [
      { input: 'class0 mean (0,0), class1 mean (3,3); x=[0,0]', expected: '0' },
      { input: 'same params; x=[3,3]', expected: '1' },
      { input: '{0:mean[1],var[1],prior0.7; 1:mean[5],var[1],prior0.3}; x=[2]', expected: '0' },
    ],
  },

  {
    slug: 'random-forest-vote',
    title: 'Random Forest Majority Vote',
    difficulty: 'easy',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `A random forest combines many trees by voting. You are given a list of per-tree prediction lists — every tree predicts a label for the same set of samples, so all the inner lists share one length.

For each sample, collect the predictions across all trees and return the majority label, breaking ties toward the smallest label. The result is one prediction per sample.`,
    examples: [
      {
        input: 'tree_preds = [[0,1,1], [0,1,0], [1,1,0]]',
        output: '[0, 1, 0]',
        explanation: 'Sample 0 votes 0,0,1 -> 0; sample 1 votes 1,1,1 -> 1; sample 2 votes 1,0,0 -> 0.',
      },
      {
        input: 'tree_preds = [[1,0], [1,1], [0,0]]',
        output: '[1, 0]',
        explanation: 'Sample 0: 1,1,0 -> 1. Sample 1: 0,1,0 -> 0.',
      },
    ],
    starterCode: {
      python: `from collections import Counter


def rf_vote(tree_preds):
    n = len(tree_preds[0])
    result = []
    for i in range(n):
        column = [tree[i] for tree in tree_preds]
        counts = Counter(column)
        best = max(counts, key=lambda k: (counts[k], -k))
        result.append(best)
    return result


print(rf_vote([[0, 1, 1], [0, 1, 0], [1, 1, 0]]))
`,
    },
    hints: [
      'Transpose your thinking: for each sample index, gather that column across all trees.',
      'A Counter over the column gives the vote tally in one step.',
      'Break ties with (count, -label) so the smaller label wins an even split.',
    ],
    tests: [
      { input: 'preds=[[0,1,1],[0,1,0],[1,1,0]]', expected: '[0, 1, 0]' },
      { input: 'preds=[[1,0],[1,1],[0,0]]', expected: '[1, 0]' },
      { input: 'preds=[[2,2],[3,2],[2,3]]', expected: '[2, 2]' },
    ],
  },

  {
    slug: 'kfold-split',
    title: 'K-Fold Split Indices',
    difficulty: 'medium',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `K-fold cross-validation rotates which slice of the data is held out. Without shuffling, the \\(n\\) indices \\(0 \\dots n-1\\) are divided into \\(k\\) contiguous test blocks; each fold's training set is everything else.

When \\(n\\) is not divisible by \\(k\\), the first \\(n \\bmod k\\) folds take one extra sample, matching the numpy convention where fold sizes are \\(\\lfloor n/k \\rfloor + 1\\) for the first \\(n \\bmod k\\) folds and \\(\\lfloor n/k \\rfloor\\) afterward.

Return a list of \\(k\\) pairs \\([\\text{train\\_indices}, \\text{test\\_indices}]\\), in fold order.`,
    examples: [
      {
        input: 'n = 6, k = 3',
        output: '[[[2, 3, 4, 5], [0, 1]], [[0, 1, 4, 5], [2, 3]], [[0, 1, 2, 3], [4, 5]]]',
        explanation: 'Six samples split evenly into three test blocks of two.',
      },
      {
        input: 'n = 5, k = 2',
        output: '[[[3, 4], [0, 1, 2]], [[0, 1, 2], [3, 4]]]',
        explanation: '5 mod 2 = 1, so the first fold gets the extra sample (size 3).',
      },
    ],
    starterCode: {
      python: `def kfold_split(n, k):
    fold_sizes = [n // k + (1 if i < n % k else 0) for i in range(k)]
    result = []
    start = 0
    for size in fold_sizes:
        test = list(range(start, start + size))
        train = list(range(0, start)) + list(range(start + size, n))
        result.append([train, test])
        start += size
    return result


print(kfold_split(6, 3))
`,
    },
    hints: [
      'Precompute the fold sizes: the first n % k folds get one extra index each.',
      'Walk a running start offset so each test block is a contiguous range.',
      'The training set is simply every index outside the current test block.',
    ],
    tests: [
      { input: 'n=6, k=3', expected: '[[[2, 3, 4, 5], [0, 1]], [[0, 1, 4, 5], [2, 3]], [[0, 1, 2, 3], [4, 5]]]' },
      { input: 'n=5, k=2', expected: '[[[3, 4], [0, 1, 2]], [[0, 1, 2], [3, 4]]]' },
      { input: 'n=4, k=4', expected: '[[[1, 2, 3], [0]], [[0, 2, 3], [1]], [[0, 1, 3], [2]], [[0, 1, 2], [3]]]' },
    ],
  },

  {
    slug: 'stratified-split',
    title: 'Stratified Train/Test Split',
    difficulty: 'hard',
    topic: 'Classical ML',
    category: 'Classical ML',
    statement: `A stratified split preserves each class's proportion across train and test. Given a label list and a test fraction, process the classes in sorted order. For each class, look at its sample indices in their original order and send the first \\(\\text{round}(\\text{count} \\times \\text{test\\_fraction})\\) of them to the test set; the rest go to train.

This is deterministic — no randomness. Return \\((\\text{train\\_indices}, \\text{test\\_indices})\\), each sorted ascending.`,
    examples: [
      {
        input: 'labels = [0,0,0,0,1,1,1,1], test_fraction = 0.5',
        output: '([2, 3, 6, 7], [0, 1, 4, 5])',
        explanation: 'Each class of four sends its first two indices to test.',
      },
      {
        input: 'labels = [0,1,0,1,0,1], test_fraction = 0.5',
        output: '([4, 5], [0, 1, 2, 3])',
        explanation: 'Each class has three samples; round(3 * 0.5) = 2 go to test per class.',
      },
    ],
    starterCode: {
      python: `def stratified_split(labels, test_fraction):
    test = []
    for cls in sorted(set(labels)):
        idxs = [i for i in range(len(labels)) if labels[i] == cls]
        n_test = round(len(idxs) * test_fraction)
        test.extend(idxs[:n_test])
    test_set = set(test)
    train = [i for i in range(len(labels)) if i not in test_set]
    return (sorted(train), sorted(test))


print(stratified_split([0, 0, 0, 0, 1, 1, 1, 1], 0.5))
`,
    },
    hints: [
      'Group indices by class first, keeping each group in original order.',
      'round(count * test_fraction) decides how many of that class indices go to test.',
      'Whatever is not in the test set is train — then sort both for a stable output.',
    ],
    tests: [
      { input: 'labels=[0,0,0,0,1,1,1,1], frac=0.5', expected: '([2, 3, 6, 7], [0, 1, 4, 5])' },
      { input: 'labels=[0,1,0,1,0,1], frac=0.5', expected: '([4, 5], [0, 1, 2, 3])' },
      { input: 'labels=[0,0,1,1,1,1], frac=0.5', expected: '([1, 4, 5], [0, 2, 3])' },
    ],
  },

  {
    slug: 'k-means-assignment',
    title: 'K-Means Assignment Step',
    difficulty: 'easy',
    topic: 'Clustering',
    category: 'Clustering',
    statement: `The assignment step of K-means sends each point to its nearest centroid. Given a list of points and a list of centroids, label every point with the index of the closest centroid under squared Euclidean distance

\\[ \\lVert \\mathbf{x} - \\boldsymbol{\\mu}_c \\rVert^2 = \\sum_j (x_j - \\mu_{cj})^2. \\]

Comparing squared distances is enough — the square root would not change which centroid is nearest. Return the list of labels.`,
    examples: [
      {
        input: 'points = [[0,0],[1,1],[10,10]], centroids = [[0,0],[10,10]]',
        output: '[0, 0, 1]',
        explanation: 'The first two points are nearest centroid 0; the third is nearest centroid 1.',
      },
      {
        input: 'points = [[1],[5],[9]], centroids = [[0],[10]]',
        output: '[0, 0, 1]',
        explanation: 'Values 1 and 5 are closer to 0; 9 is closer to 10.',
      },
    ],
    starterCode: {
      python: `def kmeans_assign(points, centroids):
    labels = []
    for p in points:
        dists = [sum((p[j] - c[j]) ** 2 for j in range(len(p))) for c in centroids]
        labels.append(dists.index(min(dists)))
    return labels


print(kmeans_assign([[0, 0], [1, 1], [10, 10]], [[0, 0], [10, 10]]))
`,
    },
    hints: [
      'For each point, compute its squared distance to every centroid.',
      'index(min(...)) gives the position of the closest centroid directly.',
      'Skipping the square root is safe and faster — ordering by distance is unchanged.',
    ],
    tests: [
      { input: 'points=[[0,0],[1,1],[10,10]], centroids=[[0,0],[10,10]]', expected: '[0, 0, 1]' },
      { input: 'points=[[1],[5],[9]], centroids=[[0],[10]]', expected: '[0, 0, 1]' },
      { input: 'points=[[2,2],[8,8],[3,3],[7,7]], centroids=[[2,2],[8,8]]', expected: '[0, 1, 0, 1]' },
    ],
  },

  {
    slug: 'k-means-centroid-update',
    title: 'K-Means Centroid Update',
    difficulty: 'easy',
    topic: 'Clustering',
    category: 'Clustering',
    statement: `After assignment, K-means moves each centroid to the mean of the points assigned to it. Given the points, their current cluster labels, and the number of clusters \\(k\\), recompute every centroid as

\\[ \\boldsymbol{\\mu}_c = \\frac{1}{|C_c|} \\sum_{\\mathbf{x} \\in C_c} \\mathbf{x}. \\]

If a cluster ends up with no points, keep a zero vector of the right dimension for it. Round each coordinate to four decimals and return the list of centroids.`,
    examples: [
      {
        input: 'points = [[0,0],[2,2],[10,10],[12,12]], labels = [0,0,1,1], k = 2',
        output: '[[1.0, 1.0], [11.0, 11.0]]',
        explanation: 'Each cluster averages its two assigned points.',
      },
      {
        input: 'points = [[1],[3],[9]], labels = [0,0,1], k = 2',
        output: '[[2.0], [9.0]]',
        explanation: 'Cluster 0 averages 1 and 3; cluster 1 holds just 9.',
      },
    ],
    starterCode: {
      python: `def centroid_update(points, labels, k):
    dim = len(points[0])
    centroids = []
    for c in range(k):
        members = [points[i] for i in range(len(points)) if labels[i] == c]
        if members:
            centroids.append([round(sum(m[j] for m in members) / len(members), 4)
                              for j in range(dim)])
        else:
            centroids.append([0.0] * dim)
    return centroids


print(centroid_update([[0, 0], [2, 2], [10, 10], [12, 12]], [0, 0, 1, 1], 2))
`,
    },
    hints: [
      'Gather the members of each cluster, then average them coordinate by coordinate.',
      'Read the dimension from the first point so the zero vector matches.',
      'Guard the empty-cluster case before dividing, or you will hit a divide-by-zero.',
    ],
    tests: [
      { input: 'points=[[0,0],[2,2],[10,10],[12,12]], labels=[0,0,1,1], k=2', expected: '[[1.0, 1.0], [11.0, 11.0]]' },
      { input: 'points=[[1],[3],[9]], labels=[0,0,1], k=2', expected: '[[2.0], [9.0]]' },
      { input: 'points=[[1,1],[2,2]], labels=[0,0], k=3', expected: '[[1.5, 1.5], [0.0, 0.0], [0.0, 0.0]]' },
    ],
  },

  {
    slug: 'silhouette-score',
    title: 'Silhouette Score (Mean)',
    difficulty: 'hard',
    topic: 'Clustering',
    category: 'Metrics',
    statement: `The silhouette coefficient measures how well each point fits its cluster versus the nearest other cluster. For a point \\(i\\):

\\[ a(i) = \\text{mean distance to other points in its own cluster}, \\qquad b(i) = \\min_{c' \\neq c} \\text{mean distance to points in cluster } c', \\]

\\[ s(i) = \\frac{b(i) - a(i)}{\\max(a(i),\\, b(i))}. \\]

Use Euclidean distance. A point alone in its cluster contributes \\(s = 0\\). Return the mean of \\(s(i)\\) over all points, rounded to four decimals.`,
    examples: [
      {
        input: 'points = [[0,0],[0,1],[10,10],[10,11]], labels = [0,0,1,1]',
        output: '0.9293',
        explanation: 'Tight, well-separated clusters score close to 1.',
      },
      {
        input: 'points = [[0],[1],[10],[11]], labels = [0,0,1,1]',
        output: '0.8997',
        explanation: 'Still clearly separated in 1-D, slightly lower than the 2-D blobs.',
      },
    ],
    starterCode: {
      python: `import math


def euclid(a, b):
    return math.sqrt(sum((a[j] - b[j]) ** 2 for j in range(len(a))))


def silhouette(points, labels):
    n = len(points)
    clusters = {}
    for i, lab in enumerate(labels):
        clusters.setdefault(lab, []).append(i)
    s_vals = []
    for i in range(n):
        own = labels[i]
        same = [j for j in clusters[own] if j != i]
        if len(same) == 0:
            s_vals.append(0.0)
            continue
        a = sum(euclid(points[i], points[j]) for j in same) / len(same)
        b = None
        for lab, members in clusters.items():
            if lab == own:
                continue
            d = sum(euclid(points[i], points[j]) for j in members) / len(members)
            if b is None or d < b:
                b = d
        s_vals.append((b - a) / max(a, b))
    return round(sum(s_vals) / n, 4)


print(silhouette([[0, 0], [0, 1], [10, 10], [10, 11]], [0, 0, 1, 1]))
`,
    },
    hints: [
      'a(i) averages distances within the point own cluster, excluding itself.',
      'b(i) is the smallest average distance to any single other cluster — not all of them pooled.',
      'A singleton cluster has no within-cluster distances, so its silhouette is defined as 0.',
    ],
    tests: [
      { input: 'points=[[0,0],[0,1],[10,10],[10,11]], labels=[0,0,1,1]', expected: '0.9293' },
      { input: 'points=[[0],[1],[10],[11]], labels=[0,0,1,1]', expected: '0.8997' },
      { input: 'points=[[0],[1],[2],[10]], labels=[0,0,0,1]', expected: '0.6378' },
    ],
  },

  {
    slug: 'classification-metrics',
    title: 'Accuracy, Precision, Recall, F1',
    difficulty: 'medium',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `For a binary classifier, tally the four outcomes — true positives, true negatives, false positives, false negatives — then report the standard metrics:

\\[ \\text{accuracy} = \\frac{TP + TN}{n}, \\quad \\text{precision} = \\frac{TP}{TP + FP}, \\quad \\text{recall} = \\frac{TP}{TP + FN}, \\quad F_1 = \\frac{2 \\cdot P \\cdot R}{P + R}. \\]

Whenever a denominator is zero, define that metric as \\(0.0\\) rather than dividing. Return a dict with keys \\(\\text{'accuracy'}, \\text{'precision'}, \\text{'recall'}, \\text{'f1'}\\), each rounded to four decimals.`,
    examples: [
      {
        input: 'y_true = [1,0,1,1,0,1], y_pred = [1,0,0,1,0,1]',
        output: "{'accuracy': 0.8333, 'precision': 1.0, 'recall': 0.75, 'f1': 0.8571}",
        explanation: 'Three of four positives caught with no false alarms gives perfect precision, recall 0.75.',
      },
      {
        input: 'y_true = [1,1,0,0], y_pred = [1,0,0,1]',
        output: "{'accuracy': 0.5, 'precision': 0.5, 'recall': 0.5, 'f1': 0.5}",
        explanation: 'One TP, one TN, one FP, one FN — every metric lands at 0.5.',
      },
    ],
    starterCode: {
      python: `def classification_metrics(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    acc = (tp + tn) / len(y_true) if y_true else 0.0
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {
        'accuracy': round(acc, 4),
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1': round(f1, 4),
    }


print(classification_metrics([1, 0, 1, 1, 0, 1], [1, 0, 0, 1, 0, 1]))
`,
    },
    hints: [
      'Count TP/TN/FP/FN in a single pass over the paired labels.',
      'Precision asks of predicted positives how many were right; recall asks of actual positives how many were caught.',
      'Check each denominator before dividing and fall back to 0.0 when it is zero.',
    ],
    tests: [
      { input: 'y_true=[1,0,1,1,0,1], y_pred=[1,0,0,1,0,1]', expected: "{'accuracy': 0.8333, 'precision': 1.0, 'recall': 0.75, 'f1': 0.8571}" },
      { input: 'y_true=[1,1,0,0], y_pred=[1,0,0,1]', expected: "{'accuracy': 0.5, 'precision': 0.5, 'recall': 0.5, 'f1': 0.5}" },
      { input: 'y_true=[0,0,0,0], y_pred=[0,0,0,0]', expected: "{'accuracy': 1.0, 'precision': 0.0, 'recall': 0.0, 'f1': 0.0}" },
    ],
  },

  {
    slug: 'confusion-matrix-normalized',
    title: 'Row-Normalized Confusion Matrix',
    difficulty: 'medium',
    topic: 'Metrics',
    category: 'Metrics',
    statement: `Build a confusion matrix over the sorted unique labels (drawn from both true and predicted lists), where entry \\((i, j)\\) counts how often a true label \\(i\\) was predicted as \\(j\\). Then normalize each row by its sum so the row reads as the distribution of predictions for that true class:

\\[ \\tilde{M}_{ij} = \\frac{M_{ij}}{\\sum_j M_{ij}}. \\]

A row that sums to zero (a class that never appears as truth) stays all zeros. Round every entry to four decimals and return the matrix as a 2D list.`,
    examples: [
      {
        input: 'y_true = [0,0,1,1,2,2], y_pred = [0,1,1,1,2,0]',
        output: '[[0.5, 0.5, 0.0], [0.0, 1.0, 0.0], [0.5, 0.0, 0.5]]',
        explanation: 'Class 0 split evenly between predicted 0 and 1; class 1 always predicted 1; class 2 split between 2 and 0.',
      },
      {
        input: 'y_true = [0,1,0,1], y_pred = [0,1,1,1]',
        output: '[[0.5, 0.5], [0.0, 1.0]]',
        explanation: 'Class 0 was predicted 0 once and 1 once; class 1 always predicted 1.',
      },
    ],
    starterCode: {
      python: `def confusion_normalized(y_true, y_pred):
    labels = sorted(set(y_true) | set(y_pred))
    idx = {lab: i for i, lab in enumerate(labels)}
    m = len(labels)
    mat = [[0] * m for _ in range(m)]
    for t, p in zip(y_true, y_pred):
        mat[idx[t]][idx[p]] += 1
    result = []
    for row in mat:
        s = sum(row)
        if s == 0:
            result.append([0.0] * m)
        else:
            result.append([round(v / s, 4) for v in row])
    return result


print(confusion_normalized([0, 0, 1, 1, 2, 2], [0, 1, 1, 1, 2, 0]))
`,
    },
    hints: [
      'Take the label set from both lists so a label appearing only in predictions still gets a column.',
      'Rows index true labels, columns index predictions — keep that orientation consistent.',
      'Normalize by the row sum, and leave an all-zero row untouched to avoid dividing by zero.',
    ],
    tests: [
      { input: 'y_true=[0,0,1,1,2,2], y_pred=[0,1,1,1,2,0]', expected: '[[0.5, 0.5, 0.0], [0.0, 1.0, 0.0], [0.5, 0.0, 0.5]]' },
      { input: 'y_true=[0,1,0,1], y_pred=[0,1,1,1]', expected: '[[0.5, 0.5], [0.0, 1.0]]' },
      { input: 'y_true=[0,1,2], y_pred=[0,1,2]', expected: '[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]' },
    ],
  },

  {
    slug: 'sarsa-update',
    title: 'SARSA Update',
    difficulty: 'medium',
    topic: 'Reinforcement Learning',
    category: 'Reinforcement Learning',
    statement: `SARSA is an on-policy temporal-difference control rule. After observing a transition \\((s, a, r, s', a')\\) — where \\(a'\\) is the action actually chosen in \\(s'\\) — update the action-value estimate toward the bootstrapped target:

\\[ Q(s, a) \\leftarrow Q(s, a) + \\alpha \\big[ r + \\gamma\\, Q(s', a') - Q(s, a) \\big]. \\]

The bracketed term is the TD error: how far the current estimate sits from "reward now plus discounted value of where you landed". Given \\(Q\\) as a 2-D list indexed \\(Q[s][a]\\), apply one update and return the new \\(Q[s][a]\\) rounded to four decimals.`,
    examples: [
      {
        input: 'Q = [[0,0],[0,0]], s=0, a=0, r=1.0, s2=1, a2=1\nalpha = 0.1, gamma = 0.9',
        output: '0.1',
        explanation: 'With all values zero the target is just r=1, so Q[0][0] moves by alpha*1 = 0.1.',
      },
      {
        input: 'Q = [[5,2],[3,4]], s=0, a=1, r=-1.0, s2=1, a2=0\nalpha = 0.5, gamma = 0.9',
        output: '1.85',
        explanation: 'TD error = -1 + 0.9*3 - 2 = -0.3; Q[0][1] = 2 + 0.5*(-0.3) = 1.85.',
      },
    ],
    starterCode: {
      python: `def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma):
    td_error = r + gamma * Q[s2][a2] - Q[s][a]
    Q[s][a] += alpha * td_error
    return round(Q[s][a], 4)


print(sarsa_update([[0, 0], [0, 0]], 0, 0, 1.0, 1, 1, 0.1, 0.9))
print(sarsa_update([[5, 2], [3, 4]], 0, 1, -1.0, 1, 0, 0.5, 0.9))
`,
    },
    hints: [
      'SARSA bootstraps off the action actually taken next (a2), not the greedy maximum — that is what makes it on-policy.',
      'Compute the TD error r + gamma*Q[s2][a2] - Q[s][a] first, then scale it by alpha.',
      'The update is in place: add alpha times the TD error to the existing Q[s][a].',
    ],
    tests: [
      { input: 'Q=[[0,0],[0,0]], s=0,a=0,r=1.0,s2=1,a2=1, alpha=0.1, gamma=0.9', expected: '0.1' },
      { input: 'Q=[[5,2],[3,4]], s=0,a=1,r=-1.0,s2=1,a2=0, alpha=0.5, gamma=0.9', expected: '1.85' },
      { input: 'Q=[[1,1],[1,1]], s=1,a=0,r=2.0,s2=0,a2=1, alpha=0.2, gamma=1.0', expected: '1.4' },
    ],
  },

  {
    slug: 'mc-policy-evaluation',
    title: 'Monte Carlo Return',
    difficulty: 'easy',
    topic: 'Reinforcement Learning',
    category: 'Reinforcement Learning',
    statement: `Monte Carlo methods evaluate a policy by averaging the actual returns seen in full episodes. The return from the start of an episode is the discounted sum of rewards:

\\[ G_0 = \\sum_{t=0}^{T-1} \\gamma^t\\, r_t = r_0 + \\gamma r_1 + \\gamma^2 r_2 + \\cdots \\]

The discount \\(\\gamma \\in [0, 1]\\) shrinks the weight of rewards that arrive later. Given the episode's reward list and \\(\\gamma\\), return \\(G_0\\) rounded to four decimals.`,
    examples: [
      {
        input: 'rewards = [1, 1, 1, 1], gamma = 0.9',
        output: '3.439',
        explanation: '1 + 0.9 + 0.81 + 0.729 = 3.439.',
      },
      {
        input: 'rewards = [0, 0, 1], gamma = 0.5',
        output: '0.25',
        explanation: 'Only the final reward counts: 0.5^2 * 1 = 0.25.',
      },
    ],
    starterCode: {
      python: `def mc_return(rewards, gamma):
    g = 0.0
    for t, r in enumerate(rewards):
        g += gamma ** t * r
    return round(g, 4)


print(mc_return([1, 1, 1, 1], 0.9))
print(mc_return([0, 0, 1], 0.5))
`,
    },
    hints: [
      'Reward at step t carries weight gamma**t — the very first reward is undiscounted.',
      'A cleaner alternative folds backward: G = r_t + gamma*G, iterating from the last reward.',
      'With gamma = 1 the return is just the plain sum of rewards.',
    ],
    tests: [
      { input: 'rewards=[1,1,1,1], gamma=0.9', expected: '3.439' },
      { input: 'rewards=[0,0,1], gamma=0.5', expected: '0.25' },
      { input: 'rewards=[10,-5,3], gamma=1.0', expected: '8.0' },
    ],
  },

  {
    slug: 'compute-advantage',
    title: 'Advantage Estimate',
    difficulty: 'medium',
    topic: 'Reinforcement Learning',
    category: 'Reinforcement Learning',
    statement: `The advantage measures how much better a transition turned out than the value function expected. The one-step temporal-difference advantage is

\\[ A_t = r_t + \\gamma\\, V(s_{t+1}) - V(s_t). \\]

A positive \\(A_t\\) means the step beat expectations; policy-gradient methods push probability mass toward such actions. You are given the rewards, a value list \\(V\\) of length \\(n+1\\) (the final entry bootstraps the value past the last step), and \\(\\gamma\\). Return the list of advantages, each rounded to four decimals.`,
    examples: [
      {
        input: 'rewards = [1, 1, 1], V = [0.5, 0.6, 0.7, 0.8], gamma = 0.9',
        output: '[1.04, 1.03, 1.02]',
        explanation: 'A_0 = 1 + 0.9*0.6 - 0.5 = 1.04, and so on for each step.',
      },
      {
        input: 'rewards = [0, 0], V = [1, 1, 1], gamma = 1.0',
        output: '[0.0, 0.0]',
        explanation: 'Zero reward with a flat value function gives zero advantage everywhere.',
      },
    ],
    starterCode: {
      python: `def compute_advantage(rewards, V, gamma):
    return [round(rewards[t] + gamma * V[t + 1] - V[t], 4)
            for t in range(len(rewards))]


print(compute_advantage([1, 1, 1], [0.5, 0.6, 0.7, 0.8], 0.9))
print(compute_advantage([0, 0], [1, 1, 1], 1.0))
`,
    },
    hints: [
      'V has one more entry than rewards because each step needs the value of the state it lands in.',
      'A_t is exactly the TD error r_t + gamma*V[t+1] - V[t].',
      'Iterate t over the rewards; index V at both t and t+1.',
    ],
    tests: [
      { input: 'rewards=[1,1,1], V=[0.5,0.6,0.7,0.8], gamma=0.9', expected: '[1.04, 1.03, 1.02]' },
      { input: 'rewards=[0,0], V=[1,1,1], gamma=1.0', expected: '[0.0, 0.0]' },
      { input: 'rewards=[2,-1], V=[0,1,0.5], gamma=0.95', expected: '[2.95, -1.525]' },
    ],
  },

  {
    slug: 'policy-gradient-loss',
    title: 'Policy Gradient (REINFORCE) Loss',
    difficulty: 'medium',
    topic: 'Reinforcement Learning',
    category: 'Reinforcement Learning',
    statement: `REINFORCE turns the policy-gradient theorem into a loss you can hand to an autograd optimizer. For actions sampled from the policy with log-probabilities \\(\\log \\pi(a_t \\mid s_t)\\) and their returns \\(G_t\\):

\\[ \\mathcal{L} = -\\frac{1}{n} \\sum_{t} \\log \\pi(a_t \\mid s_t)\\, G_t. \\]

Minimizing this loss raises the probability of actions that led to high returns. Given the log-probabilities of the taken actions and their returns, compute the loss rounded to four decimals.`,
    examples: [
      {
        input: 'logprobs = [-0.5, -1.0, -2.0], returns = [1.0, 1.0, 1.0]',
        output: '1.1667',
        explanation: 'Mean of (lp*G) is (-0.5-1.0-2.0)/3 = -1.1667; negate to get the loss.',
      },
      {
        input: 'logprobs = [-0.7, -0.3], returns = [2.0, -1.0]',
        output: '0.55',
        explanation: 'Sum lp*G = -1.4 + 0.3 = -1.1; mean = -0.55; loss = 0.55.',
      },
    ],
    starterCode: {
      python: `def pg_loss(logprobs, returns):
    n = len(logprobs)
    weighted = sum(lp * g for lp, g in zip(logprobs, returns))
    return round(-weighted / n, 4)


print(pg_loss([-0.5, -1.0, -2.0], [1.0, 1.0, 1.0]))
print(pg_loss([-0.7, -0.3], [2.0, -1.0]))
`,
    },
    hints: [
      'Log-probabilities are negative, so the leading minus sign makes the loss behave like a normal objective to minimize.',
      'Weight each log-prob by its return before averaging.',
      'A negative return flips the sign, pushing the policy away from that action.',
    ],
    tests: [
      { input: 'logprobs=[-0.5,-1.0,-2.0], returns=[1.0,1.0,1.0]', expected: '1.1667' },
      { input: 'logprobs=[-0.7,-0.3], returns=[2.0,-1.0]', expected: '0.55' },
      { input: 'logprobs=[-1,-1,-1,-1], returns=[0.5,0.5,0.5,0.5]', expected: '0.5' },
    ],
  },

  {
    slug: 'priority-replay-sample',
    title: 'Prioritized Replay Probabilities',
    difficulty: 'medium',
    topic: 'Reinforcement Learning',
    category: 'Reinforcement Learning',
    statement: `Prioritized experience replay samples transitions in proportion to how surprising they were, rather than uniformly. Given a priority \\(p_i\\) for each stored transition and an exponent \\(\\alpha\\) that tunes how aggressive the prioritization is, the sampling probability is

\\[ P(i) = \\frac{p_i^{\\alpha}}{\\sum_j p_j^{\\alpha}}. \\]

Setting \\(\\alpha = 0\\) recovers uniform sampling; larger \\(\\alpha\\) concentrates on high-priority transitions. Return the list of probabilities, each rounded to four decimals.`,
    examples: [
      {
        input: 'priorities = [1, 2, 3], alpha = 0.5',
        output: '[0.2412, 0.3411, 0.4177]',
        explanation: 'Raise each to the 0.5 power, then normalize by their sum.',
      },
      {
        input: 'priorities = [1, 1, 1, 1], alpha = 1.0',
        output: '[0.25, 0.25, 0.25, 0.25]',
        explanation: 'Equal priorities give a uniform distribution regardless of alpha.',
      },
    ],
    starterCode: {
      python: `def per_probs(priorities, alpha):
    scaled = [p ** alpha for p in priorities]
    total = sum(scaled)
    return [round(s / total, 4) for s in scaled]


print(per_probs([1, 2, 3], 0.5))
print(per_probs([1, 1, 1, 1], 1.0))
`,
    },
    hints: [
      'Exponentiate every priority by alpha before normalizing — the exponent controls the sharpness.',
      'Divide each scaled priority by the sum so the probabilities add to one.',
      'With alpha = 0 every term becomes 1 and you get uniform sampling.',
    ],
    tests: [
      { input: 'priorities=[1,2,3], alpha=0.5', expected: '[0.2412, 0.3411, 0.4177]' },
      { input: 'priorities=[1,1,1,1], alpha=1.0', expected: '[0.25, 0.25, 0.25, 0.25]' },
      { input: 'priorities=[4,1], alpha=1.0', expected: '[0.8, 0.2]' },
    ],
  },

  {
    slug: 'popularity-ranking',
    title: 'Popularity Ranking',
    difficulty: 'easy',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `The simplest recommender ignores personalization entirely and just shows what is popular. Given a log of interaction events — each event is an item id — count how often each item appears and return the top \\(k\\) item ids by frequency.

Break ties by preferring the smaller item id, so the ranking is deterministic. This non-personalized baseline is often surprisingly hard to beat and makes a sensible cold-start fallback.`,
    examples: [
      {
        input: 'events = [1, 2, 2, 3, 3, 3], k = 2',
        output: '[3, 2]',
        explanation: 'Item 3 appears three times, item 2 twice — the two most popular.',
      },
      {
        input: 'events = [5, 5, 7, 7, 9], k = 2',
        output: '[5, 7]',
        explanation: 'Items 5 and 7 tie at two each; both beat 9, ordered by smaller id.',
      },
    ],
    starterCode: {
      python: `from collections import Counter


def popularity_ranking(events, k):
    counts = Counter(events)
    ranked = sorted(counts.keys(), key=lambda i: (-counts[i], i))
    return ranked[:k]


print(popularity_ranking([1, 2, 2, 3, 3, 3], 2))
print(popularity_ranking([5, 5, 7, 7, 9], 2))
`,
    },
    hints: [
      'Counter tallies the events in one pass.',
      'Sort by (-count, id) so higher counts come first and ties fall back to the smaller id.',
      'Slice the sorted ids to the first k.',
    ],
    tests: [
      { input: 'events=[1,2,2,3,3,3], k=2', expected: '[3, 2]' },
      { input: 'events=[5,5,7,7,9], k=2', expected: '[5, 7]' },
      { input: 'events=[1,1,1,2,2,3], k=3', expected: '[1, 2, 3]' },
    ],
  },

  {
    slug: 'top-k-recommendations',
    title: 'Top-K Recommendations',
    difficulty: 'easy',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `Once a model has scored every candidate item for a user, the serving layer keeps only the best few. Given a dictionary mapping item id to a predicted score, return the \\(k\\) item keys with the highest scores, ordered from best to worst.

Break ties by preferring the smaller key so the output is stable. This top-\\(k\\) cut is the final step of almost every retrieval-and-ranking pipeline.`,
    examples: [
      {
        input: 'scores = {1: 0.9, 2: 0.5, 3: 0.7}, k = 2',
        output: '[1, 3]',
        explanation: 'Highest scores are item 1 (0.9) then item 3 (0.7).',
      },
      {
        input: 'scores = {10: 0.2, 20: 0.2, 30: 0.8}, k = 2',
        output: '[30, 10]',
        explanation: 'Item 30 leads; the 0.2 tie resolves to the smaller key 10.',
      },
    ],
    starterCode: {
      python: `def top_k(scores, k):
    ranked = sorted(scores.keys(), key=lambda i: (-scores[i], i))
    return ranked[:k]


print(top_k({1: 0.9, 2: 0.5, 3: 0.7}, 2))
print(top_k({10: 0.2, 20: 0.2, 30: 0.8}, 2))
`,
    },
    hints: [
      'Sort the keys, not the values, so you keep the item ids.',
      'A (-score, key) sort key gives descending score with the smaller key winning ties.',
      'Take the first k after sorting.',
    ],
    tests: [
      { input: 'scores={1:0.9,2:0.5,3:0.7}, k=2', expected: '[1, 3]' },
      { input: 'scores={10:0.2,20:0.2,30:0.8}, k=2', expected: '[30, 10]' },
      { input: 'scores={1:0.1,2:0.4,3:0.4,4:0.9}, k=3', expected: '[4, 2, 3]' },
    ],
  },

  {
    slug: 'precision-recall-at-k',
    title: 'Precision and Recall at K',
    difficulty: 'medium',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `Top-\\(k\\) recommendation quality is usually judged with two complementary ratios. Looking only at the first \\(k\\) recommendations:

\\[ \\text{precision@}k = \\frac{|\\text{relevant} \\cap \\text{top-}k|}{k}, \\qquad \\text{recall@}k = \\frac{|\\text{relevant} \\cap \\text{top-}k|}{|\\text{relevant}|}. \\]

Precision asks "how much of what I showed was good", recall asks "how much of the good stuff did I show". Given the ranked recommendation list, the set of relevant item ids, and \\(k\\), return the pair \\((\\text{precision}, \\text{recall})\\) each rounded to four decimals.`,
    examples: [
      {
        input: 'recs = [1, 2, 3, 4, 5], relevant = [2, 4, 6], k = 3',
        output: '(0.3333, 0.3333)',
        explanation: 'Top-3 = {1,2,3}; one hit (item 2). 1/3 precision, 1/3 of the three relevant items recalled.',
      },
      {
        input: 'recs = [1, 2, 3], relevant = [1, 2, 3], k = 2',
        output: '(1.0, 0.6667)',
        explanation: 'Both shown items are relevant (precision 1), but only 2 of 3 relevant items appear in the top-2.',
      },
    ],
    starterCode: {
      python: `def precision_recall_at_k(recs, relevant, k):
    rel = set(relevant)
    hits = sum(1 for item in recs[:k] if item in rel)
    precision = hits / k
    recall = hits / len(rel)
    return (round(precision, 4), round(recall, 4))


print(precision_recall_at_k([1, 2, 3, 4, 5], [2, 4, 6], 3))
print(precision_recall_at_k([1, 2, 3], [1, 2, 3], 2))
`,
    },
    hints: [
      'Convert the relevant items to a set so membership tests are O(1).',
      'Count how many of the first k recommendations land in that set — that single count drives both metrics.',
      'Precision divides hits by k; recall divides the same hits by the total number of relevant items.',
    ],
    tests: [
      { input: 'recs=[1,2,3,4,5], relevant=[2,4,6], k=3', expected: '(0.3333, 0.3333)' },
      { input: 'recs=[1,2,3], relevant=[1,2,3], k=2', expected: '(1.0, 0.6667)' },
      { input: 'recs=[5,6,7,8], relevant=[1,2], k=2', expected: '(0.0, 0.0)' },
    ],
  },

  {
    slug: 'rating-normalization',
    title: 'Mean-Centered Rating Normalization',
    difficulty: 'easy',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `Users rate on different scales — one person's "3 out of 5" is another's "5 out of 5". Mean-centering removes that per-user bias by subtracting each user's average rating:

\\[ \\tilde{r}_{ui} = r_{ui} - \\bar{r}_u, \\qquad \\bar{r}_u = \\frac{1}{|I_u|} \\sum_{i \\in I_u} r_{ui}. \\]

After centering, a positive value means "liked more than usual" and a negative value means "liked less than usual". Given one user's ratings, return the centered ratings rounded to four decimals.`,
    examples: [
      {
        input: 'ratings = [3, 4, 5]',
        output: '[-1.0, 0.0, 1.0]',
        explanation: 'Mean is 4; subtracting it recenters the ratings around zero.',
      },
      {
        input: 'ratings = [1, 2, 3, 4]',
        output: '[-1.5, -0.5, 0.5, 1.5]',
        explanation: 'Mean is 2.5; each rating is shifted by that amount.',
      },
    ],
    starterCode: {
      python: `def normalize_ratings(ratings):
    mean = sum(ratings) / len(ratings)
    return [round(r - mean, 4) for r in ratings]


print(normalize_ratings([3, 4, 5]))
print(normalize_ratings([1, 2, 3, 4]))
`,
    },
    hints: [
      'Compute the mean once, then subtract it from every rating.',
      'The centered ratings always sum to (about) zero — a quick sanity check.',
      'A user who gives the same rating to everything centers to all zeros.',
    ],
    tests: [
      { input: 'ratings=[3,4,5]', expected: '[-1.0, 0.0, 1.0]' },
      { input: 'ratings=[1,2,3,4]', expected: '[-1.5, -0.5, 0.5, 1.5]' },
      { input: 'ratings=[5,5,5]', expected: '[0.0, 0.0, 0.0]' },
    ],
  },

  {
    slug: 'catalog-coverage',
    title: 'Catalog Coverage',
    difficulty: 'easy',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `A recommender that only ever surfaces the same few blockbusters has poor catalog coverage, even if its accuracy looks fine. Coverage measures how much of the catalog the system actually recommends to anyone:

\\[ \\text{coverage} = \\frac{|\\,\\bigcup_u \\text{recs}_u\\,|}{|\\text{catalog}|}. \\]

Given the per-user recommendation lists and the total number of items in the catalog, return the coverage rounded to four decimals.`,
    examples: [
      {
        input: 'rec_lists = [[1, 2], [2, 3]], total_items = 10',
        output: '0.3',
        explanation: 'Distinct recommended items are {1,2,3} — three of ten.',
      },
      {
        input: 'rec_lists = [[1, 1, 1]], total_items = 4',
        output: '0.25',
        explanation: 'Only item 1 is ever recommended, so one of four items is covered.',
      },
    ],
    starterCode: {
      python: `def catalog_coverage(rec_lists, total_items):
    seen = set()
    for recs in rec_lists:
        seen.update(recs)
    return round(len(seen) / total_items, 4)


print(catalog_coverage([[1, 2], [2, 3]], 10))
print(catalog_coverage([[1, 1, 1]], 4))
`,
    },
    hints: [
      'Pour every recommendation into one set so duplicates collapse.',
      'The numerator is the size of that distinct set, not the total number of recommendations.',
      'Divide by the catalog size to get a fraction between 0 and 1.',
    ],
    tests: [
      { input: 'rec_lists=[[1,2],[2,3]], total_items=10', expected: '0.3' },
      { input: 'rec_lists=[[1,1,1]], total_items=4', expected: '0.25' },
      { input: 'rec_lists=[[1,2,3],[4,5]], total_items=5', expected: '1.0' },
    ],
  },

  {
    slug: 'user-based-cf-prediction',
    title: 'User-Based CF Prediction',
    difficulty: 'hard',
    topic: 'Recommenders',
    category: 'Recommenders',
    statement: `User-based collaborative filtering predicts a rating by borrowing from similar users. Once you have each neighbor's similarity to the target user and that neighbor's rating for the item in question, the prediction is a similarity-weighted average:

\\[ \\hat{r}_{ui} = \\frac{\\sum_{v} \\text{sim}(u, v)\\, r_{vi}}{\\sum_{v} |\\text{sim}(u, v)|}. \\]

Using \\(|\\text{sim}|\\) in the denominator keeps negative similarities (opposite tastes) from inflating the estimate. Given parallel lists of neighbor similarities and their ratings for the item, return the predicted rating rounded to four decimals.`,
    examples: [
      {
        input: 'sims = [0.8, 0.5, 0.2], ratings = [5, 3, 4]',
        output: '4.2',
        explanation: '(0.8*5 + 0.5*3 + 0.2*4) / (0.8+0.5+0.2) = 6.3 / 1.5 = 4.2.',
      },
      {
        input: 'sims = [0.9, -0.4], ratings = [4, 2]',
        output: '2.1538',
        explanation: 'Numerator 0.9*4 - 0.4*2 = 2.8; denominator |0.9|+|-0.4| = 1.3; 2.8/1.3 = 2.1538.',
      },
    ],
    starterCode: {
      python: `def cf_predict(sims, ratings):
    numerator = sum(s * r for s, r in zip(sims, ratings))
    denominator = sum(abs(s) for s in sims)
    return round(numerator / denominator, 4)


print(cf_predict([0.8, 0.5, 0.2], [5, 3, 4]))
print(cf_predict([0.9, -0.4], [4, 2]))
`,
    },
    hints: [
      'Weight each neighbor rating by its similarity in the numerator.',
      'The denominator uses absolute similarities so a negative weight still pulls the estimate, just in the opposite direction.',
      'Neighbors with similarity near zero contribute almost nothing to either sum.',
    ],
    tests: [
      { input: 'sims=[0.8,0.5,0.2], ratings=[5,3,4]', expected: '4.2' },
      { input: 'sims=[0.9,-0.4], ratings=[4,2]', expected: '2.1538' },
      { input: 'sims=[1.0,1.0], ratings=[3,5]', expected: '4.0' },
    ],
  },

  {
    slug: 'elu-activation',
    title: 'ELU Activation',
    difficulty: 'easy',
    topic: 'Activations',
    category: 'Activations',
    statement: `The Exponential Linear Unit keeps the identity slope for positive inputs but saturates smoothly to \\(-\\alpha\\) for very negative ones:

\\[ \\text{ELU}(x) = \\begin{cases} x & x > 0 \\\\ \\alpha\\,(e^{x} - 1) & x \\le 0. \\end{cases} \\]

Unlike ReLU it has no hard zero region, so neurons stay alive and the mean activation is pushed closer to zero. Apply ELU elementwise (default \\(\\alpha = 1.0\\)) and return the list rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [-1, 0, 1], alpha = 1.0',
        output: '[-0.6321, 0.0, 1]',
        explanation: 'For x=-1: 1*(e^-1 - 1) = -0.6321. Non-negative inputs pass through unchanged.',
      },
      {
        input: 'xs = [-2, 2], alpha = 1.0',
        output: '[-0.8647, 2]',
        explanation: 'The negative branch saturates toward -alpha; the positive value is untouched.',
      },
    ],
    starterCode: {
      python: `import math


def elu(xs, alpha=1.0):
    return [round(x if x > 0 else alpha * (math.exp(x) - 1), 4)
            for x in xs]


print(elu([-1, 0, 1]))
print(elu([-2, 2]))
`,
    },
    hints: [
      'Positive inputs are returned exactly as-is — no exponential needed there.',
      'The negative branch is alpha*(exp(x) - 1), which is bounded below by -alpha.',
      'x = 0 falls into the non-positive branch and evaluates to 0.',
    ],
    tests: [
      { input: 'xs=[-1,0,1]', expected: '[-0.6321, 0.0, 1]' },
      { input: 'xs=[-2,2]', expected: '[-0.8647, 2]' },
      { input: 'xs=[-0.5,0.5,3]', expected: '[-0.3935, 0.5, 3]' },
    ],
  },

  {
    slug: 'selu-activation',
    title: 'SELU Activation',
    difficulty: 'medium',
    topic: 'Activations',
    category: 'Activations',
    statement: `The Scaled Exponential Linear Unit is ELU multiplied by a fixed scale, with constants chosen so that activations self-normalize toward zero mean and unit variance across layers:

\\[ \\text{SELU}(x) = \\lambda \\begin{cases} x & x > 0 \\\\ \\alpha\\,(e^{x} - 1) & x \\le 0, \\end{cases} \\]

with \\(\\alpha = 1.6732632423543772\\) and \\(\\lambda = 1.0507009873554805\\). These exact values are what make the fixed point of the variance map stable. Apply SELU elementwise and return the list rounded to four decimals.`,
    examples: [
      {
        input: 'xs = [-1, 0, 1]',
        output: '[-1.1113, 0.0, 1.0507]',
        explanation: 'Positive 1 scales to lambda; the negative branch is lambda*alpha*(e^x - 1).',
      },
      {
        input: 'xs = [2, -2]',
        output: '[2.1014, -1.5202]',
        explanation: '2 maps to 2*lambda = 2.1014; -2 saturates through the scaled ELU branch.',
      },
    ],
    starterCode: {
      python: `import math


def selu(xs):
    alpha = 1.6732632423543772
    scale = 1.0507009873554805
    return [round(scale * (x if x > 0 else alpha * (math.exp(x) - 1)), 4)
            for x in xs]


print(selu([-1, 0, 1]))
print(selu([2, -2]))
`,
    },
    hints: [
      'SELU is just ELU times the scale constant lambda — apply the branch first, then multiply.',
      'The constants are not free parameters; these specific values give the self-normalizing fixed point.',
      'For positive x the output is simply lambda*x.',
    ],
    tests: [
      { input: 'xs=[-1,0,1]', expected: '[-1.1113, 0.0, 1.0507]' },
      { input: 'xs=[2,-2]', expected: '[2.1014, -1.5202]' },
      { input: 'xs=[0.5,-0.5]', expected: '[0.5254, -0.6918]' },
    ],
  },

  {
    slug: 'linear-layer-forward',
    title: 'Linear Layer Forward',
    difficulty: 'easy',
    topic: 'Neural Networks',
    category: 'Neural Networks',
    statement: `A fully connected (linear) layer is the workhorse of every neural network. Given an input vector \\(\\mathbf{x}\\), a weight matrix \\(W\\) of shape (out, in), and a bias vector \\(\\mathbf{b}\\), it computes

\\[ \\mathbf{y} = W\\mathbf{x} + \\mathbf{b}, \\qquad y_o = \\sum_{j} W_{oj}\\, x_j + b_o. \\]

Each output unit is a weighted sum of the inputs plus its own bias. Return the output vector \\(\\mathbf{y}\\) rounded to four decimals.`,
    examples: [
      {
        input: 'x = [1, 2], W = [[1, 0], [0, 1]], b = [0.5, -0.5]',
        output: '[1.5, 1.5]',
        explanation: 'Identity weights pass the inputs through; the bias shifts each output.',
      },
      {
        input: 'x = [1, 1, 1], W = [[1, 1, 1]], b = [2]',
        output: '[5]',
        explanation: 'A single output sums the three inputs (3) and adds the bias (2).',
      },
    ],
    starterCode: {
      python: `def linear_forward(x, W, b):
    return [round(sum(W[o][j] * x[j] for j in range(len(x))) + b[o], 4)
            for o in range(len(W))]


print(linear_forward([1, 2], [[1, 0], [0, 1]], [0.5, -0.5]))
print(linear_forward([1, 1, 1], [[1, 1, 1]], [2]))
`,
    },
    hints: [
      'Each row of W produces one output value as a dot product with x.',
      'Add the matching bias entry b[o] after the dot product.',
      'The number of outputs equals the number of rows in W.',
    ],
    tests: [
      { input: 'x=[1,2], W=[[1,0],[0,1]], b=[0.5,-0.5]', expected: '[1.5, 1.5]' },
      { input: 'x=[1,1,1], W=[[1,1,1]], b=[2]', expected: '[5]' },
      { input: 'x=[2,-1], W=[[0.5,0.5],[1,-1]], b=[0,1]', expected: '[0.5, 4]' },
    ],
  },

  {
    slug: 'rnn-step-forward',
    title: 'Vanilla RNN Step',
    difficulty: 'medium',
    topic: 'Sequence Models',
    category: 'Sequence Models',
    statement: `A vanilla recurrent network folds a sequence one element at a time, carrying a hidden state forward. One step combines the current input with the previous hidden state through a tanh nonlinearity:

\\[ \\mathbf{h}_t = \\tanh\\!\\big( W_x \\mathbf{x}_t + W_h \\mathbf{h}_{t-1} + \\mathbf{b} \\big). \\]

\\(W_x\\) has shape (hidden, in), \\(W_h\\) has shape (hidden, hidden), and \\(\\mathbf{b}\\) has length hidden. Given \\(\\mathbf{x}\\), \\(\\mathbf{h}_{t-1}\\), the two weight matrices, and the bias, return the new hidden state rounded to four decimals.`,
    examples: [
      {
        input: 'x = [1.0], h_prev = [0, 0]\nWx = [[0.5], [0.5]], Wh = [[0.1, 0], [0, 0.1]], b = [0, 0]',
        output: '[0.4621, 0.4621]',
        explanation: 'With zero hidden state each unit computes tanh(0.5) = 0.4621.',
      },
      {
        input: 'x = [1.0, 1.0], h_prev = [0.5]\nWx = [[0.2, 0.2]], Wh = [[0.3]], b = [0.1]',
        output: '[0.5717]',
        explanation: 'Pre-activation 0.2+0.2 + 0.3*0.5 + 0.1 = 0.65; tanh(0.65) = 0.5717.',
      },
    ],
    starterCode: {
      python: `import math


def rnn_step(x, h_prev, Wx, Wh, b):
    hidden = len(b)
    h = []
    for k in range(hidden):
        z = (sum(Wx[k][j] * x[j] for j in range(len(x)))
             + sum(Wh[k][j] * h_prev[j] for j in range(len(h_prev)))
             + b[k])
        h.append(round(math.tanh(z), 4))
    return h


print(rnn_step([1.0], [0.0, 0.0], [[0.5], [0.5]], [[0.1, 0.0], [0.0, 0.1]], [0.0, 0.0]))
print(rnn_step([1.0, 1.0], [0.5], [[0.2, 0.2]], [[0.3]], [0.1]))
`,
    },
    hints: [
      'The pre-activation is two dot products plus the bias: Wx with x, and Wh with the previous hidden state.',
      'Apply tanh to each hidden unit independently after summing its pre-activation.',
      'The output length equals the hidden size, which is the length of the bias vector.',
    ],
    tests: [
      { input: 'x=[1.0], h_prev=[0,0], Wx=[[0.5],[0.5]], Wh=[[0.1,0],[0,0.1]], b=[0,0]', expected: '[0.4621, 0.4621]' },
      { input: 'x=[1.0,1.0], h_prev=[0.5], Wx=[[0.2,0.2]], Wh=[[0.3]], b=[0.1]', expected: '[0.5717]' },
      { input: 'x=[0.0], h_prev=[1.0], Wx=[[1.0]], Wh=[[0.5]], b=[0.0]', expected: '[0.4621]' },
    ],
  },

  {
    slug: 'cosine-embedding-loss',
    title: 'Cosine Embedding Loss',
    difficulty: 'medium',
    topic: 'Losses',
    category: 'Losses',
    statement: `Cosine embedding loss trains two vectors to point the same way when they are a positive pair and to pull apart when they are a negative pair. With cosine similarity

\\[ \\cos(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\lVert \\mathbf{a} \\rVert\\, \\lVert \\mathbf{b} \\rVert}, \\]

the loss for target \\(y \\in \\{1, -1\\}\\) is

\\[ \\mathcal{L} = \\begin{cases} 1 - \\cos(\\mathbf{a}, \\mathbf{b}) & y = 1 \\\\ \\max\\!\\big(0,\\ \\cos(\\mathbf{a}, \\mathbf{b}) - \\text{margin}\\big) & y = -1. \\end{cases} \\]

The margin (default \\(0\\)) only penalizes negative pairs once their similarity rises above it. Return the loss rounded to four decimals.`,
    examples: [
      {
        input: 'a = [1, 0], b = [0, 1], y = 1',
        output: '1.0',
        explanation: 'Orthogonal vectors have cosine 0; for a positive pair the loss is 1 - 0 = 1.',
      },
      {
        input: 'a = [1, 0], b = [1, 0], y = -1',
        output: '1.0',
        explanation: 'Identical vectors have cosine 1; a negative pair is fully penalized: max(0, 1 - 0) = 1.',
      },
    ],
    starterCode: {
      python: `import math


def cosine_embedding_loss(a, b, y, margin=0.0):
    dot = sum(ai * bi for ai, bi in zip(a, b))
    na = math.sqrt(sum(ai * ai for ai in a))
    nb = math.sqrt(sum(bi * bi for bi in b))
    cos = dot / (na * nb)
    if y == 1:
        loss = 1 - cos
    else:
        loss = max(0.0, cos - margin)
    return round(loss, 4)


print(cosine_embedding_loss([1, 0], [0, 1], 1))
print(cosine_embedding_loss([1, 0], [1, 0], -1))
`,
    },
    hints: [
      'Cosine similarity is the dot product divided by the product of the two norms.',
      'Positive pairs (y=1) want similarity near 1, so the loss is 1 - cos.',
      'Negative pairs only pay a penalty once cosine exceeds the margin — the max clamps it at zero otherwise.',
    ],
    tests: [
      { input: 'a=[1,0], b=[0,1], y=1', expected: '1.0' },
      { input: 'a=[1,0], b=[1,0], y=-1', expected: '1.0' },
      { input: 'a=[1,1], b=[1,0], y=1', expected: '0.2929' },
    ],
  },
];

export const PG_FORGE_CATEGORIES = [
  'Optimizers',
  'Activations',
  'Losses',
  'Normalization',
  'Attention',
  'Attention/LLM',
  'LLMs',
  'Neural Networks',
  'Classical ML',
  'Data Processing',
  'Transformers',
  'Diffusion',
  'Reinforcement Learning',
  'Embeddings',
  'Convolutions',
  'Clustering',
  'Dimensionality Reduction',
  'Metrics',
  'Sequence Models',
  'Probability',
  'Computer Vision',
  'Linear Algebra',
  'Statistics',
  'Time Series',
  'Recommenders',
];

export function getForgeProblem(slug) {
  return PG_FORGE_PROBLEMS.find((p) => p.slug === slug) || null;
}
