const e=a=>({type:"markdown",content:a}),t=a=>({type:"code",lang:"python",code:a}),i={"linear-regression-from-scratch":[e(`## Linear regression, the whole system

Linear regression is the smallest *complete* machine-learning system: a **model** (a line), a **loss** (how wrong the line is), and an **optimizer** (how to make it less wrong). We fit it two ways and prove they agree — the closed-form normal equation, and gradient descent.

We work in plain Python lists, so every number is visible.`),e(`### 1. Make some data we know the answer to

We pick a true slope and intercept, then add noise. Keeping the ground truth lets us check our fit at the end.`),t(`import random
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
print("first point:", round(xs[0], 3), "->", round(ys[0], 3))`),e(`### 2. The closed form: solve it exactly

For a single feature the best-fit line has a clean formula. With \\(\\bar{x},\\bar{y}\\) the means,

\\[ \\text{slope} = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2}, \\quad \\text{bias} = \\bar{y} - \\text{slope}\\cdot\\bar{x} \\]

This hands us the exact best weights in one pass — no iteration.`),t(`def fit_closed_form(xs, ys):
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
print("(true was 2.5 and -1.0)")`),e(`### 3. The loss: mean squared error

Gradient descent needs a number to minimize. **Mean squared error** averages the squared gap between prediction and target:

\\[ \\text{MSE}(w,b) = \\frac{1}{n}\\sum_i (w x_i + b - y_i)^2 \\]

The loss surface of a linear model is a simple bowl with exactly one minimum — which is why both methods land in the same place.`),t(`def mse(xs, ys, w, b):
    n = len(xs)
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / n

print("loss at closed-form fit:", round(mse(xs, ys, w_slope, w_bias), 4))
print("loss at zero  (w=0,b=0):", round(mse(xs, ys, 0.0, 0.0), 4))`),e(`### 4. Gradient descent: walk downhill

The gradient of MSE points uphill, so we step against it. For each weight:

\\[ \\frac{\\partial L}{\\partial w} = \\frac{2}{n}\\sum_i (w x_i + b - y_i)\\, x_i, \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum_i (w x_i + b - y_i) \\]

Start at zero, take small steps, and watch the loss fall.`),t(`def fit_gradient_descent(xs, ys, lr=0.05, steps=400):
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
print("GD weights:", round(gw, 4), round(gb, 4))`),e(`### 5. They agree

The iterative answer converged to the closed-form answer — two completely different procedures, one minimum. That is the payoff: gradient descent isn't magic, it's just walking to the bottom of a bowl you could also solve with algebra.`),t(`print("closed form:    slope=%.4f bias=%.4f" % (w_slope, w_bias))
print("gradient desc:  slope=%.4f bias=%.4f" % (gw, gb))
print("difference:     slope=%.5f bias=%.5f" % (abs(w_slope - gw), abs(w_bias - gb)))
print("\\nLoss fell from %.3f to %.3f over training." % (hist[0], hist[-1]))`),e("**Takeaway.** You built the full ML loop: model, loss, optimizer. When a problem has a closed form, use it. When it doesn't (every deep net), gradient descent is the general tool that still finds the bottom of the bowl.")],"micrograd-autograd-engine":[e("## Build the engine behind every deep-learning framework\n\nEvery framework — PyTorch, TensorFlow, JAX — is, at its core, an **automatic differentiation engine** wrapped in convenience. Here you write that core yourself: a scalar `Value` that remembers how it was computed, so calling `.backward()` can apply the chain rule across the whole graph."),e("### 1. A node that remembers its parents\n\nEach `Value` stores its number, a `grad` (starts at zero), the children that produced it, and a `_backward` closure that knows how to push gradient to those children."),t(`import math

class Value:
    def __init__(self, data, _children=()):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __repr__(self):
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

print(Value(3.0))`),e("### 2. Addition just routes the gradient\n\nFor \\(c = a + b\\), both local derivatives are 1, so the upstream gradient flows to *both* parents unchanged. We use `+=` so a value used twice accumulates correctly."),t(`def _add(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data + other.data, (self, other))
    def _backward():
        self.grad += out.grad
        other.grad += out.grad
    out._backward = _backward
    return out
Value.__add__ = _add

c = Value(2.0) + Value(5.0)
print("2 + 5 =", c.data)`),e(`### 3. Multiplication swaps the inputs

For \\(c = a \\cdot b\\) the local gradients are \\(\\partial c/\\partial a = b\\) and \\(\\partial c/\\partial b = a\\). Each parent gets the upstream gradient times *the other* operand.`),t(`def _mul(self, other):
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

print("(2 * -3).data =", (Value(2.0) * Value(-3.0)).data)`),e("### 4. backward(): the chain rule on a graph\n\nWe topologically sort from the output so each node is processed only after everything that used it, seed the output gradient at 1.0, then call each `_backward` in reverse. That single sweep fills in every gradient."),t(`def backward(self):
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
print("dL/db  =", round(b.grad, 4))`),e(`### 5. Check it against the limit definition

Real backprop is only trustworthy if it matches the numerical gradient \\((f(x+h)-f(x-h))/2h\\). We bump one input by a tiny \\(h\\) and compare.`),t(`def f(av, bv):
    return math.tanh(av * bv + av)

h = 1e-6
num_da = (f(2.0 + h, -3.0) - f(2.0 - h, -3.0)) / (2 * h)
num_db = (f(2.0, -3.0 + h) - f(2.0, -3.0 - h)) / (2 * h)
print("analytic dL/da:", round(a.grad, 5), " numeric:", round(num_da, 5))
print("analytic dL/db:", round(b.grad, 5), " numeric:", round(num_db, 5))
print("match!" if abs(a.grad - num_da) < 1e-3 else "mismatch")`),e('**Takeaway.** "Backprop" is just a reverse walk over a graph applying the chain rule and accumulating. Wrap these `Value`s into neurons and layers and you can train a real network with nothing but this file.')],"mnist-mlp-numpy":[e(`## A two-layer classifier, every matrix by hand

The MNIST classifier is the rite of passage of deep learning. Here we strip out the framework and the dataset and keep the *mechanics* that matter: a forward pass, a softmax cross-entropy loss, and a backward pass derived and coded by hand — all in pure Python on a tiny problem so it runs instantly.`),e("### 1. The pieces: ReLU and a stable softmax\n\n`ReLU(x) = max(0, x)` keeps positive signal and zeroes the rest. **Softmax** turns raw scores into probabilities; we subtract the row max first so `exp` never overflows."),t(`import math, random
random.seed(0)

def relu(v):       return [max(0.0, x) for x in v]
def relu_mask(v):  return [1.0 if x > 0 else 0.0 for x in v]

def softmax(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    s = sum(e)
    return [x / s for x in e]

print("softmax([2,1,0]) =", [round(p, 3) for p in softmax([2.0, 1.0, 0.0])])`),e(`### 2. A tiny labelled dataset

Real MNIST is 784 pixels and 10 classes. The math is identical at small scale, so we use 6 inputs and 3 classes — enough to watch the loss fall without waiting on a download.`),t(`N_IN, N_HID, N_OUT = 6, 8, 3

def make_sample(cls):
    # class-correlated features + noise -> learnable but not trivial
    x = [random.gauss(0, 1) for _ in range(N_IN)]
    x[cls] += 2.0
    return x

data = [(make_sample(c % N_OUT), c % N_OUT) for c in range(90)]
print("examples:", len(data), " | first label:", data[0][1])`),e("### 3. Initialize, then forward\n\nTwo weight matrices, two bias vectors, **He-scaled** so signals neither vanish nor explode through ReLU. The forward pass is `hidden = ReLU(x·W1 + b1)`, then `softmax(hidden·W2 + b2)`."),t(`def randmat(r, c, scale):
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
print("initial probs:", [round(p, 3) for p in probs])`),e("### 4. The backward pass that makes it learn\n\nThe reason softmax + cross-entropy is everywhere: its gradient at the logits is simply **probs − onehot**. We backprop that through `W2`, the ReLU mask, and `W1`, then nudge every parameter downhill."),t(`def train_step(x, label, lr=0.02):
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

print("one step loss:", round(train_step(*data[0]), 4))`),e(`### 5. Train and measure accuracy

We sweep the data a few times. Cross-entropy loss should drop and accuracy should climb — the same curve you'd watch on the real 70,000-image set, just faster.`),t(`def accuracy():
    correct = sum(1 for x, y in data
                  if max(range(N_OUT), key=lambda k: forward(x)[2][k]) == y)
    return correct / len(data)

print("accuracy before:", round(accuracy(), 3))
for epoch in range(40):
    random.shuffle(data)
    loss = sum(train_step(x, y) for x, y in data) / len(data)
    if epoch % 10 == 0:
        print(f"epoch {epoch:2d}  loss {loss:.4f}  acc {accuracy():.3f}")
print("accuracy after: ", round(accuracy(), 3))`),e('**Takeaway.** Scale these exact loops up to 784→128→10 and feed real pixels and you have the 97%+ MNIST net — no framework required. The only line that "learns" is `probs − onehot` flowing backward.')],"gradient-descent-optimizer-zoo":[e(`## Race four optimizers down the same hill

Every optimizer is a different rule for turning a gradient into a step, and that choice decides whether a model trains in minutes or stalls forever. We implement **SGD**, **Momentum**, **RMSProp**, and **Adam** behind one interface, then race them on the same loss surface.`),e(`### 1. A test function with a known minimum

We minimize \\(f(x,y) = x^2 + 10y^2\\) — a stretched bowl whose minimum is at the origin. The stretch (10×) is what makes plain SGD zig-zag, exposing why the fancier rules exist.`),t(`def loss(p):
    x, y = p
    return x * x + 10 * y * y

def grad(p):
    x, y = p
    return [2 * x, 20 * y]

start = [4.0, 1.5]
print("start loss:", loss(start))
print("start grad:", grad(start))`),e("### 2. Plain SGD — the baseline\n\nSubtract `lr · grad`. Everything else is a refinement of this one line. On the stretched bowl it overshoots in the steep \\(y\\) direction and crawls in the shallow \\(x\\) one."),t(`class SGD:
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
print("SGD final point:", [round(v, 4) for v in p], " loss:", round(l, 5))`),e(`### 3. Momentum and RMSProp

**Momentum** keeps a velocity that accumulates past gradients, building speed in consistent directions. **RMSProp** keeps a running average of squared gradients and divides the step by its root, adapting the rate *per parameter*.`),t(`class Momentum:
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
print("RMSProp :", [round(v, 4) for v in run(RMSProp())[0]])`),e(`### 4. Adam — momentum *and* adaptive rates

**Adam** combines both, then applies **bias correction** so the early steps aren't artificially tiny:

\\[ \\hat{m}_t = \\frac{m_t}{1-\\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t}, \\quad p \\mathrel{-}= \\frac{\\eta\\,\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\epsilon} \\]`),t(`class Adam:
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

print("Adam:", [round(v, 4) for v in run(Adam())[0]])`),e(`### 5. The leaderboard

Run all four from the same start and read off the final loss. The adaptive methods reach the minimum far closer in the same number of steps — that gap is exactly why nobody trains big models with plain SGD.`),t(`import math
for name, opt in [("SGD", SGD()), ("Momentum", Momentum()),
                  ("RMSProp", RMSProp()), ("Adam", Adam())]:
    _, l = run(opt)
    digits = max(1, int(-math.log10(l + 1e-12)))
    print(f"{name:9s} final loss {l:.6f}  {'#' * (digits * 3)}")`),e("**Takeaway.** Same gradient, four step rules, wildly different convergence. Momentum coasts through ravines; RMSProp rescales per-axis; Adam does both. Optimizer choice is an intuition you can now reason about, not a coin flip.")],"kmeans-pca-on-real-data":[e(`## Find structure with no labels

Unsupervised learning groups data with nothing to imitate. **k-means** clusters by distance; **PCA** projects by variance. We implement both in pure Python and watch them agree on where the structure is.`),e(`### 1. Make clustered data

We sample points around three hidden centers. The algorithm never sees which center a point came from — recovering that grouping is the whole job.`),t(`import random, math
random.seed(1)

CENTERS = [(0, 0), (6, 6), (0, 7)]
def make_blobs(per=30, spread=1.0):
    pts = []
    for cx, cy in CENTERS:
        for _ in range(per):
            pts.append([cx + random.gauss(0, spread), cy + random.gauss(0, spread)])
    return pts

X = make_blobs()
print("points:", len(X), " | sample:", [round(v, 2) for v in X[0]])`),e(`### 2. k-means++ seeding

Random starts can put two centroids in one blob. **k-means++** spreads the seeds by choosing each new center with probability proportional to its squared distance from the nearest chosen one.`),t(`def dist2(a, b):
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
print("seeds:", [[round(v, 2) for v in c] for c in seeds])`),e(`### 3. Lloyd's algorithm: assign, then update

Repeat two steps until nothing moves: **assign** each point to its nearest centroid, then **update** each centroid to the mean of its members. The within-cluster spread (inertia) falls every round.`),t(`def kmeans(X, k, iters=50):
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
print("inertia:", round(inertia, 2))`),e(`### 4. PCA from the covariance matrix

PCA finds the directions of greatest variance. For 2D data we build the \\(2\\times2\\) covariance matrix and take its top eigenvector via the power iteration — the axis the data spreads along most.`),t(`def covariance(X):
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
print("principal axis:", [round(v, 3) for v in pc1])`),e(`### 5. Project onto the principal axis

Projecting each point onto PC1 compresses 2D to 1D while keeping the most variance. Sorting by that coordinate lays the three clusters out in a line you could plot on a single number axis.`),t(`def project(x, mean, axis):
    return sum((xi - mi) * ai for xi, mi, ai in zip(x, mean, axis))

coords = [(project(X[i], mean, pc1), labels[i]) for i in range(len(X))]
for cl in range(3):
    vals = [c for c, l in coords if l == cl]
    print(f"cluster {cl}: {len(vals)} pts, "
          f"PC1 range [{min(vals):.2f}, {max(vals):.2f}]")`),e("**Takeaway.** Distance-based grouping (k-means) and variance-based projection (PCA) are the two workhorses of exploratory analysis. Together they turn an unlabeled cloud into clusters you can see on a plot.")],"tokenizer-ngram-language-model":[e(`## A language model you can trace to a count

Before neural nets, language models were **n-gram** counters: predict the next token from the ones just before it, using nothing but tallies. Every probability traces back to a count in the training data — fully interpretable, and surprisingly capable.`),e("### 1. Tokenize\n\nWe lowercase and split on whitespace, wrapping each sentence in start (`<s>`) and end (`</s>`) markers so the model can learn how text begins and ends."),t(`def tokenize(text):
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
print("first 8:", tokens[:8])`),e(`### 2. Count the n-grams

For a trigram model we slide a window of 3 and tally how often each two-word context is followed by each next word. These raw counts *are* the model.`),t(`from collections import defaultdict, Counter

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
print("after ('the','cat'):", dict(model.counts[('the', 'cat')]))`),e(`### 3. Counts → probabilities, with smoothing

We divide each context→token count by the context total. **Add-k smoothing** gives unseen continuations a small nonzero share, so the model never assigns probability zero:

\\[ P(w \\mid c) = \\frac{\\text{count}(c, w) + k}{\\text{count}(c) + k\\,|V|} \\]`),t(`def prob(self, ctx, token):
    c = self.counts[ctx]
    return (c[token] + self.k) / (sum(c.values()) + self.k * len(self.vocab))
NGram.prob = prob

ctx = ('the', 'cat')
print("P(sat | the cat) =", round(model.prob(ctx, 'sat'), 4))
print("P(ate | the cat) =", round(model.prob(ctx, 'ate'), 4))
print("P(dog | the cat) =", round(model.prob(ctx, 'dog'), 4), "(unseen, smoothed)")`),e(`### 4. Sample new text

Start from a context, draw the next token from its conditional distribution, slide the window, and repeat. The model speaks in the patterns it counted.`),t(`import random
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
    print("->", model.sample())`),e(`### 5. Perplexity: how surprised is the model?

On held-out text we average the negative log-probability and exponentiate. Lower perplexity = less surprised = better model. Higher-order n-grams usually drop perplexity until they start to overfit.`),t(`import math
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
print("bigram  perplexity:", round(bi.perplexity(tokens), 3))`),e("**Takeaway.** A complete language model with no neural net: tokenize, count, smooth, sample, score. Every number is a tally you can inspect — the interpretable baseline every fancier model is measured against.")],"char-rnn-text-generator":[e(`## A recurrent network, one character at a time

Before transformers, **recurrent networks** read sequences by carrying a hidden state — a compressed memory of everything seen so far. We build a minimal char-RNN in pure Python: it predicts the next character from the current one plus its hidden state, and we train it by hand.`),e(`### 1. Build the vocabulary

We collect the unique characters and map each to an index and back. The model works entirely in these integer ids.`),t(`import math, random
random.seed(0)

text = "hello world "
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
V = len(chars)
print("vocab:", chars)
print("size:", V)`),e(`### 2. The recurrent cell

The hidden state updates as \\(h_t = \\tanh(W_{xh} x_t + W_{hh} h_{t-1})\\), and the output logits are \\(W_{hy} h_t\\). \\(W_{hh}\\) is what lets information from earlier characters reach later ones.`),t(`H = 12  # hidden size

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
print("hidden after 'h' (first 3):", [round(v, 3) for v in h1[:3]])`),e(`### 3. Softmax and a forward sweep over the sequence

Cross-entropy compares predicted next-char probabilities to the true next char. We sweep the whole string, carrying the hidden state forward, and sum the loss.`),t(`def softmax(z):
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

print("initial avg loss:", round(sequence_loss(), 4))`),e(`### 4. Train with coordinate descent

Full backprop-through-time is a lot of bookkeeping; to keep this cell honest and runnable we train the output weights \\(W_{hy}\\) by **coordinate descent**: probe each weight up and down a notch and keep whichever direction lowers the loss. Slow, but it provably drives the next-char loss down.`),t(`def train_Why(steps=8, delta=0.2):
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
print("final loss:", round(final, 4))`),e(`### 5. Sample from the trained model

Feed a seed character, sample from the softmax with a **temperature** (lower = more confident), append it, and repeat. Even this tiny net learns to follow 'h' with 'e', 'l' with 'l' — the local structure of its training string.`),t(`def sample(seed='h', length=15, temp=0.5):
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

print("sampled:", repr(sample()))`),e("**Takeaway.** The hidden state is the whole idea: a vector that carries the past into the present. Swap finite differences for real backprop-through-time and scale the weights up and the same loop learns to babble in any text's style.")],"transformer-block-from-scratch":[e(`## The unit behind every LLM

A **transformer block**, stacked dozens of times, *is* a large language model. We build one from primitives in pure Python: scaled dot-product attention, multiple heads, residual connections, and a feed-forward network — small enough to run, faithful enough to read the paper from.`),e(`### 1. Scaled dot-product attention

Each position emits a **query**, **key**, and **value**. A query scores every key by dot product, scales by \\(1/\\sqrt{d}\\) to keep the softmax tame, then takes a weighted sum of values:

\\[ \\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d}}\\right)V \\]`),t(`import math

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
print("attention out:", [[round(v, 3) for v in row] for row in attention(Q, K, V)])`),e(`### 2. The causal mask in action

Filling future scores with \\(-\\infty\\) means position 0 attends only to itself, position 1 to {0,1}, and so on. That triangular masking is what makes the model predict left-to-right.`),t(`# row i should put zero weight on any column j > i
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
    print(f"pos {i} attends:", row)`),e(`### 3. Multiple heads

One attention is one relationship. **Multi-head** runs several in parallel on slices of the vector, each free to track a different pattern, then concatenates the results. Here two heads over a 4-dim input, each seeing 2 dims.`),t(`def split_heads(X, n_heads):
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
print("pos 0:", [round(v, 3) for v in mh[0]])`),e("### 4. Residuals, layer norm, and the feed-forward net\n\nThe full block wraps each sublayer in `x + sublayer(norm(x))`. The **residual** lets gradients skip; **layer norm** keeps activations centered; the **feed-forward** net (widen, nonlinearity, narrow) processes each position independently."),t(`def layer_norm(v, eps=1e-5):
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
print("block out:", len(out), "x", len(out[0]))`),e(`### 5. Verify shape in = shape out

A transformer block is shape-preserving — that's what lets you stack it. We assert the output has the same (positions × dim) shape as the input, the one invariant the whole architecture relies on.`),t(`assert len(out) == len(X), "position count changed!"
assert len(out[0]) == len(X[0]), "dim changed!"
print("ok — shape preserved:", len(out), "x", len(out[0]))
print("ready to stack this block N times into an LLM.")`),e("**Takeaway.** Attention scores tokens against tokens; heads track several relations at once; residuals and norm keep deep stacks trainable. Stack this block, add embeddings and a final projection, and you have read the Transformer paper as code you already wrote.")],"cnn-image-classifier":[e(`## How a network sees: convolution from scratch

Convolutional networks exploit one fact: a useful feature looks the same wherever it appears in an image. We implement the core operations — convolution, ReLU, and pooling — in pure Python on a tiny image, so the mechanics are fully visible.`),e(`### 1. A tiny image and an edge kernel

Our "image" is a 5×5 grid with a bright vertical bar. A **kernel** is a small weight grid we slide across it; a vertical-edge kernel responds strongly where brightness changes left-to-right.`),t(`image = [
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
    print(" ".join(f"{v:1d}" for v in row))`),e(`### 2. The convolution operation

Slide the kernel over every position, multiply overlapping cells, and sum. Each output value measures how strongly that patch matches the kernel's pattern — this is the single operation a conv layer repeats.`),t(`def convolve(img, kernel):
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
    print(" ".join(f"{v:4d}" for v in row))`),e(`### 3. ReLU: keep what fired

A conv layer is followed by a nonlinearity. **ReLU** zeroes negative responses, keeping only the places the feature was actually present — here, the two edges of the bar.`),t(`def relu2d(grid):
    return [[max(0, v) for v in row] for row in grid]

activated = relu2d(feat)
print("after ReLU:")
for row in activated:
    print(" ".join(f"{v:3d}" for v in row))`),e(`### 4. Max pooling: shrink and stay robust

**Pooling** takes the max over each 2×2 block. It halves the spatial size (cheaper deeper layers) and makes the response tolerant to small shifts of the feature.`),t(`def max_pool(grid, size=2):
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
    print(" ".join(f"{v:3d}" for v in row))`),e(`### 5. Stack into a classifier head

Real CNNs stack conv→ReLU→pool blocks, doubling channels as the image shrinks, then flatten and feed a small linear classifier. We flatten our feature map and run a one-line linear score to mimic that final head.`),t(`def flatten(grid):
    return [v for row in grid for v in row]

import random
random.seed(0)
flat = flatten(pooled)
weights = [random.gauss(0, 0.5) for _ in flat]
score = sum(w * x for w, x in zip(weights, flat))
print("flattened features:", flat)
print("class score (logit):", round(score, 3))
print("-> a softmax over several such scores gives class probabilities")`),e("**Takeaway.** Convolution detects a pattern everywhere at once; ReLU keeps the hits; pooling shrinks and stabilizes. Stack those blocks, add a linear head, train with the optimizer zoo, and you have a real image classifier — the framework version just does this fast on a GPU.")],"tiny-vae-demo":[e(`## A generative model: compress, then dream

A **variational autoencoder** learns a smooth latent space organized well enough that decoding a *random* point produces a plausible new sample. We build the core ideas — encoder, the reparameterization trick, decoder, and the ELBO loss — in pure Python on 1-D data so every step runs.`),e(`### 1. Data with hidden structure

Our data is drawn from two clusters on a line. A good latent variable should learn to encode "which cluster, and where within it" — then sampling the latent generates new in-distribution points.`),t(`import math, random
random.seed(0)

def make_data(n=40):
    pts = []
    for _ in range(n):
        center = random.choice([-2.0, 3.0])
        pts.append(center + random.gauss(0, 0.4))
    return pts

data = make_data()
print("samples:", len(data))
print("range:", round(min(data), 2), "to", round(max(data), 2))`),e(`### 2. The encoder: data → distribution

Instead of a single code, the encoder outputs a **mean** and **log-variance** describing a Gaussian over the latent \\(z\\). Encoding a distribution (not a point) is what makes the latent space continuous.`),t(`# tiny linear encoder: x -> (mu, logvar)
enc_w_mu,  enc_b_mu  = 0.4, 0.0
enc_w_lv,  enc_b_lv  = 0.0, -0.7

def encode(x):
    mu = enc_w_mu * x + enc_b_mu
    logvar = enc_w_lv * x + enc_b_lv
    return mu, logvar

mu, logvar = encode(data[0])
print("x =", round(data[0], 3))
print("encoded mu =", round(mu, 3), " logvar =", round(logvar, 3))`),e(`### 3. The reparameterization trick

We need to sample \\(z\\) but still backprop through it. The trick: \\(z = \\mu + \\sigma \\cdot \\epsilon\\) with \\(\\epsilon\\sim\\mathcal{N}(0,1)\\). The randomness sits in \\(\\epsilon\\), *outside* the gradient path, so the network stays differentiable.`),t(`def reparam(mu, logvar):
    std = math.exp(0.5 * logvar)
    eps = random.gauss(0, 1)
    return mu + std * eps

zs = [reparam(*encode(x)) for x in data]
print("sampled latents (first 5):", [round(z, 3) for z in zs[:5]])`),e(`### 4. Decoder and the ELBO loss

The **decoder** maps \\(z\\) back to data space. The loss balances two terms: **reconstruction** (decoded output should match the input) and the **KL divergence** pulling the latent toward a unit Gaussian so the space stays sampleable:

\\[ \\mathcal{L} = \\underbrace{(x-\\hat{x})^2}_{\\text{reconstruct}} + \\underbrace{-\\tfrac{1}{2}\\sum(1+\\log\\sigma^2-\\mu^2-\\sigma^2)}_{\\text{KL}} \\]`),t(`dec_w, dec_b = 1.5, 0.5
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
print("average ELBO over dataset:", round(avg, 3))`),e(`### 5. Generate brand-new samples

The whole point: once trained, *ignore the encoder*. Draw \\(z\\) straight from the standard-normal **prior**, decode it, and you get fresh samples the model never saw. That is generation.`),t(`def generate(n=6):
    out = []
    for _ in range(n):
        z = random.gauss(0, 1)   # sample the prior directly
        out.append(decode(z))
    return out

new = generate()
print("generated samples:", [round(v, 3) for v in new])
print("(decoded from random latent points — never in the data)")`),e("**Takeaway.** Encode to a distribution, sample with the reparameterization trick, decode, and regularize the latent toward a normal with KL. Swap the linear maps for neural nets and the data for MNIST pixels and the same recipe dreams up handwritten digits.")]};function o(a){return i[a]||null}const s=[{slug:"linear-regression-from-scratch",title:"Linear regression from scratch",tagline:"Fit a line two ways — the closed-form normal equation and gradient descent — and prove they agree.",difficulty:"easy",tags:["numpy","regression","gradients"],overview:"Linear regression is the smallest complete machine-learning system: a model, a loss, and an optimizer. In this build you implement ordinary least squares twice. First you solve it analytically with the normal equation, which hands you the exact best weights in one matrix expression. Then you reach the same weights iteratively with gradient descent, watching the mean squared error fall step by step. Comparing the two answers teaches you what gradient descent is actually converging toward and why the loss surface of a linear model is a simple bowl with one minimum.",whatYouBuild:"A small library with fit_closed_form(X, y) and fit_gradient_descent(X, y) plus a plot of the loss curve and the fitted line over a synthetic dataset.",skills:["Mean squared error","The normal equation","Batch gradient descent","Feature matrices and bias terms","Convergence diagnostics"],buildSteps:[{title:"Generate synthetic data",detail:"Sample x uniformly, pick a true slope and intercept, then add Gaussian noise. Keeping the ground truth lets you check your fit."},{title:"Add a bias column",detail:"Prepend a column of ones to X so the intercept becomes just another weight and every formula stays a clean matrix multiply."},{title:"Solve the normal equation",detail:"Compute w = (XᵀX)⁻¹Xᵀy. Use np.linalg.solve rather than an explicit inverse for numerical stability."},{title:"Write the loss function",detail:"Implement mean squared error as a single vectorized expression. This is the quantity gradient descent will minimize."},{title:"Derive and code the gradient",detail:"The gradient of MSE is (2/n)Xᵀ(Xw − y). Implement it and verify it against a numeric finite-difference estimate."},{title:"Run the gradient-descent loop",detail:"Initialize weights at zero, step against the gradient with a fixed learning rate, and record the loss each iteration."},{title:"Compare and visualize",detail:"Confirm the gradient-descent weights converge to the closed-form weights, then plot the loss curve and the fitted line."}],starterSnippet:`import numpy as np

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
`,estTime:"2-3 hours"},{slug:"micrograd-autograd-engine",title:"A micrograd-style autograd engine",tagline:"Build a Value class that records the computation graph and computes every gradient on .backward().",difficulty:"hard",tags:["autograd","calculus","graphs"],overview:'Every deep-learning framework is, at its core, an automatic differentiation engine wrapped in convenience. In this build you write that core yourself. A scalar Value object remembers the operation that produced it and the inputs that fed it, so the whole forward computation forms a directed graph. Calling backward() walks that graph in reverse topological order and applies the chain rule at each node, depositing a gradient into every leaf. Once it works you train a tiny neural network with it, and the magic word "backprop" stops being magic.',whatYouBuild:"A Value class supporting +, *, and tanh with a working backward(), plus a tiny multi-layer perceptron trained on a toy classification problem using only your engine.",skills:["The chain rule on a graph","Topological sort","Operator overloading in Python","Reverse-mode differentiation","Building a neuron from primitives"],buildSteps:[{title:"Define the Value node",detail:"Store data, a grad initialized to zero, the set of child nodes, and a _backward closure that is empty by default."},{title:"Overload addition",detail:"Return a new Value whose _backward adds the incoming gradient to both operands. Addition just routes the gradient through unchanged."},{title:"Overload multiplication",detail:"For c = a * b, the local gradients are b and a. Each operand accumulates the upstream gradient times the other operand."},{title:"Add a nonlinearity",detail:"Implement tanh. Its derivative is 1 − tanh², which the _backward closure multiplies into the upstream gradient."},{title:"Topologically sort the graph",detail:"Depth-first from the output node to order every node so each is processed only after its consumers."},{title:"Implement backward()",detail:"Seed the output gradient at 1.0, then call each node's _backward in reverse topological order."},{title:"Build a neuron and layer",detail:"Wrap Values into a Neuron (weights, bias, tanh) and stack neurons into layers and an MLP."},{title:"Train on toy data",detail:"Run a manual loop: forward pass, compute loss, zero the grads, backward, and nudge every parameter against its gradient."}],starterSnippet:`import math

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
`,estTime:"4-6 hours"},{slug:"mnist-mlp-numpy",title:"MNIST digit classifier in pure numpy",tagline:"Train a two-layer MLP to read handwritten digits at 97%+ accuracy with no deep-learning framework.",difficulty:"medium",tags:["numpy","mlp","classification"],overview:"This is the rite of passage of practical deep learning, done without a framework to hide the mechanics. You load the MNIST digits, build a network with one hidden layer, and implement the forward pass, the softmax cross-entropy loss, and the full backward pass by hand. Every matrix shape has to line up, every gradient has to be derived, and the mini-batch loop has to actually drive the loss down. When the test accuracy crosses 97% you will understand exactly which line of code earned each percent.",whatYouBuild:"A trainable MLP class with forward, backward, and a mini-batch SGD loop that reaches 97%+ test accuracy on MNIST, plus a confusion matrix of its mistakes.",skills:["Softmax cross-entropy","Manual backpropagation","Mini-batch SGD","He initialization","ReLU activations"],buildSteps:[{title:"Load and normalize MNIST",detail:"Flatten each 28×28 image to a 784-vector, scale pixels to [0, 1], and one-hot encode the labels."},{title:"Initialize the parameters",detail:"Two weight matrices and two bias vectors. Use He initialization so signals neither vanish nor explode through ReLU."},{title:"Write the forward pass",detail:"Hidden = ReLU(X·W1 + b1); logits = Hidden·W2 + b2. Apply a numerically stable softmax to get class probabilities."},{title:"Compute the loss",detail:"Average cross-entropy over the batch. Subtract the row max before exponentiating to avoid overflow."},{title:"Derive the backward pass",detail:"The softmax cross-entropy gradient is simply probs − onehot. Backprop it through W2, the ReLU, and W1."},{title:"Run mini-batch SGD",detail:"Shuffle each epoch, slice batches, take a gradient step per batch, and track train and test accuracy."},{title:"Tune to 97%+",detail:"Adjust the hidden width, learning rate, and epoch count until test accuracy clears 97%."},{title:"Inspect the errors",detail:"Build a confusion matrix and eyeball the misclassified digits — most are genuinely ambiguous."}],starterSnippet:`import numpy as np

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
`,estTime:"4-5 hours"},{slug:"char-rnn-text-generator",title:"A tiny char-RNN text generator",tagline:"Train a recurrent network one character at a time and watch it learn to babble in your training style.",difficulty:"hard",tags:["rnn","sequence","nlp"],overview:"Before transformers, recurrent networks were how machines read sequences, and writing one teaches you what a hidden state really is: a compressed memory of everything seen so far. In this build you train a character-level RNN on a text file. The model predicts the next character from the current one and its hidden state, and backpropagation through time threads gradients across the whole sequence. Sampling from the trained model produces text that drifts from noise toward something that imitates your source — a small, satisfying demonstration of sequence learning.",whatYouBuild:"A character-level RNN in PyTorch that trains on any text file and a sampling function that generates fresh text in the learned style.",skills:["Recurrent hidden state","Backpropagation through time","Character-level tokenization","Temperature sampling","Cross-entropy over sequences"],buildSteps:[{title:"Build the vocabulary",detail:"Read the text, collect the unique characters, and map each to an integer index and back."},{title:"Cut training sequences",detail:"Slide a fixed-length window over the text to form (input, next-char-target) pairs for batching."},{title:"Define the RNN cell",detail:"An embedding, a single recurrent layer, and a linear head projecting the hidden state to vocabulary logits."},{title:"Set up the loss",detail:"Cross-entropy between the predicted logits and the shifted targets, averaged over every position in the sequence."},{title:"Train with truncated BPTT",detail:"Detach the hidden state between chunks so gradients stay bounded, and step the optimizer per batch."},{title:"Write the sampler",detail:"Feed a seed character, sample from the softmax with a temperature, append it, and repeat to grow text."},{title:"Watch it improve",detail:"Sample every few hundred steps. The output should march from random characters to word-like fragments."}],starterSnippet:`import torch
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
`,estTime:"4-6 hours"},{slug:"transformer-block-from-scratch",title:"A transformer block from scratch",tagline:"Assemble multi-head self-attention, residuals, and a feed-forward network into the block behind modern LLMs.",difficulty:"hard",tags:["transformers","attention","pytorch"],overview:"The transformer block is the unit that, stacked dozens of times, becomes a large language model. In this build you implement one from its primitives. You compute scaled dot-product attention, split it into multiple heads so the model can attend to several relationships at once, and wrap it with residual connections and layer normalization. A position-wise feed-forward network finishes the block. Working through the tensor reshapes and the attention mask by hand demystifies the architecture and leaves you able to read the original paper as a description of code you have already written.",whatYouBuild:"A self-contained TransformerBlock module with multi-head attention, residual connections, layer norm, and an MLP, verified on a random input tensor with shape assertions.",skills:["Scaled dot-product attention","Multi-head reshaping","Residual connections","Layer normalization","Causal masking"],buildSteps:[{title:"Project to Q, K, V",detail:"A single linear layer produces queries, keys, and values, then you reshape them into separate heads."},{title:"Score and scale",detail:"Compute QKᵀ and divide by the square root of the head dimension to keep the softmax in a stable range."},{title:"Apply the causal mask",detail:"Fill the upper triangle with −infinity so each position can only attend to itself and earlier tokens."},{title:"Weight the values",detail:"Softmax the scores along the key axis and use them to take a weighted sum of the value vectors."},{title:"Merge the heads",detail:"Concatenate the per-head outputs and pass them through an output projection back to the model dimension."},{title:"Add residuals and norm",detail:"Wrap attention and the feed-forward sublayer each in a residual connection followed by layer normalization."},{title:"Add the feed-forward network",detail:"A two-layer MLP with a GELU in between, widening to 4× the model dimension and back."},{title:"Verify the shapes",detail:"Run a random (batch, seq, dim) tensor through the block and assert the output shape matches the input."}],starterSnippet:`import torch
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
`,estTime:"5-7 hours"},{slug:"kmeans-pca-on-real-data",title:"k-means + PCA on real data",tagline:"Cluster a real dataset with k-means, then use PCA to project the clusters down to a plot you can actually see.",difficulty:"medium",tags:["clustering","pca","unsupervised"],overview:"Unsupervised learning finds structure with no labels, and these two algorithms are its workhorses. In this build you implement k-means clustering — alternating between assigning points to their nearest centroid and recomputing centroids — and watch it converge on a real dataset. Then you implement PCA from the covariance matrix to compress the high-dimensional points to two dimensions so you can plot the clusters and judge them by eye. Together they show how distance-based grouping and variance-based projection complement each other in any exploratory analysis.",whatYouBuild:"A kmeans(X, k) function with k-means++ initialization and a pca(X, n) function built from eigenvectors, used to cluster and visualize a real dataset in 2D.",skills:["Lloyd's algorithm","k-means++ seeding","Covariance matrices","Eigendecomposition","Dimensionality reduction"],buildSteps:[{title:"Load and standardize the data",detail:"Pick a dataset such as the digits or iris set and z-score each feature so distances are not dominated by scale."},{title:"Seed with k-means++",detail:"Choose initial centroids spread apart by sampling proportional to squared distance from the nearest chosen center."},{title:"Assign points to centroids",detail:"Compute the distance from every point to every centroid and label each point with its closest one."},{title:"Update the centroids",detail:"Move each centroid to the mean of the points assigned to it, then repeat until assignments stop changing."},{title:"Measure cluster quality",detail:"Track inertia (the within-cluster sum of squares) and confirm it decreases monotonically across iterations."},{title:"Build PCA from covariance",detail:"Center the data, form the covariance matrix, take its eigenvectors, and keep the two with the largest eigenvalues."},{title:"Project and plot",detail:"Map the points onto the top two components and scatter them colored by cluster to see the structure."}],starterSnippet:`import numpy as np

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
`,estTime:"3-4 hours"},{slug:"cnn-image-classifier",title:"A CNN image classifier",tagline:"Build a convolutional network in PyTorch and train it to classify CIFAR-10 images with data augmentation.",difficulty:"medium",tags:["cnn","pytorch","vision"],overview:"Convolutional networks are how machines see, exploiting the fact that a useful feature looks the same wherever it appears in an image. In this build you assemble a CNN from convolution, batch-norm, ReLU, and pooling blocks, then train it on CIFAR-10. Along the way you add data augmentation so the model generalizes rather than memorizes, and you learn to read the training and validation curves to spot overfitting early. By the end you have a real image classifier and an intuition for why depth, normalization, and augmentation each matter.",whatYouBuild:"A compact CNN trained on CIFAR-10 with augmentation, a training loop reporting train/val accuracy per epoch, and a few-sample prediction visualization.",skills:["Convolution and pooling","Batch normalization","Data augmentation","Train/validation monitoring","The Adam optimizer"],buildSteps:[{title:"Load CIFAR-10 with transforms",detail:"Use torchvision datasets and add random crops and horizontal flips to the training transform for augmentation."},{title:"Design the conv blocks",detail:"Stack conv → batch-norm → ReLU → pool blocks, doubling the channel count as the spatial size halves."},{title:"Add the classifier head",detail:"Flatten the final feature map and attach a couple of linear layers ending in ten class logits."},{title:"Pick loss and optimizer",detail:"Cross-entropy loss with the Adam optimizer and a modest learning rate is a solid default."},{title:"Write the training loop",detail:"Iterate epochs and batches; each step does forward, loss, backward, and optimizer.step, then logs accuracy."},{title:"Add a validation pass",detail:"After each epoch run the held-out set with no gradients to track generalization and catch overfitting."},{title:"Visualize predictions",detail:"Show a grid of test images with predicted and true labels to see where the model succeeds and fails."}],starterSnippet:`import torch
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
`,estTime:"4-5 hours"},{slug:"tokenizer-ngram-language-model",title:"A tokenizer + n-gram language model",tagline:"Train a count-based language model that predicts the next token from the ones before it — no neural net required.",difficulty:"easy",tags:["nlp","tokenization","probability"],overview:"Before you can model language you have to turn it into tokens, and before transformers there were n-gram models that predict the next token purely from counts. In this build you write a simple word tokenizer, count how often each n-gram appears, and turn those counts into conditional probabilities with smoothing so unseen contexts do not collapse to zero. Then you sample from the model to generate text and measure its perplexity. It is a complete, interpretable language model whose every probability you can trace back to a count in your training data.",whatYouBuild:"A tokenizer, an n-gram counter with add-k smoothing, a text sampler, and a perplexity evaluator, all driven from a plain text corpus.",skills:["Tokenization","Conditional probability","Add-k smoothing","Sampling from a distribution","Perplexity"],buildSteps:[{title:"Write a tokenizer",detail:"Lowercase the text and split on word boundaries, optionally adding sentence-start and sentence-end markers."},{title:"Count the n-grams",detail:"Slide a window of size n over the tokens and tally how often each context is followed by each next token."},{title:"Build conditional probabilities",detail:"Divide each context-to-token count by the total count for that context to get P(next | context)."},{title:"Add smoothing",detail:"Apply add-k smoothing so contexts and tokens never seen in training still receive a small nonzero probability."},{title:"Sample text",detail:"Start from a context, draw the next token from its conditional distribution, slide the window, and repeat."},{title:"Evaluate perplexity",detail:"On held-out text, compute the average negative log-probability and exponentiate it to report perplexity."},{title:"Compare orders",detail:"Train bigram, trigram, and 4-gram models and watch perplexity fall — and the samples grow more coherent then overfit."}],starterSnippet:`import random
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
`,estTime:"2-3 hours"},{slug:"gradient-descent-optimizer-zoo",title:"A gradient-descent optimizer zoo",tagline:"Implement SGD, momentum, RMSProp, and Adam side by side and race them down the same loss surface.",difficulty:"medium",tags:["optimization","numpy","gradients"],overview:"Every optimizer is a different rule for turning a gradient into a step, and the differences decide whether a model trains in minutes or stalls forever. In this build you implement four of them — plain SGD, SGD with momentum, RMSProp, and Adam — behind a common interface. Then you turn them loose on the same 2D test functions and plot the paths they trace toward the minimum. Watching momentum coast through a ravine that vanilla SGD zig-zags across, and seeing Adam combine both tricks, turns optimizer choice from a mystery into an intuition you can reason about.",whatYouBuild:"Four optimizer classes sharing a step(params, grads) interface, plus a visualization that overlays each optimizer's trajectory on a 2D loss surface.",skills:["Momentum","Adaptive learning rates","Bias correction","The Rosenbrock function","Optimizer interfaces"],buildSteps:[{title:"Define a common interface",detail:"Each optimizer is a class with a step(params, grads) method, so they are interchangeable in the training loop."},{title:"Implement plain SGD",detail:"The baseline: subtract the learning rate times the gradient. Everything else is a refinement of this."},{title:"Add momentum",detail:"Maintain a velocity that accumulates past gradients, letting the optimizer build speed in consistent directions."},{title:"Implement RMSProp",detail:"Keep a running average of squared gradients and divide the step by its root to adapt the rate per parameter."},{title:"Implement Adam",detail:"Combine momentum and RMSProp, then apply bias correction so the early steps are not artificially tiny."},{title:"Pick test functions",detail:"Use a simple bowl and the curved Rosenbrock valley to expose how each method handles easy and hard geometry."},{title:"Race and plot",detail:"Run every optimizer from the same start and overlay their paths and loss curves on the contour plot."}],starterSnippet:`import numpy as np

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
`,estTime:"3-4 hours"},{slug:"tiny-vae-demo",title:"A tiny variational autoencoder",tagline:"Compress digits into a smooth latent space, then sample brand-new digits by decoding random points.",difficulty:"hard",tags:["vae","generative","pytorch"],overview:"A variational autoencoder is the gateway to generative modeling: it learns to compress data into a continuous latent space organized smoothly enough that decoding a random point produces a plausible new sample. In this build you implement an encoder that outputs a mean and variance, the reparameterization trick that lets gradients flow through the sampling step, and a decoder that reconstructs the input. The loss balances reconstruction against a KL term that pulls the latent space toward a standard normal. Once trained on MNIST, sampling from that prior generates digits the model has never seen.",whatYouBuild:"A VAE in PyTorch trained on MNIST, with reconstruction examples and a grid of brand-new digits generated by decoding samples from the latent prior.",skills:["Encoder/decoder networks","The reparameterization trick","KL divergence","The ELBO objective","Latent-space sampling"],buildSteps:[{title:"Build the encoder",detail:"Map each image to two vectors: the mean and the log-variance of its latent distribution."},{title:"Reparameterize",detail:"Sample z = mean + std · epsilon with epsilon from a standard normal, so the randomness sits outside the gradient path."},{title:"Build the decoder",detail:"Map a latent vector back to image pixels with a sigmoid output to keep values in [0, 1]."},{title:"Write the ELBO loss",detail:"Sum a reconstruction term (binary cross-entropy) and the KL divergence between the latent and a unit Gaussian."},{title:"Train the model",detail:"Run the encode-sample-decode loop, minimizing the loss with Adam over several epochs."},{title:"Reconstruct test images",detail:"Pass held-out digits through the full model and compare inputs to reconstructions side by side."},{title:"Generate new digits",detail:"Sample z from the standard normal prior, decode each, and arrange the results in a grid."}],starterSnippet:`import torch
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
`,estTime:"5-7 hours"}];function l(a){const n=s.find(r=>r.slug===a)||null;return n?{...n,cells:o(a)}:null}export{s as P,l as g};
