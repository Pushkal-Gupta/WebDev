// Guided, ordered study plans for the PGForge ML area. Original copy.
// Each step's `to` points at a real existing route; steps without an exact
// target render as plain checklist items (no link).
//
// Valid targets used here:
//   ML lessons   -> /ml/<pillar>/<lesson>   (see mlContent.js PILLARS)
//   Problems     -> /ml/problems/<slug>      (see pgForgeProblemsData.js)
//   Papers/Math/Projects -> /ml/papers, /ml/math, /ml/projects

export const PG_FORGE_STUDY_PLANS = [
  {
    slug: 'neural-nets-from-scratch',
    title: 'Neural networks from scratch',
    blurb: 'Build a working network with no autograd: forward pass, loss, backprop, and a training loop you wrote by hand. By the end the chain rule is muscle memory, not magic.',
    level: 'intermediate',
    estimatedHours: 14,
    steps: [
      { title: 'Refresh the linear-algebra primitives', kind: 'lesson', detail: 'Vectors and matrices are the data type a layer eats. Get fluent before stacking them.', to: '/ml/foundations/vectors' },
      { title: 'The dot product is one neuron', kind: 'lesson', detail: 'A weighted sum is a dot product. See why every unit is just a projection plus a bias.', to: '/ml/foundations/dot-product' },
      { title: 'Matrices move a whole layer at once', kind: 'lesson', detail: 'Batch the neurons: one matrix multiply is the entire forward pass of a dense layer.', to: '/ml/foundations/matrices' },
      { title: 'Cross-entropy: the loss that classifies', kind: 'lesson', detail: 'Understand the signal the network is actually chasing before you differentiate it.', to: '/ml/foundations/cross-entropy' },
      { title: 'Derive backpropagation', kind: 'lesson', detail: 'The chain rule, drawn as a graph. Trace gradients backward through every node.', to: '/ml/foundations/backprop' },
      { title: 'Wire backprop by hand', kind: 'problem', detail: 'No framework. Compute every gradient yourself and check it against a numeric estimate.', to: '/ml/problems/backprop-from-scratch' },
      { title: 'Solve XOR with a two-layer MLP', kind: 'problem', detail: 'The smallest network that needs a hidden layer. Train it until the decision boundary bends.', to: '/ml/problems/two-layer-mlp-xor' },
      { title: 'Build the softmax classifier', kind: 'problem', detail: 'Stack a linear layer, softmax, and cross-entropy into one trainable unit.', to: '/ml/problems/softmax-classifier' },
      { title: 'Initialize weights so signals survive', kind: 'lesson', detail: 'Bad init kills the gradient. Learn the variance argument behind Xavier and He.', to: '/ml/optimization/weight-initialization' },
      { title: 'Ship a tiny trained model', kind: 'project', detail: 'Put it together end to end: a network you can point at real data and watch it learn.', to: '/ml/projects' },
    ],
  },
  {
    slug: 'transformers-and-attention',
    title: 'Transformers & attention',
    blurb: 'Trace the path from a single attention score to a full multi-head transformer block. Each step adds one piece until the architecture that runs modern language models is fully assembled.',
    level: 'advanced',
    estimatedHours: 16,
    steps: [
      { title: 'Why attention beats recurrence', kind: 'lesson', detail: 'Start with the bottleneck attention was invented to remove: fixed-width memory.', to: '/ml/transformers/attention' },
      { title: 'See where RNNs and LSTMs fall short', kind: 'lesson', detail: 'Sequential memory and the gradient problems that pushed the field toward parallel attention.', to: '/ml/transformers/rnn-lstm' },
      { title: 'Scaled dot-product attention', kind: 'problem', detail: 'Queries, keys, values, the softmax, and the divide-by-root-d that keeps scores stable.', to: '/ml/problems/scaled-dot-product-attention' },
      { title: 'Split it into multiple heads', kind: 'problem', detail: 'Run several attention maps in parallel and concatenate. Implement the reshape carefully.', to: '/ml/problems/multi-head-attention' },
      { title: 'Inject order with positional encoding', kind: 'lesson', detail: 'Attention is set-invariant on its own. Learn how position gets folded back in.', to: '/ml/transformers/positional-encoding' },
      { title: 'Implement positional encodings', kind: 'problem', detail: 'Build the sinusoidal table and confirm nearby positions stay close in the embedding.', to: '/ml/problems/positional-encoding' },
      { title: 'Layer norm keeps the block trainable', kind: 'lesson', detail: 'Normalization per token is what lets you stack dozens of attention layers.', to: '/ml/regularization/batch-norm' },
      { title: 'Code layer normalization', kind: 'problem', detail: 'Normalize across features, then scale and shift with learned parameters.', to: '/ml/problems/layer-norm' },
      { title: 'Read "Attention Is All You Need"', kind: 'paper', detail: 'Map every term in the paper onto the components you just built from scratch.', to: '/ml/papers' },
      { title: 'Adapt a model cheaply with LoRA', kind: 'lesson', detail: 'Fine-tune giant transformers by training low-rank deltas instead of every weight.', to: '/ml/transformers/lora' },
    ],
  },
  {
    slug: 'ml-math-foundations',
    title: 'ML math foundations',
    blurb: 'The math under every formula, in the order it actually builds: vectors and dot products, matrices as transforms, gradients, probability, and the numerical care that keeps it all from overflowing.',
    level: 'beginner',
    estimatedHours: 12,
    steps: [
      { title: 'Vectors as points and arrows', kind: 'lesson', detail: 'A list of numbers with a length and a direction. The object everything else is built from.', to: '/ml/foundations/vectors' },
      { title: 'The dot product and what it measures', kind: 'lesson', detail: 'Alignment, projection, and similarity all fall out of one sum of products.', to: '/ml/foundations/dot-product' },
      { title: 'Matrices as transformations', kind: 'lesson', detail: 'Stop seeing a grid of numbers; see a function that bends, rotates, and scales space.', to: '/ml/foundations/matrices' },
      { title: 'Work the math reference', kind: 'math', detail: 'Norms, gradients, and the identities you will reach for constantly, in one place.', to: '/ml/math' },
      { title: 'Eigenvectors via PCA', kind: 'lesson', detail: 'The directions a matrix only stretches. PCA makes them concrete on real data.', to: '/ml/foundations/pca' },
      { title: 'Compute PCA from the covariance matrix', kind: 'problem', detail: 'Center the data, find eigenvectors, and project onto the top components.', to: '/ml/problems/pca-eigen' },
      { title: 'The Gaussian distribution', kind: 'lesson', detail: 'The bell curve that shows up in noise, priors, initialization, and the central limit theorem.', to: '/ml/foundations/gaussian' },
      { title: 'Floating point has sharp edges', kind: 'lesson', detail: 'Why 0.1 + 0.2 is not 0.3, and why that bites gradient computations.', to: '/ml/numerical/floating-point' },
      { title: 'Keep computations numerically stable', kind: 'lesson', detail: 'The log-sum-exp trick and friends that stop softmax and loss from overflowing.', to: '/ml/numerical/numerical-stability' },
    ],
  },
  {
    slug: 'classical-ml-toolkit',
    title: 'Classical ML toolkit',
    blurb: 'The models that win before deep learning is worth the cost: linear and logistic regression, k-means, k-NN, naive Bayes, and trees — each implemented and understood from the ground up.',
    level: 'beginner',
    estimatedHours: 13,
    steps: [
      { title: 'Split data before you touch a model', kind: 'problem', detail: 'A clean train/test split is the difference between a real score and a fooled one.', to: '/ml/problems/train-test-split' },
      { title: 'Scale features to a common range', kind: 'problem', detail: 'Min-max scaling so no single feature dominates by magnitude alone.', to: '/ml/problems/min-max-scaling' },
      { title: 'Encode categories as one-hot vectors', kind: 'problem', detail: 'Turn labels into numbers a model can use without inventing a fake ordering.', to: '/ml/problems/one-hot-encode' },
      { title: 'Linear regression by gradient descent', kind: 'problem', detail: 'Fit a line by minimizing squared error one gradient step at a time.', to: '/ml/problems/linear-regression-gd' },
      { title: 'Logistic regression for classification', kind: 'problem', detail: 'Bend the line through a sigmoid and read the output as a probability.', to: '/ml/problems/logistic-regression' },
      { title: 'k-nearest neighbours', kind: 'problem', detail: 'The model with no training step: classify by who you sit next to.', to: '/ml/problems/knn' },
      { title: 'k-means clustering', kind: 'problem', detail: 'Find structure with no labels by alternating assignment and centroid updates.', to: '/ml/problems/k-means' },
      { title: 'Naive Bayes', kind: 'problem', detail: 'A fast, surprisingly strong baseline built on one bold independence assumption.', to: '/ml/problems/naive-bayes' },
      { title: 'Decision tree with the Gini split', kind: 'problem', detail: 'Greedily pick the split that purifies the most, and watch the tree grow.', to: '/ml/problems/decision-tree-gini' },
    ],
  },
  {
    slug: 'optimization-and-training-dynamics',
    title: 'Optimization & training dynamics',
    blurb: 'What actually happens during training: the loss surface, the gradient step, momentum and adaptive methods, normalization, and the schedules that decide whether a run converges or stalls.',
    level: 'intermediate',
    estimatedHours: 13,
    steps: [
      { title: 'Gradient descent, geometrically', kind: 'lesson', detail: 'Walk downhill on the loss surface. See why the step size is everything.', to: '/ml/optimization/gradient-descent' },
      { title: 'Add momentum to escape ravines', kind: 'problem', detail: 'Carry a running velocity so the optimizer rolls through noisy, narrow valleys.', to: '/ml/problems/sgd-momentum' },
      { title: 'RMSProp adapts the step per parameter', kind: 'problem', detail: 'Divide by a running average of squared gradients to tame uneven curvature.', to: '/ml/problems/rmsprop' },
      { title: 'Tour the optimizer zoo', kind: 'lesson', detail: 'How SGD, momentum, RMSProp, and Adam relate — and when to pick each.', to: '/ml/optimization/optimizer-zoo' },
      { title: 'Implement the Adam optimizer', kind: 'problem', detail: 'Combine momentum and adaptive scaling, then add the bias correction that makes it work early.', to: '/ml/problems/adam-optimizer' },
      { title: 'Warm up, then cosine-decay the rate', kind: 'problem', detail: 'A schedule that ramps in and eases out — standard for stable large-model training.', to: '/ml/problems/lr-warmup-cosine' },
      { title: 'Initialize so training can even start', kind: 'lesson', detail: 'Variance-preserving init keeps the first gradients from vanishing or exploding.', to: '/ml/optimization/weight-initialization' },
      { title: 'Batch normalization', kind: 'problem', detail: 'Normalize activations mid-network to smooth the loss surface and speed convergence.', to: '/ml/problems/batch-norm' },
      { title: 'Residual connections keep gradients alive', kind: 'lesson', detail: 'The skip connection that made very deep networks trainable in the first place.', to: '/ml/regularization/residual-connections' },
    ],
  },
  {
    slug: 'ml-interview-prep',
    title: 'ML interview prep',
    blurb: 'A focused loop for ML coding and concept rounds: implement the models interviewers actually ask for, explain the math behind them out loud, and rehearse the dynamics questions that separate a hire from a maybe.',
    level: 'intermediate',
    estimatedHours: 15,
    steps: [
      { title: 'Lock down the linear-algebra basics', kind: 'lesson', detail: 'Vectors, dot products, and matrix multiply — the whiteboard table stakes.', to: '/ml/foundations/vectors' },
      { title: 'Explain cross-entropy and softmax', kind: 'lesson', detail: 'A favorite "why this loss" question. Be ready to derive the gradient too.', to: '/ml/foundations/cross-entropy' },
      { title: 'Implement logistic regression live', kind: 'problem', detail: 'A classic from-scratch ask. Narrate the sigmoid, the loss, and the update as you type.', to: '/ml/problems/logistic-regression' },
      { title: 'Code k-means under time pressure', kind: 'problem', detail: 'Assignment and update steps, plus the failure modes to mention unprompted.', to: '/ml/problems/k-means' },
      { title: 'Walk through backpropagation', kind: 'problem', detail: 'The deep-learning round centerpiece. Build it by hand and explain every gradient.', to: '/ml/problems/backprop-from-scratch' },
      { title: 'Talk gradient descent and learning rates', kind: 'lesson', detail: 'Convergence, divergence, and the schedule trade-offs interviewers probe.', to: '/ml/optimization/gradient-descent' },
      { title: 'Reason about overfitting and dropout', kind: 'lesson', detail: 'Bias-variance in plain words, plus what dropout actually does at train and test time.', to: '/ml/regularization/dropout' },
      { title: 'Implement inverted dropout', kind: 'problem', detail: 'The scaling detail that lets test time stay a plain forward pass.', to: '/ml/problems/dropout-inverted' },
      { title: 'Be ready to sketch attention', kind: 'lesson', detail: 'Increasingly common at the senior bar. Explain queries, keys, values, and the scaling.', to: '/ml/transformers/attention' },
      { title: 'Rehearse the math reference', kind: 'math', detail: 'A final pass over norms, gradients, and probability so nothing surprises you on the day.', to: '/ml/math' },
    ],
  },
];

export function getStudyPlan(slug) {
  return PG_FORGE_STUDY_PLANS.find((p) => p.slug === slug) || null;
}
