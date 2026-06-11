---
slug: online-learning-systems
module: sd-microservices
title: Online Learning Systems
subtitle: Streaming gradient updates, drift detection, replay buffers, and the safety scaffolding that keeps a continuously-learning model from melting in production.
difficulty: Advanced
position: 103
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Online machine learning — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Online_machine_learning"
    type: reference
  - title: "Concept drift — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Concept_drift"
    type: reference
  - title: "Lu et al. — Learning under Concept Drift: A Review"
    url: "https://arxiv.org/abs/2004.05785"
    type: paper
  - title: "Stochastic gradient descent — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Stochastic_gradient_descent"
    type: reference
status: published
---

## intro
An online learning system trains while it serves. Events arrive, the model updates its weights on each event (or mini-batch), and the next prediction reflects what it just learned. The architecture is fundamentally different from batch ML: the training loop, the drift monitor, and the inference path are the same long-running process, and a single corrupted feature can poison the model in seconds. This concept covers the moving parts — streaming gradient updates, replay buffers, drift detectors, rollback safety — that make a continuously-learning system survive contact with real traffic.

## whyItMatters
The systems that absolutely require online learning are the ones where the distribution shifts faster than a nightly batch can chase: ad click-through models, fraud scoring, content ranking, recommendation feeds, dynamic pricing. A batch model retrained every 24 hours is operating 12-24 hours behind the wave. Teams at TikTok, Pinterest, Twitter, and the ad platforms publish architectures where the model updates within seconds of an event, and the inference cost of that update is amortised by the freshness lift. Understanding the failure modes — runaway gradients, training on stale labels, silent drift, replay-buffer bias — is what separates a system that ships from one that gets rolled back after a single bad day.

## intuition
Three loops run concurrently and each can break the system.

**The update loop.** Events stream in with labels (clicked / not clicked, fraud / not fraud, purchased / not purchased). Each event becomes a gradient step on the live model weights. SGD generalises directly: `w := w - lr * grad(loss(model(x), y))`. The learning rate must be tiny — a single noisy event must not move predictions visibly — and the optimizer must be robust to label noise (FTRL, Adagrad with `eps` clipping, or momentum-free SGD with strict gradient clipping).

**The label-delay problem.** A click might be observed 100 ms after impression, a fraud chargeback 30 days after the transaction. The system must wait for labels (delayed feedback) without stalling — typically by writing impressions into a join buffer, joining with labels as they arrive, and emitting (x, y) tuples to the trainer. Long-delay labels (chargebacks) train a separate slower model.

**The drift detector.** Concept drift means the joint distribution P(x, y) shifts. Three detection patterns: (a) prediction-distribution monitors — track p99 score, average prediction, calibration; alert on shift. (b) feature-distribution monitors — Population Stability Index, KS test per feature. (c) error-based monitors — DDM, ADWIN, Page-Hinkley track moving error rate; alert on regime change. When drift fires, the system can react: bump the learning rate, expand the replay buffer to capture the new regime, or trigger a partial rollback to the last stable checkpoint.

**The replay buffer.** Pure streaming SGD on the latest event suffers from recency bias: the model overfits to whatever just happened. The fix is a replay buffer — a windowed reservoir-sampled queue of recent events. Each gradient step samples a mini-batch mixing fresh events with older ones. This stabilises learning and gives the system memory of the distribution it lived in 30 minutes ago, which matters when a transient anomaly (bot attack, region outage) would otherwise rewire the model.

**Safety scaffolding.** Continuous checkpoints, dual models (production frozen + shadow learning), and a fast-rollback path. If drift fires AND error rate spikes, promote the shadow back to a recent stable checkpoint while you investigate.

The mental model: streaming SGD is correct in textbooks and dangerous in production. The architecture exists to soften every place a single bad event would otherwise reach the weights.

## visualization
```
       events                  joined (x, y) tuples
       impressions             (after label delay)
   ---------+---------------+--------+-------------------
            |               |        |
            v               v        v
       impression       label join     gradient on event
       buffer           (Flink)       (SGD / FTRL step)
       (Kafka)              |                |
            |               |                v
            |        +------+      [ REPLAY BUFFER ]
            |        |             reservoir-sampled
            v        v             windowed events
       feature snapshot   |             |
       drift detector <---+             v
       (ADWIN / KS test)         mini-batch sample
            |                    grad step on mix
            |  drift signal              |
            v                            v
       safety supervisor      live model weights w
       (rollback / lr bump)   serve predictions, p99 < 30ms
            |
            v
       last stable checkpoint
       (every N minutes)
```

## bruteForce
Train a batch model nightly on yesterday's events; serve a frozen copy until the next batch lands. Operationally trivial, latency to react is 24 hours. For most domains the freshness gap costs money invisibly — clicks predicted with yesterday's distribution. A second naive online design: vanilla SGD on each event with no replay buffer, no drift detector, no checkpoint. The first 10-minute bot attack rewrites the weights and the model never recovers.

## optimal
A production online learner stacks the following:

1. **Event bus + label joiner.** Events land in Kafka with a unique impression_id. Labels arrive on a separate topic; a Flink job joins them within a configurable window (e.g. 5 minutes for clicks, 30 days for chargebacks) and emits (x, y) tuples downstream. Out-of-window labels are dropped or routed to a slower model.

2. **Trainer with replay buffer.** A reservoir-sampled buffer holds the last N joined events (N typically 100k - 10M). Each gradient step pulls a mini-batch mixing fresh + replayed samples. FTRL or Adam with clipped gradients is standard; vanilla SGD is too brittle.

3. **Drift detector running in parallel.** Compute Population Stability Index per feature on rolling windows. Run ADWIN on the rolling error rate. On drift, raise a signal to the safety supervisor.

4. **Safety supervisor.** Owns the response to drift: scale learning rate up (faster adaptation), scale down (suspect spurious), expand replay buffer (capture new regime), or roll back to the last stable checkpoint if the error spike is too large. This is the human-in-the-loop chokepoint that prevents runaway training.

5. **Checkpointing every N seconds.** Weights snapshotted to object storage. Roll back is `load(weights_t_minus_5min)`. Without this, a single bad gradient step destroys the model.

6. **Shadow model for evaluation.** Two copies of the model run: production (serves traffic) and shadow (logs predictions but does not serve). Promote shadow to production on schedule after parity checks. Lets the training loop experiment without risk.

7. **Bounded gradient clipping + per-feature norm limits.** Hard cap `|grad| <= G_max`. Stops a single outlier event from moving weights by orders of magnitude. Tied to the same FTRL or Adam config that handles sparsity.

8. **Cold-start protection.** New features (e.g. a new ad campaign) start with prior weights, not zero. Use Bayesian smoothing or a learned embedding from similar features. Otherwise the model assigns wild predictions until enough events accumulate.

## complexity
- Update step: O(d) for linear models (logistic regression with SGD); O(d * L) for deep models with L layers. Linear is what TikTok/ads use for sub-millisecond updates.
- Throughput: 100k-1M updates/sec per server for linear FTRL; 1-10k/sec for deep online models.
- Replay buffer memory: N * d bytes; typical 10M events * 200 features * 4 bytes = ~8 GB RAM.
- Drift detection: ADWIN amortised O(log W) per event for window size W; PSI O(d) per snapshot.
- End-to-end latency event-to-weights: ~1-10 seconds with Kafka + Flink + label window.

## pitfalls
- **No gradient clipping.** A single corrupted feature (outlier ID, NaN) produces a giant gradient and resets your weights to garbage. Always clip and always monitor `|grad|` p99.
- **Training on delayed labels as if they were synchronous.** A click that arrives 200 ms late is fine; a fraud chargeback 30 days late used to train a real-time model is poison. Route long-delay labels to a separate slower model.
- **No replay buffer, pure streaming SGD.** Recency bias makes the model overfit to whatever just happened. Bot traffic, region outages, or holiday spikes rewire the weights. Reservoir sampling + mini-batches over the buffer is the fix.
- **Treating drift detector signal as ground truth.** PSI and ADWIN have false positives. Wire them to a safety supervisor that requires corroboration (drift + error spike + manual ack) before destructive actions like rollback.
- **No checkpointing.** First time a model goes bad you have no last-known-good. Snapshot weights every N seconds to object storage; rollback is a load.
- **Cold start with zero weights.** New ad campaigns or new users get wild predictions until enough events accumulate. Seed with prior or embed-based initialization.
- **Feedback loop with the recommender.** The model recommends item A, the user clicks because it was shown, the model learns "users like A" and recommends it more. Position bias and exploration policy must be modelled explicitly (epsilon-greedy, IPS).

## interviewTips
- Frame online learning as three loops + a safety supervisor. Most candidates only describe SGD on a stream and miss replay, drift detection, and rollback.
- Name the failure modes — runaway gradients, label delay, recency bias, feedback loops, cold start. Senior interviewers grade on awareness of what goes wrong, not on the gradient formula.
- When asked about drift detection, name a concrete detector (ADWIN, PSI, KS) and what action it triggers. Vague "monitor for drift" answers get downgraded.

## code.python
```python
# Linear online learner with FTRL, gradient clipping, and a reservoir replay buffer.
from river import linear_model, optim, metrics
import collections, random

model = linear_model.LogisticRegression(optimizer=optim.FTRLProximal(l1=1e-3, l2=1.0))
metric = metrics.LogLoss()
buf = collections.deque(maxlen=1_000_000)

for event in kafka_stream():                       # {'x': features, 'y': label}
    x, y = event['x'], event['y']

    # 1. predict + serve
    p = model.predict_proba_one(x)[True]

    # 2. record into replay buffer (reservoir sample)
    if len(buf) < buf.maxlen: buf.append((x, y))
    else: buf[random.randrange(len(buf))] = (x, y)

    # 3. gradient step on a mini-batch from buffer (mix fresh + old)
    batch = random.sample(buf, k=min(32, len(buf)))
    for xi, yi in batch:
        model.learn_one(xi, yi)                    # FTRL handles clipping internally

    metric.update(y, p)
    if events_seen % 10_000 == 0:
        checkpoint(model, metric.get())            # snapshot for rollback
```

## code.javascript
```javascript
// Node-side drift detector — PSI on rolling feature distributions.
function populationStabilityIndex(reference, current, buckets = 10) {
  const edges = quantileEdges(reference, buckets);
  const refDist = bucketize(reference, edges);
  const curDist = bucketize(current, edges);
  let psi = 0;
  for (let i = 0; i < buckets; i++) {
    const r = Math.max(refDist[i], 1e-6), c = Math.max(curDist[i], 1e-6);
    psi += (c - r) * Math.log(c / r);
  }
  return psi;     // < 0.1 stable, 0.1-0.25 minor drift, > 0.25 significant
}

// Wire into the safety supervisor:
if (psi > 0.25 && errorSpike) supervisor.requestRollback('drift+error');
```

## code.java
```java
// ADWIN-style adaptive window for drift detection on the streaming error rate.
import moa.classifiers.core.driftdetection.ADWIN;

ADWIN detector = new ADWIN(/*delta=*/ 0.002);

for (Event e : stream) {
    double err = (prediction(e) != e.label) ? 1.0 : 0.0;
    if (detector.setInput(err)) {
        // drift detected — supervisor decides: bump lr, expand buffer, or rollback
        supervisor.onDriftDetected(detector.getEstimation());
    }
}
```

## code.cpp
```cpp
// Hot path: per-event SGD with gradient clipping on a logistic regression.
#include <vector>
#include <cmath>

constexpr double LR = 0.05, GRAD_CLIP = 5.0;
std::vector<double> w(D, 0.0);

double sigmoid(double z) { return 1.0 / (1.0 + std::exp(-z)); }

void update(const std::vector<double>& x, double y) {
    double z = 0.0;
    for (int i = 0; i < D; ++i) z += w[i] * x[i];
    double err = sigmoid(z) - y;                       // dL/dz
    for (int i = 0; i < D; ++i) {
        double g = err * x[i];
        g = std::max(-GRAD_CLIP, std::min(GRAD_CLIP, g));
        w[i] -= LR * g;
    }
}
```
