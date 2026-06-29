// Jupyter-style notebook cells per project — interleaved markdown (teaching) and
// runnable PURE-PYTHON code cells. No numpy/torch/pandas/sklearn: every code cell
// runs in the in-browser sandbox and prints output. Keyed by project slug.

const md = (content) => ({ type: 'markdown', content });
const py = (code) => ({ type: 'code', lang: 'python', code });

export const PROJECT_CELLS = {
  'linear-regression-from-scratch': [
    md(`## Linear regression, the whole system

Linear regression is the smallest *complete* machine-learning system: a **model** (a line), a **loss** (how wrong the line is), and an **optimizer** (how to make it less wrong). We fit it two ways and prove they agree — the closed-form normal equation, and gradient descent.

We work in plain Python lists, so every number is visible.`),
    md(`### 1. Make some data we know the answer to

We pick a true slope and intercept, then add noise. Keeping the ground truth lets us check our fit at the end.`),
    py(`import random
random.seed(0)

TRUE_SLOPE, TRUE_BIAS = 2.5, -1.0

def make_data(n=60, noise=0.5):
    xs, ys = [], []
    for _ in range(n):
        x = random.uniform(-3, 3)
        y = TRUE_SLOPE * x + TRUE_BIAS + random.gauss(0, noise)
        xs.append(x); ys.append(y)
    return xs, ys

xs, ys = make_data()
print("samples:", len(xs))
print("first point:", round(xs[0], 3), "->", round(ys[0], 3))`),
    md(`### 2. The closed form: solve it exactly

For a single feature the best-fit line has a clean formula. With \\(\\bar{x},\\bar{y}\\) the means,

\\[ \\text{slope} = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2}, \\quad \\text{bias} = \\bar{y} - \\text{slope}\\cdot\\bar{x} \\]

This hands us the exact best weights in one pass — no iteration.`),
    py(`def fit_closed_form(xs, ys):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs)
    slope = num / den
    bias = my - slope * mx
    return slope, bias

w_slope, w_bias = fit_closed_form(xs, ys)
print("closed-form slope:", round(w_slope, 4))
print("closed-form bias: ", round(w_bias, 4))
print("(true was 2.5 and -1.0)")`),
    md(`### 3. The loss: mean squared error

Gradient descent needs a number to minimize. **Mean squared error** averages the squared gap between prediction and target:

\\[ \\text{MSE}(w,b) = \\frac{1}{n}\\sum_i (w x_i + b - y_i)^2 \\]

The loss surface of a linear model is a simple bowl with exactly one minimum — which is why both methods land in the same place.`),
    py(`def mse(xs, ys, w, b):
    n = len(xs)
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / n

print("loss at closed-form fit:", round(mse(xs, ys, w_slope, w_bias), 4))
print("loss at zero  (w=0,b=0):", round(mse(xs, ys, 0.0, 0.0), 4))`),
    md(`### 4. Gradient descent: walk downhill

The gradient of MSE points uphill, so we step against it. For each weight:

\\[ \\frac{\\partial L}{\\partial w} = \\frac{2}{n}\\sum_i (w x_i + b - y_i)\\, x_i, \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum_i (w x_i + b - y_i) \\]

Start at zero, take small steps, and watch the loss fall.`),
    py(`def fit_gradient_descent(xs, ys, lr=0.05, steps=400):
    n = len(xs)
    w, b = 0.0, 0.0
    history = []
    for _ in range(steps):
        err = [(w * x + b - y) for x, y in zip(xs, ys)]
        gw = (2 / n) * sum(e * x for e, x in zip(err, xs))
        gb = (2 / n) * sum(err)
        w -= lr * gw
        b -= lr * gb
        history.append(mse(xs, ys, w, b))
    return w, b, history

gw, gb, hist = fit_gradient_descent(xs, ys)
print("step   0 loss:", round(hist[0], 4))
print("step 100 loss:", round(hist[100], 4))
print("step 399 loss:", round(hist[-1], 4))
print("GD weights:", round(gw, 4), round(gb, 4))`),
    md(`### 5. They agree

The iterative answer converged to the closed-form answer — two completely different procedures, one minimum. That is the payoff: gradient descent isn't magic, it's just walking to the bottom of a bowl you could also solve with algebra.`),
    py(`print("closed form:    slope=%.4f bias=%.4f" % (w_slope, w_bias))
print("gradient desc:  slope=%.4f bias=%.4f" % (gw, gb))
print("difference:     slope=%.5f bias=%.5f" % (abs(w_slope - gw), abs(w_bias - gb)))
print("\\nLoss fell from %.3f to %.3f over training." % (hist[0], hist[-1]))`),
    md(`**Takeaway.** You built the full ML loop: model, loss, optimizer. When a problem has a closed form, use it. When it doesn't (every deep net), gradient descent is the general tool that still finds the bottom of the bowl.`),
  ],

  'micrograd-autograd-engine': [
    md(`## Build the engine behind every deep-learning framework

Every framework — PyTorch, TensorFlow, JAX — is, at its core, an **automatic differentiation engine** wrapped in convenience. Here you write that core yourself: a scalar \`Value\` that remembers how it was computed, so calling \`.backward()\` can apply the chain rule across the whole graph.`),
    md(`### 1. A node that remembers its parents

Each \`Value\` stores its number, a \`grad\` (starts at zero), the children that produced it, and a \`_backward\` closure that knows how to push gradient to those children.`),
    py(`import math

class Value:
    def __init__(self, data, _children=()):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __repr__(self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

print(Value(3.0))`),
    md(`### 2. Addition just routes the gradient

For \\(c = a + b\\), both local derivatives are 1, so the upstream gradient flows to *both* parents unchanged. We use \`+=\` so a value used twice accumulates correctly.`),
    py(`def _add(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data + other.data, (self, other))
    def _backward():
        self.grad += out.grad
        other.grad += out.grad
    out._backward = _backward
    return out
Value.__add__ = _add

c = Value(2.0) + Value(5.0)
print("2 + 5 =", c.data)`),
    md(`### 3. Multiplication swaps the inputs

For \\(c = a \\cdot b\\) the local gradients are \\(\\partial c/\\partial a = b\\) and \\(\\partial c/\\partial b = a\\). Each parent gets the upstream gradient times *the other* operand.`),
    py(`def _mul(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data * other.data, (self, other))
    def _backward():
        self.grad += other.data * out.grad
        other.grad += self.data * out.grad
    out._backward = _backward
    return out
Value.__mul__ = _mul

def _tanh(self):
    t = math.tanh(self.data)
    out = Value(t, (self,))
    def _backward():
        self.grad += (1 - t * t) * out.grad   # d/dx tanh = 1 - tanh^2
    out._backward = _backward
    return out
Value.tanh = _tanh

print("(2 * -3).data =", (Value(2.0) * Value(-3.0)).data)`),
    md(`### 4. backward(): the chain rule on a graph

We topologically sort from the output so each node is processed only after everything that used it, seed the output gradient at 1.0, then call each \`_backward\` in reverse. That single sweep fills in every gradient.`),
    py(`def backward(self):
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
Value.backward = backward

a, b = Value(2.0), Value(-3.0)
L = (a * b + a).tanh()
L.backward()
print("L      =", round(L.data, 4))
print("dL/da  =", round(a.grad, 4))
print("dL/db  =", round(b.grad, 4))`),
    md(`### 5. Check it against the limit definition

Real backprop is only trustworthy if it matches the numerical gradient \\((f(x+h)-f(x-h))/2h\\). We bump one input by a tiny \\(h\\) and compare.`),
    py(`def f(av, bv):
    return math.tanh(av * bv + av)

h = 1e-6
num_da = (f(2.0 + h, -3.0) - f(2.0 - h, -3.0)) / (2 * h)
num_db = (f(2.0, -3.0 + h) - f(2.0, -3.0 - h)) / (2 * h)
print("analytic dL/da:", round(a.grad, 5), " numeric:", round(num_da, 5))
print("analytic dL/db:", round(b.grad, 5), " numeric:", round(num_db, 5))
print("match!" if abs(a.grad - num_da) < 1e-3 else "mismatch")`),
    md(`**Takeaway.** "Backprop" is just a reverse walk over a graph applying the chain rule and accumulating. Wrap these \`Value\`s into neurons and layers and you can train a real network with nothing but this file.`),
  ],

  'mnist-mlp-numpy': [
    md(`## A two-layer classifier, every matrix by hand

The MNIST classifier is the rite of passage of deep learning. Here we strip out the framework and the dataset and keep the *mechanics* that matter: a forward pass, a softmax cross-entropy loss, and a backward pass derived and coded by hand — all in pure Python on a tiny problem so it runs instantly.`),
    md(`### 1. The pieces: ReLU and a stable softmax

\`ReLU(x) = max(0, x)\` keeps positive signal and zeroes the rest. **Softmax** turns raw scores into probabilities; we subtract the row max first so \`exp\` never overflows.`),
    py(`import math, random
random.seed(0)

def relu(v):       return [max(0.0, x) for x in v]
def relu_mask(v):  return [1.0 if x > 0 else 0.0 for x in v]

def softmax(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    s = sum(e)
    return [x / s for x in e]

print("softmax([2,1,0]) =", [round(p, 3) for p in softmax([2.0, 1.0, 0.0])])`),
    md(`### 2. A tiny labelled dataset

Real MNIST is 784 pixels and 10 classes. The math is identical at small scale, so we use 6 inputs and 3 classes — enough to watch the loss fall without waiting on a download.`),
    py(`N_IN, N_HID, N_OUT = 6, 8, 3

def make_sample(cls):
    # class-correlated features + noise -> learnable but not trivial
    x = [random.gauss(0, 1) for _ in range(N_IN)]
    x[cls] += 2.0
    return x

data = [(make_sample(c % N_OUT), c % N_OUT) for c in range(90)]
print("examples:", len(data), " | first label:", data[0][1])`),
    md(`### 3. Initialize, then forward

Two weight matrices, two bias vectors, **He-scaled** so signals neither vanish nor explode through ReLU. The forward pass is \`hidden = ReLU(x·W1 + b1)\`, then \`softmax(hidden·W2 + b2)\`.`),
    py(`def randmat(r, c, scale):
    return [[random.gauss(0, 1) * scale for _ in range(c)] for _ in range(r)]

W1 = randmat(N_IN, N_HID, math.sqrt(2 / N_IN))
b1 = [0.0] * N_HID
W2 = randmat(N_HID, N_OUT, math.sqrt(2 / N_HID))
b2 = [0.0] * N_OUT

def matvec(x, W, b):  # x·W + b
    return [sum(x[i] * W[i][j] for i in range(len(x))) + b[j] for j in range(len(b))]

def forward(x):
    h_pre = matvec(x, W1, b1)
    h = relu(h_pre)
    logits = matvec(h, W2, b2)
    return h_pre, h, softmax(logits)

_, _, probs = forward(data[0][0])
print("initial probs:", [round(p, 3) for p in probs])`),
    md(`### 4. The backward pass that makes it learn

The reason softmax + cross-entropy is everywhere: its gradient at the logits is simply **probs − onehot**. We backprop that through \`W2\`, the ReLU mask, and \`W1\`, then nudge every parameter downhill.`),
    py(`def train_step(x, label, lr=0.02):
    global W1, b1, W2, b2
    h_pre, h, probs = forward(x)
    dlogits = probs[:]            # probs - onehot
    dlogits[label] -= 1.0
    # grads for W2, b2
    for j in range(N_HID):
        for k in range(N_OUT):
            W2[j][k] -= lr * h[j] * dlogits[k]
    for k in range(N_OUT):
        b2[k] -= lr * dlogits[k]
    # backprop into hidden, through ReLU
    dh = [sum(dlogits[k] * W2[j][k] for k in range(N_OUT)) * relu_mask(h_pre)[j]
          for j in range(N_HID)]
    for i in range(N_IN):
        for j in range(N_HID):
            W1[i][j] -= lr * x[i] * dh[j]
    for j in range(N_HID):
        b1[j] -= lr * dh[j]
    return -math.log(max(probs[label], 1e-9))

print("one step loss:", round(train_step(*data[0]), 4))`),
    md(`### 5. Train and measure accuracy

We sweep the data a few times. Cross-entropy loss should drop and accuracy should climb — the same curve you'd watch on the real 70,000-image set, just faster.`),
    py(`def accuracy():
    correct = sum(1 for x, y in data
                  if max(range(N_OUT), key=lambda k: forward(x)[2][k]) == y)
    return correct / len(data)

print("accuracy before:", round(accuracy(), 3))
for epoch in range(40):
    random.shuffle(data)
    loss = sum(train_step(x, y) for x, y in data) / len(data)
    if epoch % 10 == 0:
        print(f"epoch {epoch:2d}  loss {loss:.4f}  acc {accuracy():.3f}")
print("accuracy after: ", round(accuracy(), 3))`),
    md(`**Takeaway.** Scale these exact loops up to 784→128→10 and feed real pixels and you have the 97%+ MNIST net — no framework required. The only line that "learns" is \`probs − onehot\` flowing backward.`),
  ],

  'gradient-descent-optimizer-zoo': [
    md(`## Race four optimizers down the same hill

Every optimizer is a different rule for turning a gradient into a step, and that choice decides whether a model trains in minutes or stalls forever. We implement **SGD**, **Momentum**, **RMSProp**, and **Adam** behind one interface, then race them on the same loss surface.`),
    md(`### 1. A test function with a known minimum

We minimize \\(f(x,y) = x^2 + 10y^2\\) — a stretched bowl whose minimum is at the origin. The stretch (10×) is what makes plain SGD zig-zag, exposing why the fancier rules exist.`),
    py(`def loss(p):
    x, y = p
    return x * x + 10 * y * y

def grad(p):
    x, y = p
    return [2 * x, 20 * y]

start = [4.0, 1.5]
print("start loss:", loss(start))
print("start grad:", grad(start))`),
    md(`### 2. Plain SGD — the baseline

Subtract \`lr · grad\`. Everything else is a refinement of this one line. On the stretched bowl it overshoots in the steep \\(y\\) direction and crawls in the shallow \\(x\\) one.`),
    py(`class SGD:
    def __init__(self, lr=0.05):
        self.lr = lr
    def step(self, p, g):
        return [pi - self.lr * gi for pi, gi in zip(p, g)]

def run(opt, steps=60):
    p = start[:]
    for _ in range(steps):
        p = opt.step(p, grad(p))
    return p, loss(p)

p, l = run(SGD())
print("SGD final point:", [round(v, 4) for v in p], " loss:", round(l, 5))`),
    md(`### 3. Momentum and RMSProp

**Momentum** keeps a velocity that accumulates past gradients, building speed in consistent directions. **RMSProp** keeps a running average of squared gradients and divides the step by its root, adapting the rate *per parameter*.`),
    py(`class Momentum:
    def __init__(self, lr=0.05, beta=0.9):
        self.lr, self.beta, self.v = lr, beta, None
    def step(self, p, g):
        if self.v is None: self.v = [0.0] * len(g)
        self.v = [self.beta * v + (1 - self.beta) * gi for v, gi in zip(self.v, g)]
        return [pi - self.lr * v for pi, v in zip(p, self.v)]

class RMSProp:
    def __init__(self, lr=0.1, beta=0.9, eps=1e-8):
        self.lr, self.beta, self.eps, self.s = lr, beta, eps, None
    def step(self, p, g):
        if self.s is None: self.s = [0.0] * len(g)
        self.s = [self.beta * s + (1 - self.beta) * gi * gi for s, gi in zip(self.s, g)]
        return [pi - self.lr * gi / (s ** 0.5 + self.eps)
                for pi, gi, s in zip(p, g, self.s)]

print("Momentum:", [round(v, 4) for v in run(Momentum())[0]])
print("RMSProp :", [round(v, 4) for v in run(RMSProp())[0]])`),
    md(`### 4. Adam — momentum *and* adaptive rates

**Adam** combines both, then applies **bias correction** so the early steps aren't artificially tiny:

\\[ \\hat{m}_t = \\frac{m_t}{1-\\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t}, \\quad p \\mathrel{-}= \\frac{\\eta\\,\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\epsilon} \\]`),
    py(`class Adam:
    def __init__(self, lr=0.2, b1=0.9, b2=0.999, eps=1e-8):
        self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
        self.m = self.v = None; self.t = 0
    def step(self, p, g):
        if self.m is None: self.m = [0.0] * len(g); self.v = [0.0] * len(g)
        self.t += 1
        self.m = [self.b1 * m + (1 - self.b1) * gi for m, gi in zip(self.m, g)]
        self.v = [self.b2 * v + (1 - self.b2) * gi * gi for v, gi in zip(self.v, g)]
        out = []
        for pi, m, v in zip(p, self.m, self.v):
            mhat = m / (1 - self.b1 ** self.t)
            vhat = v / (1 - self.b2 ** self.t)
            out.append(pi - self.lr * mhat / (vhat ** 0.5 + self.eps))
        return out

print("Adam:", [round(v, 4) for v in run(Adam())[0]])`),
    md(`### 5. The leaderboard

Run all four from the same start and read off the final loss. The adaptive methods reach the minimum far closer in the same number of steps — that gap is exactly why nobody trains big models with plain SGD.`),
    py(`import math
for name, opt in [("SGD", SGD()), ("Momentum", Momentum()),
                  ("RMSProp", RMSProp()), ("Adam", Adam())]:
    _, l = run(opt)
    digits = max(1, int(-math.log10(l + 1e-12)))
    print(f"{name:9s} final loss {l:.6f}  {'#' * (digits * 3)}")`),
    md(`**Takeaway.** Same gradient, four step rules, wildly different convergence. Momentum coasts through ravines; RMSProp rescales per-axis; Adam does both. Optimizer choice is an intuition you can now reason about, not a coin flip.`),
  ],

  'kmeans-pca-on-real-data': [
    md(`## Find structure with no labels

Unsupervised learning groups data with nothing to imitate. **k-means** clusters by distance; **PCA** projects by variance. We implement both in pure Python and watch them agree on where the structure is.`),
    md(`### 1. Make clustered data

We sample points around three hidden centers. The algorithm never sees which center a point came from — recovering that grouping is the whole job.`),
    py(`import random, math
random.seed(1)

CENTERS = [(0, 0), (6, 6), (0, 7)]
def make_blobs(per=30, spread=1.0):
    pts = []
    for cx, cy in CENTERS:
        for _ in range(per):
            pts.append([cx + random.gauss(0, spread), cy + random.gauss(0, spread)])
    return pts

X = make_blobs()
print("points:", len(X), " | sample:", [round(v, 2) for v in X[0]])`),
    md(`### 2. k-means++ seeding

Random starts can put two centroids in one blob. **k-means++** spreads the seeds by choosing each new center with probability proportional to its squared distance from the nearest chosen one.`),
    py(`def dist2(a, b):
    return sum((ai - bi) ** 2 for ai, bi in zip(a, b))

def kpp_init(X, k):
    centroids = [random.choice(X)]
    while len(centroids) < k:
        d2 = [min(dist2(x, c) for c in centroids) for x in X]
        total = sum(d2)
        r, acc = random.uniform(0, total), 0
        for x, d in zip(X, d2):
            acc += d
            if acc >= r:
                centroids.append(x[:]); break
    return centroids

seeds = kpp_init(X, 3)
print("seeds:", [[round(v, 2) for v in c] for c in seeds])`),
    md(`### 3. Lloyd's algorithm: assign, then update

Repeat two steps until nothing moves: **assign** each point to its nearest centroid, then **update** each centroid to the mean of its members. The within-cluster spread (inertia) falls every round.`),
    py(`def kmeans(X, k, iters=50):
    centroids = kpp_init(X, k)
    labels = [0] * len(X)
    for _ in range(iters):
        labels = [min(range(k), key=lambda j: dist2(x, centroids[j])) for x in X]
        new = []
        for j in range(k):
            members = [X[i] for i in range(len(X)) if labels[i] == j]
            if members:
                new.append([sum(c) / len(members) for c in zip(*members)])
            else:
                new.append(centroids[j])
        if all(dist2(a, b) < 1e-9 for a, b in zip(new, centroids)):
            break
        centroids = new
    inertia = sum(dist2(X[i], centroids[labels[i]]) for i in range(len(X)))
    return labels, centroids, inertia

labels, centroids, inertia = kmeans(X, 3)
print("centroids:", [[round(v, 2) for v in c] for c in centroids])
print("inertia:", round(inertia, 2))`),
    md(`### 4. PCA from the covariance matrix

PCA finds the directions of greatest variance. For 2D data we build the \\(2\\times2\\) covariance matrix and take its top eigenvector via the power iteration — the axis the data spreads along most.`),
    py(`def covariance(X):
    n = len(X)
    mx = [sum(c) / n for c in zip(*X)]
    cov = [[0.0, 0.0], [0.0, 0.0]]
    for x in X:
        d = [x[0] - mx[0], x[1] - mx[1]]
        for i in range(2):
            for j in range(2):
                cov[i][j] += d[i] * d[j] / n
    return cov, mx

def top_eigenvector(M, iters=200):
    v = [1.0, 0.0]
    for _ in range(iters):
        w = [M[0][0]*v[0] + M[0][1]*v[1], M[1][0]*v[0] + M[1][1]*v[1]]
        norm = math.hypot(*w)
        v = [w[0]/norm, w[1]/norm]
    return v

cov, mean = covariance(X)
pc1 = top_eigenvector(cov)
print("covariance:", [[round(v, 2) for v in row] for row in cov])
print("principal axis:", [round(v, 3) for v in pc1])`),
    md(`### 5. Project onto the principal axis

Projecting each point onto PC1 compresses 2D to 1D while keeping the most variance. Sorting by that coordinate lays the three clusters out in a line you could plot on a single number axis.`),
    py(`def project(x, mean, axis):
    return sum((xi - mi) * ai for xi, mi, ai in zip(x, mean, axis))

coords = [(project(X[i], mean, pc1), labels[i]) for i in range(len(X))]
for cl in range(3):
    vals = [c for c, l in coords if l == cl]
    print(f"cluster {cl}: {len(vals)} pts, "
          f"PC1 range [{min(vals):.2f}, {max(vals):.2f}]")`),
    md(`**Takeaway.** Distance-based grouping (k-means) and variance-based projection (PCA) are the two workhorses of exploratory analysis. Together they turn an unlabeled cloud into clusters you can see on a plot.`),
  ],

  'tokenizer-ngram-language-model': [
    md(`## A language model you can trace to a count

Before neural nets, language models were **n-gram** counters: predict the next token from the ones just before it, using nothing but tallies. Every probability traces back to a count in the training data — fully interpretable, and surprisingly capable.`),
    md(`### 1. Tokenize

We lowercase and split on whitespace, wrapping each sentence in start (\`<s>\`) and end (\`</s>\`) markers so the model can learn how text begins and ends.`),
    py(`def tokenize(text):
    out = []
    for line in text.strip().split("\\n"):
        out += ["<s>"] + line.lower().split() + ["</s>"]
    return out

corpus = """the cat sat on the mat
the cat ate the fish
the dog sat on the log
the dog ate the bone"""

tokens = tokenize(corpus)
print("token count:", len(tokens))
print("first 8:", tokens[:8])`),
    md(`### 2. Count the n-grams

For a trigram model we slide a window of 3 and tally how often each two-word context is followed by each next word. These raw counts *are* the model.`),
    py(`from collections import defaultdict, Counter

class NGram:
    def __init__(self, n=3, k=0.5):
        self.n, self.k = n, k
        self.counts = defaultdict(Counter)
        self.vocab = set()
    def fit(self, toks):
        self.vocab.update(toks)
        for i in range(len(toks) - self.n + 1):
            ctx = tuple(toks[i:i + self.n - 1])
            nxt = toks[i + self.n - 1]
            self.counts[ctx][nxt] += 1

model = NGram(n=3)
model.fit(tokens)
print("vocab size:", len(model.vocab))
print("after ('the','cat'):", dict(model.counts[('the', 'cat')]))`),
    md(`### 3. Counts → probabilities, with smoothing

We divide each context→token count by the context total. **Add-k smoothing** gives unseen continuations a small nonzero share, so the model never assigns probability zero:

\\[ P(w \\mid c) = \\frac{\\text{count}(c, w) + k}{\\text{count}(c) + k\\,|V|} \\]`),
    py(`def prob(self, ctx, token):
    c = self.counts[ctx]
    return (c[token] + self.k) / (sum(c.values()) + self.k * len(self.vocab))
NGram.prob = prob

ctx = ('the', 'cat')
print("P(sat | the cat) =", round(model.prob(ctx, 'sat'), 4))
print("P(ate | the cat) =", round(model.prob(ctx, 'ate'), 4))
print("P(dog | the cat) =", round(model.prob(ctx, 'dog'), 4), "(unseen, smoothed)")`),
    md(`### 4. Sample new text

Start from a context, draw the next token from its conditional distribution, slide the window, and repeat. The model speaks in the patterns it counted.`),
    py(`import random
random.seed(0)

def sample(self, length=12):
    out = ["<s>", "the"]
    for _ in range(length):
        ctx = tuple(out[-(self.n - 1):])
        words = list(self.vocab)
        weights = [self.prob(ctx, w) for w in words]
        nxt = random.choices(words, weights)[0]
        out.append(nxt)
        if nxt == "</s>":
            break
    return " ".join(w for w in out if w not in ("<s>", "</s>"))
NGram.sample = sample

for _ in range(3):
    print("->", model.sample())`),
    md(`### 5. Perplexity: how surprised is the model?

On held-out text we average the negative log-probability and exponentiate. Lower perplexity = less surprised = better model. Higher-order n-grams usually drop perplexity until they start to overfit.`),
    py(`import math
def perplexity(self, toks):
    logp, count = 0.0, 0
    for i in range(len(toks) - self.n + 1):
        ctx = tuple(toks[i:i + self.n - 1])
        nxt = toks[i + self.n - 1]
        logp += math.log(self.prob(ctx, nxt))
        count += 1
    return math.exp(-logp / count)
NGram.perplexity = perplexity

print("trigram perplexity on training text:",
      round(model.perplexity(tokens), 3))
bi = NGram(n=2); bi.fit(tokens)
print("bigram  perplexity:", round(bi.perplexity(tokens), 3))`),
    md(`**Takeaway.** A complete language model with no neural net: tokenize, count, smooth, sample, score. Every number is a tally you can inspect — the interpretable baseline every fancier model is measured against.`),
  ],

  'char-rnn-text-generator': [
    md(`## A recurrent network, one character at a time

Before transformers, **recurrent networks** read sequences by carrying a hidden state — a compressed memory of everything seen so far. We build a minimal char-RNN in pure Python: it predicts the next character from the current one plus its hidden state, and we train it by hand.`),
    md(`### 1. Build the vocabulary

We collect the unique characters and map each to an index and back. The model works entirely in these integer ids.`),
    py(`import math, random
random.seed(0)

text = "hello world "
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
V = len(chars)
print("vocab:", chars)
print("size:", V)`),
    md(`### 2. The recurrent cell

The hidden state updates as \\(h_t = \\tanh(W_{xh} x_t + W_{hh} h_{t-1})\\), and the output logits are \\(W_{hy} h_t\\). \\(W_{hh}\\) is what lets information from earlier characters reach later ones.`),
    py(`H = 12  # hidden size

def randmat(r, c):
    return [[random.gauss(0, 0.3) for _ in range(c)] for _ in range(r)]

Wxh = randmat(H, V)   # input -> hidden
Whh = randmat(H, H)   # hidden -> hidden
Why = randmat(V, H)   # hidden -> output

def step(x_idx, h):
    x = [1.0 if i == x_idx else 0.0 for i in range(V)]
    h_new = [math.tanh(sum(Wxh[k][i] * x[i] for i in range(V)) +
                       sum(Whh[k][j] * h[j] for j in range(H)))
             for k in range(H)]
    logits = [sum(Why[o][k] * h_new[k] for k in range(H)) for o in range(V)]
    return h_new, logits

h0 = [0.0] * H
h1, logits = step(stoi['h'], h0)
print("hidden after 'h' (first 3):", [round(v, 3) for v in h1[:3]])`),
    md(`### 3. Softmax and a forward sweep over the sequence

Cross-entropy compares predicted next-char probabilities to the true next char. We sweep the whole string, carrying the hidden state forward, and sum the loss.`),
    py(`def softmax(z):
    m = max(z); e = [math.exp(v - m) for v in z]; s = sum(e)
    return [v / s for v in e]

def sequence_loss():
    h = [0.0] * H
    loss = 0.0
    for t in range(len(text) - 1):
        h, logits = step(stoi[text[t]], h)
        p = softmax(logits)
        loss += -math.log(max(p[stoi[text[t + 1]]], 1e-9))
    return loss / (len(text) - 1)

print("initial avg loss:", round(sequence_loss(), 4))`),
    md(`### 4. Train with coordinate descent

Full backprop-through-time is a lot of bookkeeping; to keep this cell honest and runnable we train the output weights \\(W_{hy}\\) by **coordinate descent**: probe each weight up and down a notch and keep whichever direction lowers the loss. Slow, but it provably drives the next-char loss down.`),
    py(`def train_Why(steps=8, delta=0.2):
    for s in range(steps):
        for o in range(V):
            for k in range(H):
                base = sequence_loss()
                orig = Why[o][k]
                Why[o][k] = orig + delta
                up = sequence_loss()
                Why[o][k] = orig - delta
                down = sequence_loss()
                # keep the best of {down, stay, up}
                best = min((base, orig), (up, orig + delta), (down, orig - delta))
                Why[o][k] = best[1]
        print(f"step {s}  loss {sequence_loss():.4f}")
    return sequence_loss()

final = train_Why()
print("final loss:", round(final, 4))`),
    md(`### 5. Sample from the trained model

Feed a seed character, sample from the softmax with a **temperature** (lower = more confident), append it, and repeat. Even this tiny net learns to follow 'h' with 'e', 'l' with 'l' — the local structure of its training string.`),
    py(`def sample(seed='h', length=15, temp=0.5):
    h = [0.0] * H
    idx = stoi.get(seed, 0)
    out = [seed]
    for _ in range(length):
        h, logits = step(idx, h)
        p = softmax([v / temp for v in logits])
        r, acc = random.random(), 0.0
        for i, pi in enumerate(p):
            acc += pi
            if acc >= r:
                idx = i; break
        out.append(itos[idx])
    return "".join(out)

print("sampled:", repr(sample()))`),
    md(`**Takeaway.** The hidden state is the whole idea: a vector that carries the past into the present. Swap finite differences for real backprop-through-time and scale the weights up and the same loop learns to babble in any text's style.`),
  ],

  'transformer-block-from-scratch': [
    md(`## The unit behind every LLM

A **transformer block**, stacked dozens of times, *is* a large language model. We build one from primitives in pure Python: scaled dot-product attention, multiple heads, residual connections, and a feed-forward network — small enough to run, faithful enough to read the paper from.`),
    md(`### 1. Scaled dot-product attention

Each position emits a **query**, **key**, and **value**. A query scores every key by dot product, scales by \\(1/\\sqrt{d}\\) to keep the softmax tame, then takes a weighted sum of values:

\\[ \\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d}}\\right)V \\]`),
    py(`import math

def softmax(z):
    m = max(z); e = [math.exp(v - m) for v in z]; s = sum(e)
    return [v / s for v in e]

def dot(a, b): return sum(x * y for x, y in zip(a, b))

def attention(Q, K, V, causal=True):
    T, d = len(Q), len(Q[0])
    out = []
    for i in range(T):
        scores = [dot(Q[i], K[j]) / math.sqrt(d) for j in range(T)]
        if causal:
            for j in range(i + 1, T):
                scores[j] = float("-inf")   # can't see the future
        w = softmax(scores)
        out.append([sum(w[j] * V[j][c] for j in range(T)) for c in range(d)])
    return out

Q = K = V = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
print("attention out:", [[round(v, 3) for v in row] for row in attention(Q, K, V)])`),
    md(`### 2. The causal mask in action

Filling future scores with \\(-\\infty\\) means position 0 attends only to itself, position 1 to {0,1}, and so on. That triangular masking is what makes the model predict left-to-right.`),
    py(`# row i should put zero weight on any column j > i
def attn_weights(Q, K):
    T, d = len(Q), len(Q[0])
    rows = []
    for i in range(T):
        scores = [dot(Q[i], K[j]) / math.sqrt(d) for j in range(T)]
        for j in range(i + 1, T):
            scores[j] = float("-inf")
        rows.append([round(w, 3) for w in softmax(scores)])
    return rows

for i, row in enumerate(attn_weights(Q, K)):
    print(f"pos {i} attends:", row)`),
    md(`### 3. Multiple heads

One attention is one relationship. **Multi-head** runs several in parallel on slices of the vector, each free to track a different pattern, then concatenates the results. Here two heads over a 4-dim input, each seeing 2 dims.`),
    py(`def split_heads(X, n_heads):
    d = len(X[0]); hs = d // n_heads
    return [[row[h*hs:(h+1)*hs] for row in X] for h in range(n_heads)]

def multi_head(X, n_heads=2):
    heads = split_heads(X, n_heads)
    outs = [attention(h, h, h) for h in heads]
    # concatenate per position
    T = len(X)
    return [sum((outs[hh][t] for hh in range(n_heads)), []) for t in range(T)]

X = [[1.0, 0.0, 0.5, 0.2],
     [0.1, 1.0, 0.0, 0.3],
     [0.4, 0.4, 1.0, 0.0]]
mh = multi_head(X)
print("multi-head shape:", len(mh), "x", len(mh[0]))
print("pos 0:", [round(v, 3) for v in mh[0]])`),
    md(`### 4. Residuals, layer norm, and the feed-forward net

The full block wraps each sublayer in \`x + sublayer(norm(x))\`. The **residual** lets gradients skip; **layer norm** keeps activations centered; the **feed-forward** net (widen, nonlinearity, narrow) processes each position independently.`),
    py(`def layer_norm(v, eps=1e-5):
    mu = sum(v) / len(v)
    var = sum((x - mu) ** 2 for x in v) / len(v)
    return [(x - mu) / math.sqrt(var + eps) for x in v]

def gelu(x):  # tanh approximation
    return 0.5 * x * (1 + math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)))

def feed_forward(v):
    wide = [gelu(x * 1.5) for x in v] + [gelu(-x) for x in v]   # widen 2x
    return [sum(wide) / len(wide) + x for x in v]               # narrow + residual

def block(X):
    a = multi_head([layer_norm(r) for r in X])
    X = [[xi + ai for xi, ai in zip(x, a_row)] for x, a_row in zip(X, a)]
    return [feed_forward(layer_norm(r)) for r in X]

out = block(X)
print("block in :", len(X), "x", len(X[0]))
print("block out:", len(out), "x", len(out[0]))`),
    md(`### 5. Verify shape in = shape out

A transformer block is shape-preserving — that's what lets you stack it. We assert the output has the same (positions × dim) shape as the input, the one invariant the whole architecture relies on.`),
    py(`assert len(out) == len(X), "position count changed!"
assert len(out[0]) == len(X[0]), "dim changed!"
print("ok — shape preserved:", len(out), "x", len(out[0]))
print("ready to stack this block N times into an LLM.")`),
    md(`**Takeaway.** Attention scores tokens against tokens; heads track several relations at once; residuals and norm keep deep stacks trainable. Stack this block, add embeddings and a final projection, and you have read the Transformer paper as code you already wrote.`),
  ],

  'cnn-image-classifier': [
    md(`## How a network sees: convolution from scratch

Convolutional networks exploit one fact: a useful feature looks the same wherever it appears in an image. We implement the core operations — convolution, ReLU, and pooling — in pure Python on a tiny image, so the mechanics are fully visible.`),
    md(`### 1. A tiny image and an edge kernel

Our "image" is a 5×5 grid with a bright vertical bar. A **kernel** is a small weight grid we slide across it; a vertical-edge kernel responds strongly where brightness changes left-to-right.`),
    py(`image = [
    [0, 0, 9, 0, 0],
    [0, 0, 9, 0, 0],
    [0, 0, 9, 0, 0],
    [0, 0, 9, 0, 0],
    [0, 0, 9, 0, 0],
]
vertical_edge = [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1],
]
for row in image:
    print(" ".join(f"{v:1d}" for v in row))`),
    md(`### 2. The convolution operation

Slide the kernel over every position, multiply overlapping cells, and sum. Each output value measures how strongly that patch matches the kernel's pattern — this is the single operation a conv layer repeats.`),
    py(`def convolve(img, kernel):
    H, W = len(img), len(img[0])
    kh, kw = len(kernel), len(kernel[0])
    out = []
    for i in range(H - kh + 1):
        row = []
        for j in range(W - kw + 1):
            s = sum(img[i + a][j + b] * kernel[a][b]
                    for a in range(kh) for b in range(kw))
            row.append(s)
        out.append(row)
    return out

feat = convolve(image, vertical_edge)
print("feature map:")
for row in feat:
    print(" ".join(f"{v:4d}" for v in row))`),
    md(`### 3. ReLU: keep what fired

A conv layer is followed by a nonlinearity. **ReLU** zeroes negative responses, keeping only the places the feature was actually present — here, the two edges of the bar.`),
    py(`def relu2d(grid):
    return [[max(0, v) for v in row] for row in grid]

activated = relu2d(feat)
print("after ReLU:")
for row in activated:
    print(" ".join(f"{v:3d}" for v in row))`),
    md(`### 4. Max pooling: shrink and stay robust

**Pooling** takes the max over each 2×2 block. It halves the spatial size (cheaper deeper layers) and makes the response tolerant to small shifts of the feature.`),
    py(`def max_pool(grid, size=2):
    H, W = len(grid), len(grid[0])
    out = []
    for i in range(0, H - size + 1, size):
        row = []
        for j in range(0, W - size + 1, size):
            block = [grid[i + a][j + b] for a in range(size) for b in range(size)]
            row.append(max(block))
        out.append(row)
    return out

pooled = max_pool(activated)
print("after 2x2 max-pool:")
for row in pooled:
    print(" ".join(f"{v:3d}" for v in row))`),
    md(`### 5. Stack into a classifier head

Real CNNs stack conv→ReLU→pool blocks, doubling channels as the image shrinks, then flatten and feed a small linear classifier. We flatten our feature map and run a one-line linear score to mimic that final head.`),
    py(`def flatten(grid):
    return [v for row in grid for v in row]

import random
random.seed(0)
flat = flatten(pooled)
weights = [random.gauss(0, 0.5) for _ in flat]
score = sum(w * x for w, x in zip(weights, flat))
print("flattened features:", flat)
print("class score (logit):", round(score, 3))
print("-> a softmax over several such scores gives class probabilities")`),
    md(`**Takeaway.** Convolution detects a pattern everywhere at once; ReLU keeps the hits; pooling shrinks and stabilizes. Stack those blocks, add a linear head, train with the optimizer zoo, and you have a real image classifier — the framework version just does this fast on a GPU.`),
  ],

  'tiny-vae-demo': [
    md(`## A generative model: compress, then dream

A **variational autoencoder** learns a smooth latent space organized well enough that decoding a *random* point produces a plausible new sample. We build the core ideas — encoder, the reparameterization trick, decoder, and the ELBO loss — in pure Python on 1-D data so every step runs.`),
    md(`### 1. Data with hidden structure

Our data is drawn from two clusters on a line. A good latent variable should learn to encode "which cluster, and where within it" — then sampling the latent generates new in-distribution points.`),
    py(`import math, random
random.seed(0)

def make_data(n=40):
    pts = []
    for _ in range(n):
        center = random.choice([-2.0, 3.0])
        pts.append(center + random.gauss(0, 0.4))
    return pts

data = make_data()
print("samples:", len(data))
print("range:", round(min(data), 2), "to", round(max(data), 2))`),
    md(`### 2. The encoder: data → distribution

Instead of a single code, the encoder outputs a **mean** and **log-variance** describing a Gaussian over the latent \\(z\\). Encoding a distribution (not a point) is what makes the latent space continuous.`),
    py(`# tiny linear encoder: x -> (mu, logvar)
enc_w_mu,  enc_b_mu  = 0.4, 0.0
enc_w_lv,  enc_b_lv  = 0.0, -0.7

def encode(x):
    mu = enc_w_mu * x + enc_b_mu
    logvar = enc_w_lv * x + enc_b_lv
    return mu, logvar

mu, logvar = encode(data[0])
print("x =", round(data[0], 3))
print("encoded mu =", round(mu, 3), " logvar =", round(logvar, 3))`),
    md(`### 3. The reparameterization trick

We need to sample \\(z\\) but still backprop through it. The trick: \\(z = \\mu + \\sigma \\cdot \\epsilon\\) with \\(\\epsilon\\sim\\mathcal{N}(0,1)\\). The randomness sits in \\(\\epsilon\\), *outside* the gradient path, so the network stays differentiable.`),
    py(`def reparam(mu, logvar):
    std = math.exp(0.5 * logvar)
    eps = random.gauss(0, 1)
    return mu + std * eps

zs = [reparam(*encode(x)) for x in data]
print("sampled latents (first 5):", [round(z, 3) for z in zs[:5]])`),
    md(`### 4. Decoder and the ELBO loss

The **decoder** maps \\(z\\) back to data space. The loss balances two terms: **reconstruction** (decoded output should match the input) and the **KL divergence** pulling the latent toward a unit Gaussian so the space stays sampleable:

\\[ \\mathcal{L} = \\underbrace{(x-\\hat{x})^2}_{\\text{reconstruct}} + \\underbrace{-\\tfrac{1}{2}\\sum(1+\\log\\sigma^2-\\mu^2-\\sigma^2)}_{\\text{KL}} \\]`),
    py(`dec_w, dec_b = 1.5, 0.5
def decode(z):
    return dec_w * z + dec_b

def kl(mu, logvar):
    return -0.5 * (1 + logvar - mu * mu - math.exp(logvar))

def elbo(x):
    mu, logvar = encode(x)
    z = reparam(mu, logvar)
    recon = (decode(z) - x) ** 2
    return recon + kl(mu, logvar), recon, kl(mu, logvar)

total, recon, kld = elbo(data[0])
print("loss =", round(total, 3), " (recon", round(recon, 3),
      "+ KL", round(kld, 3), ")")
avg = sum(elbo(x)[0] for x in data) / len(data)
print("average ELBO over dataset:", round(avg, 3))`),
    md(`### 5. Generate brand-new samples

The whole point: once trained, *ignore the encoder*. Draw \\(z\\) straight from the standard-normal **prior**, decode it, and you get fresh samples the model never saw. That is generation.`),
    py(`def generate(n=6):
    out = []
    for _ in range(n):
        z = random.gauss(0, 1)   # sample the prior directly
        out.append(decode(z))
    return out

new = generate()
print("generated samples:", [round(v, 3) for v in new])
print("(decoded from random latent points — never in the data)")`),
    md(`**Takeaway.** Encode to a distribution, sample with the reparameterization trick, decode, and regularize the latent toward a normal with KL. Swap the linear maps for neural nets and the data for MNIST pixels and the same recipe dreams up handwritten digits.`),
  ],
};

export function getProjectCells(slug) {
  return PROJECT_CELLS[slug] || null;
}
