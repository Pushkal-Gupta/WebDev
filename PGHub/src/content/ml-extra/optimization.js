export const OPTIMIZATION_EXTRA = [
  {
    slug: 'learning-rate-schedules',
    title: 'Learning rate schedules',
    oneLiner: 'A fixed step size is a compromise. Schedules let the step shrink, warm up, or restart as training proceeds.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'Why one number is not enough',
        body: `The learning rate \\(\\eta\\) controls how far each gradient step moves the parameters. A single fixed value forces an impossible compromise. Early in training the parameters are far from any good solution and a large step makes fast progress. Late in training the parameters sit near the bottom of a valley and the same large step overshoots, bouncing across the basin instead of settling. One number cannot be both large enough to move quickly at the start and small enough to converge cleanly at the end.

A **learning rate schedule** makes \\(\\eta\\) a function of the step count \\(t\\) instead of a constant. You start with a step size big enough to cover ground, then shrink it as the loss flattens out so the optimizer can fine-tune. This is the single cheapest change that reliably improves a training run: the gradients are unchanged, the model is unchanged, only the multiplier in front of the update moves.

The most common families are **step decay** (cut \\(\\eta\\) by a factor every fixed number of epochs), **exponential decay** (\\(\\eta_t = \\eta_0 \\gamma^t\\)), **cosine annealing** (\\(\\eta\\) follows a half-cosine from \\(\\eta_0\\) down to near zero), and **linear warmup** (ramp \\(\\eta\\) up from zero over the first few hundred steps before decaying). Modern transformer training almost always uses warmup followed by cosine or linear decay, and the warmup matters more than people expect.`,
      },
      {
        kind: 'viz',
        component: 'LRScheduleShapesViz',
        heading: 'Four schedules on one axis — drag the marker to read η at any step',
      },
      {
        kind: 'prose',
        heading: 'Cosine annealing, and why it became the default',
        body: `Cosine annealing sets the learning rate to follow the first half of a cosine curve across the whole training run:

\\[
\\eta_t = \\eta_{\\min} + \\tfrac{1}{2}\\,(\\eta_{\\max} - \\eta_{\\min})\\left(1 + \\cos\\!\\left(\\frac{t}{T}\\pi\\right)\\right)
\\]

Here \\(T\\) is the total number of steps, \\(t\\) the current step, \\(\\eta_{\\max}\\) the peak rate and \\(\\eta_{\\min}\\) the floor (often zero). At \\(t = 0\\) the cosine is \\(1\\), so \\(\\eta = \\eta_{\\max}\\). At \\(t = T\\) the cosine is \\(-1\\), so \\(\\eta = \\eta_{\\min}\\). In between, the rate falls slowly at first, fastest through the middle, then slowly again as it approaches the floor.

That shape is the appeal. The slow start keeps the rate high while the model is still making large gains; the gentle landing keeps the rate from collapsing to zero too early, which would freeze progress while loss is still dropping. Compared to step decay — which drops the rate in sudden cliffs that show up as visible kinks in the loss curve — cosine is smooth and needs no tuning of where to place the steps.

**Warmup** is usually bolted on the front. For the first \\(W\\) steps the rate ramps linearly from \\(0\\) to \\(\\eta_{\\max}\\), then cosine decay takes over. The reason is that at initialization the gradient estimates are noisy and the adaptive optimizer's running statistics are unreliable; a full-size step on that noise can throw the parameters somewhere bad. Warmup lets the statistics settle before the steps get large.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: cosine schedule over 10 steps',
        body: `Take \\(\\eta_{\\max} = 0.1\\), \\(\\eta_{\\min} = 0\\), and a short run of \\(T = 10\\) steps. The schedule is \\(\\eta_t = 0.05\\,(1 + \\cos(\\tfrac{t}{10}\\pi))\\). Step through it:

- \\(t = 0\\): \\(\\cos(0) = 1\\), so \\(\\eta = 0.05 \\cdot 2 = 0.100\\).
- \\(t = 1\\): \\(\\cos(0.1\\pi) \\approx 0.951\\), so \\(\\eta \\approx 0.05 \\cdot 1.951 = 0.0976\\).
- \\(t = 2\\): \\(\\cos(0.2\\pi) \\approx 0.809\\), so \\(\\eta \\approx 0.0905\\).
- \\(t = 3\\): \\(\\cos(0.3\\pi) \\approx 0.588\\), so \\(\\eta \\approx 0.0794\\).
- \\(t = 5\\): \\(\\cos(0.5\\pi) = 0\\), so \\(\\eta = 0.05\\) — exactly half the peak, at the midpoint.
- \\(t = 7\\): \\(\\cos(0.7\\pi) \\approx -0.588\\), so \\(\\eta \\approx 0.0206\\).
- \\(t = 9\\): \\(\\cos(0.9\\pi) \\approx -0.951\\), so \\(\\eta \\approx 0.0024\\).
- \\(t = 10\\): \\(\\cos(\\pi) = -1\\), so \\(\\eta = 0\\).

Notice the spacing. The rate barely moves over the first two steps (\\(0.100 \\to 0.0976\\)) and barely moves over the last two (\\(0.0024 \\to 0\\)), but drops by roughly \\(0.011\\) per step through the middle. That is the cosine doing its job: protect the early high-rate phase, land softly at the end, spend the decay budget in the middle where it costs the least.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: warmup then cosine decay',
        body: `def lr_at(t, eta_max, warmup_W, total_T):
    if t < warmup_W:                      # linear ramp 0 -> eta_max
        return eta_max * t / warmup_W
    # cosine decay over the remaining steps
    progress = (t - warmup_W) / (total_T - warmup_W)   # 0 .. 1
    return 0.5 * eta_max * (1 + cos(pi * progress))

# typical transformer setup:
#   eta_max  = 3e-4
#   warmup_W = 2000 steps
#   total_T  = 100000 steps`,
      },
      {
        kind: 'prose',
        heading: 'Common mistake: decaying to zero too early',
        body: `The trap is setting the schedule's total length \\(T\\) shorter than the run you actually intend to train. If you tell a cosine schedule \\(T = 50{,}000\\) but then keep training to step \\(80{,}000\\), the rate has already hit its floor of zero by step \\(50{,}000\\) and the last \\(30{,}000\\) steps do almost nothing — the parameters are frozen while the GPU bill keeps running. The loss curve goes flat not because the model converged but because the optimizer stopped stepping.

The mirror mistake is setting \\(T\\) far longer than the run. Then the rate never gets a chance to decay, training ends with a still-large step size, and the final model sits in a noisy, under-annealed state that a short fine-tune at low rate would have improved.

The fix is to set \\(T\\) to the exact number of steps you plan to run, decided up front from your token or epoch budget — not a round number you hope is "big enough." If you genuinely do not know the run length ahead of time, prefer **cosine with warm restarts** (the rate periodically jumps back to \\(\\eta_{\\max}\\) and decays again) or a simple linear-to-zero schedule pinned to your best estimate, and re-pin it if the budget changes.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `You are training with cosine annealing, \\(\\eta_{\\max} = 0.01\\), \\(\\eta_{\\min} = 0\\), total \\(T = 1000\\) steps and no warmup. Compute the learning rate at step \\(t = 250\\) and at step \\(t = 750\\). Which step takes the larger update, and by what ratio? Then explain in one sentence why adding a 100-step linear warmup would change the rate at \\(t = 250\\). (Hint: \\(\\cos(0.25\\pi) \\approx 0.707\\) and \\(\\cos(0.75\\pi) \\approx -0.707\\).)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Loshchilov & Hutter — "SGDR: Stochastic Gradient Descent with Warm Restarts"](https://arxiv.org/abs/1608.03983) — the paper that introduced cosine annealing with restarts.
- [Smith — "Cyclical Learning Rates for Training Neural Networks"](https://arxiv.org/abs/1506.01186) — the case for letting the rate rise and fall instead of only decaying.
- [PyTorch docs — torch.optim.lr_scheduler](https://pytorch.org/docs/stable/optim.html) — the schedules above, ready to drop into a training loop.`,
      },
    ],
  },
  {
    slug: 'momentum',
    title: 'Momentum',
    oneLiner: 'Give the optimizer a memory of where it was heading. The bouncing across ravines averages out; the downhill direction reinforces.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'The problem momentum solves',
        body: `Plain gradient descent has no memory. Each step looks only at the gradient at the current point and moves against it, then forgets that direction entirely. On a long narrow valley — the anisotropic bowl from the gradient-descent lesson — this is wasteful. The gradient points mostly across the valley, toward the steep walls, with only a small component pointing along the valley toward the minimum. So the optimizer zig-zags from wall to wall, making tiny net progress down the long axis while burning most of its step length bouncing sideways.

**Momentum** fixes this by accumulating a running average of past gradients and stepping in that averaged direction instead of the raw gradient. The physical analogy is a heavy ball rolling down the surface. The ball has inertia: it does not instantly reverse when the local slope flips. The sideways bounces, which alternate in sign step to step, mostly cancel in the running average. The downhill component, which has the same sign every step, accumulates and grows. The ball stops rattling between the walls and rolls steadily down the valley floor.

The cost is one extra vector — the **velocity** \\(v\\), one number per parameter — and one extra hyperparameter, the momentum coefficient \\(\\beta\\), usually set to \\(0.9\\). That tiny addition routinely cuts the number of steps to convergence by a large factor on ill-conditioned problems, which is why essentially every optimizer in deep learning carries a momentum term.`,
      },
      {
        kind: 'viz',
        component: 'MomentumBowlViz',
        heading: 'Roll a ball down the bowl — watch the velocity vector accumulate',
      },
      {
        kind: 'prose',
        heading: 'The update rule',
        body: `Momentum maintains a velocity vector \\(v\\) initialized to zero. At each step it blends the old velocity with the new gradient, then moves the parameters along the velocity:

\\[
v \\leftarrow \\beta\\, v + \\nabla L(\\theta), \\qquad \\theta \\leftarrow \\theta - \\eta\\, v
\\]

The coefficient \\(\\beta \\in [0, 1)\\) controls how much of the past survives. With \\(\\beta = 0\\) the velocity is just the current gradient and you recover plain gradient descent. With \\(\\beta = 0.9\\) each gradient contributes to roughly the next ten steps before its influence decays away — the running average has an effective window of \\(1/(1-\\beta) = 10\\) gradients.

There is a clean way to read the steady-state behaviour. If the gradient were a constant \\(g\\) every step, the velocity would converge to \\(v_\\infty = g/(1-\\beta)\\). With \\(\\beta = 0.9\\) that is \\(10g\\) — momentum effectively multiplies the step size by ten in directions where the gradient is consistent. In directions where the gradient flips sign every step, the terms partly cancel and the effective multiplier is far smaller. That asymmetry — amplify the consistent direction, damp the oscillating one — is the whole mechanism.

A close variant, **Nesterov momentum**, evaluates the gradient at the look-ahead point \\(\\theta - \\eta\\beta v\\) rather than at \\(\\theta\\). Because the step is partly already committed, measuring the slope where you are about to land gives a small but real improvement in convergence rate and a touch more stability near the minimum.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: momentum accumulating on a steady slope',
        body: `Take a constant gradient \\(g = 2\\) (imagine a straight downhill ramp), learning rate \\(\\eta = 0.1\\), and momentum \\(\\beta = 0.9\\). Start with velocity \\(v_0 = 0\\). Track the velocity step by step:

- Step 1: \\(v = 0.9 \\cdot 0 + 2 = 2.0\\), parameter moves by \\(0.1 \\cdot 2.0 = 0.20\\).
- Step 2: \\(v = 0.9 \\cdot 2.0 + 2 = 3.8\\), move \\(0.38\\).
- Step 3: \\(v = 0.9 \\cdot 3.8 + 2 = 5.42\\), move \\(0.542\\).
- Step 4: \\(v = 0.9 \\cdot 5.42 + 2 = 6.878\\), move \\(0.688\\).
- Step 5: \\(v = 0.9 \\cdot 6.878 + 2 = 8.190\\), move \\(0.819\\).

The step size grows every iteration even though the gradient never changes. Plain gradient descent would have moved a flat \\(0.20\\) per step the whole time. By step 5 momentum is moving four times as far. Continue and the velocity climbs toward its ceiling \\(v_\\infty = 2/(1 - 0.9) = 20\\), at which point each step moves \\(0.1 \\cdot 20 = 2.0\\) — ten times the plain step. That is the acceleration on a consistent slope.

Now the oscillating case. Suppose the gradient alternates \\(+2, -2, +2, -2, \\dots\\) (bouncing across a ravine). Starting from \\(v_0 = 0\\): \\(v_1 = 2\\), \\(v_2 = 0.9 \\cdot 2 - 2 = -0.2\\), \\(v_3 = 0.9 \\cdot (-0.2) + 2 = 1.82\\), \\(v_4 = 0.9 \\cdot 1.82 - 2 = -0.362\\). The velocity stays small and near zero — it never builds up because each new gradient mostly cancels the accumulated one. Same \\(\\beta\\), same magnitudes, opposite outcome: the consistent direction is amplified roughly tenfold while the alternating direction is suppressed to a fraction of a single gradient.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: SGD with momentum',
        body: `v = zeros_like(theta)            # velocity, one per parameter
for t in range(steps):
    g = grad(loss, theta)        # current gradient
    v = beta * v + g             # blend memory with new gradient
    theta = theta - eta * v      # step along the velocity

# Nesterov variant: evaluate the gradient at the look-ahead point
#   g = grad(loss, theta - eta * beta * v)
# before the v update.`,
      },
      {
        kind: 'prose',
        heading: 'Common mistake: stacking momentum on top of a hot learning rate',
        body: `A learning rate that is perfectly stable for plain SGD can diverge the moment you add momentum, and people are caught out by this constantly. The reason is the effective step amplification: with \\(\\beta = 0.9\\), a consistent gradient direction gets its step multiplied by up to \\(1/(1-\\beta) = 10\\). If your plain-SGD learning rate was already near the stability ceiling, multiplying the effective step by ten sends the loss straight to \\(\\texttt{NaN}\\).

The symptom is a run that trained fine, then you "improved" it by adding momentum and it explodes in the first few hundred steps. The instinct to blame the momentum is wrong — momentum is doing exactly what it should; the learning rate is now too large for the amplified steps.

The fix is to reduce \\(\\eta\\) when you turn momentum on, roughly in proportion to the amplification. A practical starting point: if you used \\(\\eta\\) for plain SGD, try \\(\\eta(1-\\beta)\\) as the momentum learning rate, then tune upward. With \\(\\beta = 0.9\\) that is a tenfold cut, which sounds drastic but keeps the *effective* step in the range plain SGD was happy with — and momentum then buys you the acceleration on top.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `With \\(\\beta = 0.99\\) and a constant gradient \\(g = 1\\), what is the steady-state velocity \\(v_\\infty\\)? If the plain-SGD learning rate \\(\\eta = 0.001\\) was stable, estimate a safer learning rate to pair with this momentum and explain why \\(\\beta = 0.99\\) is more dangerous than \\(\\beta = 0.9\\) at the same \\(\\eta\\). (Hint: \\(v_\\infty = g/(1-\\beta)\\), and the effective step multiplier is the same expression.)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Goh — "Why Momentum Really Works"](https://distill.pub/2017/momentum/) — an interactive Distill article that builds the entire intuition with draggable visualizations.
- [Sutskever et al. — "On the importance of initialization and momentum in deep learning"](https://proceedings.mlr.press/v28/sutskever13.html) — the empirical case for Nesterov momentum in deep nets.
- [3Blue1Brown — "Gradient descent, how neural networks learn"](https://www.youtube.com/watch?v=IHZwWFHWa-w) — the rolling-ball mental model momentum makes literal.`,
      },
    ],
  },
  {
    slug: 'second-order-methods',
    title: 'Second-order methods',
    oneLiner: 'The gradient tells you which way is downhill. The curvature tells you how far that downhill lasts. Use both and you can step toward the minimum directly.',
    difficulty: 'intermediate',
    readMinutes: 10,
    sections: [
      {
        kind: 'prose',
        heading: 'What the gradient leaves out',
        body: `Gradient descent uses one piece of local information: the slope. It knows which direction the loss drops fastest, but it has no idea how *long* that drop lasts. Walk a fixed distance along the steepest direction on a gently curving surface and you make great progress; walk the same distance on a sharply curving surface and you overshoot the bottom and climb the far wall. The gradient cannot distinguish these cases — both have the same slope at the current point.

The missing information is **curvature**: how the slope itself changes as you move. In one dimension that is the second derivative \\(f''(x)\\). In many dimensions it is the **Hessian** \\(H\\), an \\(n \\times n\\) matrix whose entry \\(H_{ij} = \\partial^2 L / \\partial\\theta_i \\partial\\theta_j\\) measures how the gradient component \\(i\\) changes when you nudge parameter \\(j\\). The diagonal entries are per-parameter curvatures; the off-diagonal entries capture how parameters interact.

**Second-order methods** use the Hessian to choose not just a direction but a step length tuned to the local curvature. Where first-order methods take one global learning rate and apply it everywhere, second-order methods rescale the step per direction so that a steeply curved axis takes a short step and a gently curved axis takes a long one. On the anisotropic bowl that plagues plain gradient descent, this collapses the zig-zag entirely.`,
      },
      {
        kind: 'viz',
        component: 'SecondOrderViz',
        heading: 'Step the gradient along the tangent versus the Newton jump to the parabola minimum',
      },
      {
        kind: 'prose',
        heading: "Newton's method",
        body: `The cleanest second-order method comes from a second-order Taylor expansion of the loss around the current point \\(\\theta\\):

\\[
L(\\theta + \\Delta) \\approx L(\\theta) + \\nabla L^\\top \\Delta + \\tfrac{1}{2}\\,\\Delta^\\top H\\, \\Delta
\\]

This is a quadratic in the step \\(\\Delta\\). Minimize it exactly — set the derivative with respect to \\(\\Delta\\) to zero — and you get \\(H\\Delta = -\\nabla L\\), so the optimal step is

\\[
\\Delta = -H^{-1}\\nabla L, \\qquad \\theta \\leftarrow \\theta - H^{-1}\\nabla L.
\\]

That is **Newton's method**. The inverse Hessian \\(H^{-1}\\) rescales the gradient: it stretches the step in low-curvature directions and shrinks it in high-curvature ones. On a quadratic bowl Newton's method reaches the exact minimum in a *single* step, regardless of how stretched the bowl is — the condition number that costs plain gradient descent a thousand iterations costs Newton nothing.

The price is brutal. The Hessian of a model with \\(n\\) parameters is \\(n \\times n\\); storing it costs \\(O(n^2)\\) memory and inverting it costs \\(O(n^3)\\) time. For a million-parameter model that is a trillion entries and an inversion that no machine will finish. For a billion-parameter LLM it is hopeless by many orders of magnitude. Newton's method is exact and unusable at scale — which is exactly why a whole family of cheaper approximations exists.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: one Newton step versus many gradient steps',
        body: `Return to the bowl \\(L(x, y) = x^2 + 10y^2\\). Its gradient is \\(\\nabla L = (2x,\\, 20y)\\) and its Hessian is the constant diagonal matrix \\(H = \\operatorname{diag}(2, 20)\\), so \\(H^{-1} = \\operatorname{diag}(0.5,\\, 0.05)\\).

Start at \\((1, 1)\\). The gradient is \\((2, 20)\\). The Newton step is

\\[
\\Delta = -H^{-1}\\nabla L = -\\operatorname{diag}(0.5, 0.05)\\,(2, 20) = -(1,\\, 1).
\\]

So \\(\\theta \\leftarrow (1, 1) - (1, 1) = (0, 0)\\) — the exact minimum, in one step. The inverse Hessian rescaled the oversized \\(y\\)-gradient (20) down by \\(0.05\\) to exactly \\(1\\), matching the \\(x\\)-component, so the step pointed straight at the origin instead of mostly sideways.

Compare plain gradient descent on the same problem. From the gradient-descent lesson, with learning rate \\(\\alpha = 0.05\\) it cleared the \\(y\\)-axis in one step but then ground along \\(x\\) at rate \\(0.9\\): after ten steps \\(x \\approx 0.349\\), after fifty \\(x \\approx 0.005\\). It needs dozens of iterations to reach what Newton reached in one. The difference is entirely the curvature information: gradient descent must use one cautious global rate set by the steep \\(y\\)-axis, so the gentle \\(x\\)-axis crawls; Newton gives each axis its own correctly-sized step.

The catch worth seeing: this only works because the Hessian here is positive (both curvatures positive, a genuine bowl). If a curvature were negative — a saddle — \\(H^{-1}\\) would step *toward* the saddle, uphill, which is why raw Newton's method is unsafe on the non-convex losses of deep learning.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: Newton step vs L-BFGS sketch',
        body: `# Exact Newton (only feasible for small n):
g = grad(L, theta)            # n-vector
H = hessian(L, theta)         # n x n  -> O(n^2) memory
theta = theta - solve(H, g)   # solve H d = g, O(n^3)

# L-BFGS idea (scalable): never form H.
#   keep the last m pairs (s_k, y_k):
#     s_k = theta_{k+1} - theta_k       (param change)
#     y_k = grad_{k+1} - grad_k         (gradient change)
#   approximate H^{-1} g from those m pairs in O(m*n) time,
#   no n x n matrix ever stored.  m is typically 5-20.`,
      },
      {
        kind: 'prose',
        heading: 'Quasi-Newton and why deep learning rarely goes full second-order',
        body: `Because the exact Hessian is unaffordable, practitioners use **quasi-Newton** methods that build a cheap approximation of \\(H^{-1}\\) from the gradients they already compute. **BFGS** maintains a running estimate of the inverse Hessian using successive parameter and gradient changes; **L-BFGS** (limited-memory BFGS) keeps only the last few such pairs, costing \\(O(mn)\\) instead of \\(O(n^2)\\). L-BFGS is the workhorse for medium-scale smooth problems — classical logistic regression, CRFs, physics-style optimization — where it crushes first-order methods.

Deep learning mostly does *not* use these, for three reasons. First, the losses are noisy: minibatch gradients are stochastic, and the curvature estimates that quasi-Newton methods rely on are corrupted by that noise. Second, the losses are non-convex with abundant saddle points, where the Hessian has negative eigenvalues and a naive Newton step heads uphill. Third, even \\(O(mn)\\) overhead is unwelcome at billion-parameter scale.

What deep learning uses instead are **diagonal approximations**. Adam and RMSprop track a per-parameter running average of squared gradients and divide each update by its square root — this is a crude estimate of the diagonal of the Hessian, ignoring all the off-diagonal interaction terms. It is far less accurate than a true second-order method, but it is cheap (\\(O(n)\\)), robust to noise, and captures the one thing that matters most: rescaling each parameter's step by its own curvature. Shampoo and K-FAC go further, approximating block structure in the Hessian, and are used in some large-scale training — but the diagonal approximation remains the default.`,
      },
      {
        kind: 'prose',
        heading: 'Common mistake: applying raw Newton steps on a non-convex loss',
        body: `The textbook formula \\(\\theta \\leftarrow \\theta - H^{-1}\\nabla L\\) is only a descent direction when the Hessian is **positive definite** — all curvatures positive, a genuine bowl. On a neural-network loss that condition fails constantly: at saddle points some Hessian eigenvalues are negative. Where an eigenvalue is negative, \\(H^{-1}\\) flips the sign of that component of the step, so the "Newton step" moves *uphill* along that direction. Run raw Newton on such a point and the loss can increase, sometimes catastrophically, instead of decreasing.

The symptom is a second-order optimizer that diverges or stalls on a deep net even though the math looked correct — the formula assumed convexity the loss does not have.

The fix is to never use raw \\(H^{-1}\\) on non-convex losses. Practical second-order methods modify the Hessian to be positive definite before inverting: add a damping term \\((H + \\lambda I)^{-1}\\) (trust-region / Levenberg–Marquardt style), or use the **Gauss–Newton** approximation, which is positive semidefinite by construction. And for most deep learning, the honest fix is to skip true second-order methods entirely and use a diagonal adaptive method like Adam, which sidesteps the negative-curvature problem because it only ever divides by *squared* gradients, which are non-negative.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `For the loss \\(L(x, y) = 3x^2 + 12y^2\\), write down the gradient and the Hessian. Starting from the point \\((2, 1)\\), compute the single exact Newton step and confirm it lands at the minimum. Then state how many gradient-descent steps (order of magnitude) you would expect to need to reach the same point, and which feature of the Hessian sets that count. (Hint: the Hessian is diagonal and constant; its condition number is the ratio of its two diagonal entries.)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Nocedal & Wright — "Numerical Optimization", Ch. 6 (Quasi-Newton)](https://link.springer.com/book/10.1007/978-0-387-40065-5) — the definitive treatment of BFGS and L-BFGS.
- [Martens & Grosse — "Optimizing Neural Networks with Kronecker-factored Approximate Curvature"](https://arxiv.org/abs/1503.05671) — K-FAC, a scalable block-Hessian approximation for deep nets.
- [Dauphin et al. — "Identifying and attacking the saddle point problem"](https://arxiv.org/abs/1406.2572) — why saddle points, not local minima, dominate high-dimensional loss surfaces.`,
      },
    ],
  },
  {
    slug: 'gradient-clipping',
    title: 'Gradient clipping',
    oneLiner: 'A single huge gradient can wreck a training run in one step. Clipping caps its size so one bad batch cannot blow up the model.',
    difficulty: 'intermediate',
    readMinutes: 8,
    sections: [
      {
        kind: 'prose',
        heading: 'The exploding-gradient problem',
        body: `Most gradient steps are well-behaved, but occasionally one is enormous. A rare batch hits a region of the loss surface where the slope is a cliff face, or in a recurrent network the gradient gets multiplied through many timesteps and grows geometrically, or a numerical edge case produces a near-infinite derivative. When that single oversized gradient hits the update rule \\(\\theta \\leftarrow \\theta - \\eta\\,\\nabla L\\), it throws the parameters far from anywhere sensible. The very next forward pass produces garbage, the loss becomes \\(\\texttt{NaN}\\), and the run is dead. Hours of training, ruined by one bad step.

**Gradient clipping** is the seatbelt. Before applying the update, you check the size of the gradient, and if it exceeds a threshold you shrink it back down. The direction is preserved; only the magnitude is capped. A normal step is untouched; a runaway step is tamed into a normal-sized one. This single guardrail is the standard defense, and it is essentially mandatory when training recurrent networks and common in transformer training too.

There are two flavors. **Clip-by-value** caps each individual gradient component to lie in \\([-c, c]\\). **Clip-by-norm** caps the *global* norm of the whole gradient vector. Clip-by-norm is almost always the right choice because it preserves the gradient's direction exactly — it only rescales — whereas clip-by-value distorts the direction by capping some components and not others.`,
      },
      {
        kind: 'viz',
        component: 'GradientClipNormViz',
        heading: 'Project the gradient onto the norm-ball, and watch clipping flatten the exploding spikes',
      },
      {
        kind: 'prose',
        heading: 'Clip-by-norm, precisely',
        body: `Stack all the model's gradients into one big vector \\(g\\) and compute its L2 norm \\(\\|g\\|\\). Pick a threshold \\(c\\) (commonly \\(1.0\\)). The rule is:

\\[
g \\leftarrow
\\begin{cases}
g & \\text{if } \\|g\\| \\le c \\\\[4pt]
\\dfrac{c}{\\|g\\|}\\, g & \\text{if } \\|g\\| > c
\\end{cases}
\\]

When the norm is already under the threshold, nothing happens. When it exceeds \\(c\\), every component is multiplied by the same factor \\(c/\\|g\\|\\), which is less than \\(1\\). After scaling, the new norm is exactly \\(c\\). Because every component shrinks by the same ratio, the *direction* of \\(g\\) is unchanged — the optimizer still steps the same way, just not as far.

The reason the global norm is used, rather than per-layer norms, is that the gradient's direction is a property of the whole vector. Scaling different parts by different amounts would point the step somewhere the gradient never indicated. Clipping the global norm is the unique rescaling that caps the step length while leaving the descent direction untouched. (Per-layer or per-parameter-group clipping does exist and is occasionally used, but the global-norm version is the default for good reason.)`,
      },
      {
        kind: 'prose',
        heading: 'Worked: clipping a runaway gradient',
        body: `Suppose at some step the model produces a gradient vector \\(g = (6, 8)\\) across its two parameters. Its norm is \\(\\|g\\| = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\). With a clip threshold \\(c = 1.0\\), the norm \\(10\\) exceeds the cap, so clipping fires. The scale factor is

\\[
\\frac{c}{\\|g\\|} = \\frac{1.0}{10} = 0.1.
\\]

Every component is multiplied by \\(0.1\\): the clipped gradient is \\(g' = (0.6,\\, 0.8)\\). Check the new norm: \\(\\sqrt{0.6^2 + 0.8^2} = \\sqrt{0.36 + 0.64} = \\sqrt{1} = 1\\) — exactly the threshold, as promised. And the direction is identical: \\((0.6, 0.8)\\) is just \\((6, 8)\\) pointing the same way, a tenth as long.

With learning rate \\(\\eta = 0.1\\), the *un*clipped update would have moved the parameters by \\(0.1 \\cdot (6, 8) = (0.6, 0.8)\\) — a large lurch. The clipped update moves by \\(0.1 \\cdot (0.6, 0.8) = (0.06, 0.08)\\), a tenth of the distance, in the same direction. That factor-of-ten reduction is the difference between a step that might \\(\\texttt{NaN}\\) the model and a controlled one.

Now a step where clipping should *not* fire: gradient \\(g = (0.3, 0.4)\\), norm \\(\\sqrt{0.09 + 0.16} = \\sqrt{0.25} = 0.5\\). Since \\(0.5 < 1.0\\), the gradient passes through untouched. Clipping only ever intervenes on the rare oversized step; the ordinary steps that do the actual learning are left exactly as the optimizer computed them.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: clip-by-global-norm',
        body: `def clip_by_norm(grads, c):
    total = sqrt(sum((g * g).sum() for g in grads))   # global L2 norm
    if total <= c:
        return grads                                   # no-op, common case
    scale = c / total                                  # < 1 when clipping
    return [g * scale for g in grads]                  # same direction, capped length

# in the training loop:
g = grad(loss, theta)
g = clip_by_norm(g, c=1.0)        # AFTER backward, BEFORE optimizer.step()
theta = optimizer_step(theta, g)`,
      },
      {
        kind: 'prose',
        heading: 'Common mistake: clipping in the wrong place, or masking a real bug',
        body: `Two traps. The first is ordering: gradient clipping must happen *after* the backward pass computes the gradients and *before* the optimizer applies them. Clip too early and there is nothing to clip; clip after the optimizer step and the runaway update has already landed. In PyTorch the correct sequence is \\(\\texttt{loss.backward()}\\), then \\(\\texttt{clip\\_grad\\_norm\\_()}\\), then \\(\\texttt{optimizer.step()}\\). A surprising number of bugs come from calling the clip after the step, where it does nothing.

The second trap is treating clipping as a cure rather than a guardrail. If your gradients are constantly hitting the clip threshold — every step, not just rare ones — clipping is masking a deeper problem: the learning rate is too high, the initialization is bad, the data has un-normalized outliers, or the architecture lacks normalization layers. Clipping will keep the run alive but training will be sluggish and the model under-trained, because you are throwing away the magnitude of nearly every gradient.

The fix is to monitor *how often* the clip fires. Log the pre-clip gradient norm. If it exceeds the threshold only occasionally — a few percent of steps — clipping is doing its job and you should leave it. If it fires on most steps, do not raise the threshold to hide it; instead lower the learning rate, add normalization, or fix the data, and let clipping return to its proper role of catching the rare genuine spike.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A gradient vector is \\(g = (3, 0, 4, 12)\\) and the clip threshold is \\(c = 5\\). Compute \\(\\|g\\|\\), decide whether clipping fires, and if it does, give the clipped vector and confirm its norm equals \\(c\\). Then: with learning rate \\(\\eta = 0.01\\), how much shorter is the clipped parameter update than the unclipped one would have been? (Hint: \\(\\|g\\| = \\sqrt{9 + 0 + 16 + 144}\\).)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Pascanu, Mikolov & Bengio — "On the difficulty of training Recurrent Neural Networks"](https://arxiv.org/abs/1211.5063) — the paper that introduced norm-based gradient clipping for exploding gradients.
- [PyTorch docs — torch.nn.utils.clip_grad_norm_](https://pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html) — the standard implementation and the exact call signature.
- [Zhang et al. — "Why Gradient Clipping Accelerates Training"](https://arxiv.org/abs/1905.11881) — a theoretical look at why clipping helps beyond just preventing blow-ups.`,
      },
    ],
  },
  {
    slug: 'adamw-decoupled-decay',
    title: 'AdamW: decoupled weight decay',
    oneLiner: 'Adding L2 to the loss and decaying the weights are the same thing for plain SGD — but not for Adam. AdamW fixes the mismatch.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'Two things people think are identical',
        body: `Regularizing a model by penalizing large weights has two standard descriptions that are usually treated as interchangeable. The first is **L2 regularization**: add a term \\(\\tfrac{\\lambda}{2}\\|\\theta\\|^2\\) to the loss, so the optimizer sees a slightly larger gradient \\(\\nabla L + \\lambda\\theta\\) that pulls every weight toward zero. The second is **weight decay**: after each update, multiply the weights by a factor slightly less than one, \\(\\theta \\leftarrow (1 - \\eta\\lambda)\\theta\\), shrinking them directly. For plain gradient descent these are *exactly* the same operation written two ways — substitute the L2 gradient into the SGD update and the algebra collapses to the decay form. People learned them as synonyms and never had a reason to question it.

The trouble is that the equivalence quietly depends on the optimizer applying the gradient *as is*. Adam does not. Adam rescales every gradient component by a per-parameter factor — it divides by the square root of a running average of squared gradients before stepping. That rescaling is the whole point of Adam; it is what makes it adaptive. But it also means the L2 term, once folded into the gradient, gets passed through the same rescaler as everything else. The decay a weight actually receives is no longer \\(\\eta\\lambda\\theta\\); it is \\(\\eta\\lambda\\theta\\) divided by that weight's running gradient scale. The clean, uniform shrink you intended becomes a lumpy, coordinate-dependent shrink you did not.

This is not a rounding error. For years the difference between "Adam with L2" and "Adam with decoupled decay" silently cost models a fraction of their achievable accuracy, and it explained a long-standing folk observation that Adam "generalizes worse than SGD." The fix — pull the decay back out of the gradient and apply it directly to the weights, *outside* the adaptive rescaler — is **AdamW**, and it is now the default optimizer for transformer training.`,
      },
      {
        kind: 'prose',
        heading: 'The intuition: where the decay leaks',
        body: `Picture two weights in the same model. One sits on a heavily-used feature whose gradient is large and consistent every batch — call it the *busy* weight. The other sits on a rare feature that fires once in a hundred batches — the *idle* weight. Adam keeps a running second moment \\(v\\) for each: roughly the average squared gradient that weight has seen. The busy weight has a big \\(v\\); the idle weight has a tiny \\(v\\). When Adam steps, it divides each update by \\(\\sqrt{v}\\), so the busy weight gets small steps and the idle weight gets large steps. That part is intentional and good — it is how Adam equalizes progress across features of wildly different frequency.

Now fold L2 into the gradient. You wanted both weights to decay toward zero at the same gentle rate, because regularization should not care how often a feature fires — a large weight is a large weight. But the decay term \\(\\lambda\\theta\\) is now part of the gradient, so it gets divided by \\(\\sqrt{v}\\) too. The busy weight, with its big \\(\\sqrt{v}\\), sees its decay *shrunk* — it is barely regularized. The idle weight, with its tiny \\(\\sqrt{v}\\), sees its decay *amplified* — it is hammered toward zero far harder than you asked. The regularization strength has become inversely tied to how active the weight is, which is precisely backwards from what you want. The weights that most need taming (large, busy ones) get the least decay.

The mental model that makes this stick: **L2 decay should be a property of the weight's size, but routing it through Adam makes it a property of the weight's gradient history.** Those are different things. A weight can be large and rarely updated, or small and constantly updated; the adaptive rescaler conflates them. AdamW separates the two channels. The gradient channel still gets the full adaptive treatment — momentum, second-moment scaling, all of it. The decay channel bypasses that machinery entirely and applies a flat \\((1 - \\eta\\lambda)\\) multiply to every weight, identical regardless of \\(v\\). Now "decay" means what you meant: shrink in proportion to current size, full stop. The viz below runs both optimizers on a problem built to expose exactly this leak — watch the rarely-updated coordinate refuse to shrink under Adam+L2 while AdamW shrinks both evenly.`,
      },
      {
        kind: 'viz',
        component: 'AdamWVsL2Viz',
        heading: 'Adam+L2 vs AdamW on a problem with one busy and one idle coordinate — watch the final weight norms',
      },
      {
        kind: 'prose',
        heading: 'The two update rules side by side',
        body: `Write \\(\\hat m_t\\) for the bias-corrected first moment and \\(\\hat v_t\\) for the bias-corrected second moment that Adam already computes. **Adam with L2** folds the penalty into the gradient before any of the moment bookkeeping:

\\[
g_t \\leftarrow \\nabla L_t + \\lambda\\theta_{t-1}, \\qquad
\\theta_t \\leftarrow \\theta_{t-1} - \\eta\\,\\frac{\\hat m_t}{\\sqrt{\\hat v_t} + \\epsilon}
\\]

Because \\(\\lambda\\theta\\) entered through \\(g_t\\), it propagates into both \\(\\hat m_t\\) and \\(\\hat v_t\\), and the final division by \\(\\sqrt{\\hat v_t}\\) scales it by the same per-coordinate factor as the real gradient. **AdamW** keeps the penalty out of the gradient entirely and adds a separate decay step:

\\[
g_t \\leftarrow \\nabla L_t, \\qquad
\\theta_t \\leftarrow \\theta_{t-1} - \\eta\\,\\frac{\\hat m_t}{\\sqrt{\\hat v_t} + \\epsilon} - \\eta\\lambda\\,\\theta_{t-1}
\\]

The first subtracted term is the ordinary adaptive Adam step on the *unpenalized* loss. The second term, \\(\\eta\\lambda\\theta_{t-1}\\), is the decay — it touches \\(\\theta\\) directly and never sees \\(\\hat v_t\\). Every weight is multiplied by the same \\((1 - \\eta\\lambda)\\) per step, independent of its gradient history. That single relocation of one term — outside the rescaler instead of inside it — is the entire algorithmic difference between Adam and AdamW.

One consequence worth internalizing: under AdamW the decay no longer interacts with the learning-rate adaptation, so the *effective* regularization strength is just \\(\\lambda\\), stable across the run. Under Adam+L2 the effective strength drifts as \\(\\hat v_t\\) evolves during training, which is why tuning \\(\\lambda\\) for Adam+L2 is finicky and rarely transfers between problems.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: Adam+L2 vs AdamW (the one-line difference)',
        body: `def step(theta, grad, m, v, t, lr, lam, b1=0.9, b2=0.999, eps=1e-8, mode="adamw"):
    if mode == "l2":
        grad = grad + lam * theta          # penalty rides the gradient -> through 1/sqrt(v)
    m = b1 * m + (1 - b1) * grad
    v = b2 * v + (1 - b2) * grad * grad
    mhat = m / (1 - b1 ** t)
    vhat = v / (1 - b2 ** t)
    theta = theta - lr * mhat / (sqrt(vhat) + eps)
    if mode == "adamw":
        theta = theta - lr * lam * theta   # decay applied DIRECTLY, uniform, no 1/sqrt(v)
    return theta, m, v

# torch.optim.Adam(..., weight_decay=lam)  -> mode="l2"  (the leaky one)
# torch.optim.AdamW(..., weight_decay=lam) -> mode="adamw" (the fix)`,
      },
      {
        kind: 'prose',
        heading: 'Worked: the same lambda, two very different decays',
        body: `Take a busy weight with running scale \\(\\sqrt{\\hat v} = 4.0\\) and an idle weight with \\(\\sqrt{\\hat v} = 0.05\\). Set \\(\\eta = 0.001\\), \\(\\lambda = 0.1\\), and suppose both weights currently sit at \\(\\theta = 2.0\\). Look only at the decay contribution.

Under **AdamW**, the decay term is \\(\\eta\\lambda\\theta = 0.001 \\cdot 0.1 \\cdot 2.0 = 0.0002\\) for *both* weights. Identical shrink, exactly as regularization intends.

Under **Adam+L2**, the decay rides through the rescaler, so its effective size is \\(\\eta\\lambda\\theta / \\sqrt{\\hat v}\\). For the busy weight: \\(0.0002 / 4.0 = 0.00005\\) — a quarter of the intended decay. For the idle weight: \\(0.0002 / 0.05 = 0.004\\) — *twenty times* the intended decay. Same \\(\\lambda\\), and one weight is decayed eighty times harder than the other purely because of how often its feature fired. The busy weight, likely the larger and more important one, is the one that escapes regularization. Multiply this discrepancy across millions of parameters over thousands of steps and the regularization profile of the whole model is distorted — which is exactly the generalization gap AdamW closed.`,
      },
      {
        kind: 'prose',
        heading: 'Common mistakes',
        body: `**Using \\(\\texttt{torch.optim.Adam(weight\\_decay=...)}\\) and assuming it decouples.** It does not — that argument implements L2 (decay folded into the gradient), the leaky version. *Fix:* if you want decoupled decay, use \\(\\texttt{torch.optim.AdamW}\\) explicitly. The names are a trap because the keyword is identical.

**Reusing the \\(\\lambda\\) you tuned for Adam+L2 when you switch to AdamW.** Because AdamW's decay is no longer divided by \\(\\sqrt{\\hat v}\\), the *same* numeric \\(\\lambda\\) produces a much stronger effective decay, and your model will suddenly underfit. *Fix:* re-tune \\(\\lambda\\) after switching optimizers; expect the AdamW value to be smaller, often by an order of magnitude.

**Applying decay to parameters that should never be regularized.** Bias terms, LayerNorm/BatchNorm gains and shifts, and embedding scale factors do not benefit from being pulled toward zero, and decaying them can hurt. *Fix:* build two parameter groups — one with \\(\\texttt{weight\\_decay=}\\lambda\\) for weight matrices, one with \\(\\texttt{weight\\_decay=0}\\) for norms and biases — and pass both to AdamW.

**Coupling \\(\\lambda\\) to the learning-rate schedule without realizing it.** In AdamW the decay step is \\(\\eta\\lambda\\theta\\), so when a cosine schedule drives \\(\\eta \\to 0\\) the decay fades out too, which is usually what you want — but if you implement decay as a fixed \\((1-\\lambda)\\) multiply independent of \\(\\eta\\), it keeps shrinking weights even after the learning rate has annealed to zero, freezing the model into an over-regularized state. *Fix:* tie the decay multiply to the current \\(\\eta\\) exactly as \\(\\eta\\lambda\\), so it anneals together with the steps.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A weight sits at \\(\\theta = 1.0\\) with running second-moment \\(\\sqrt{\\hat v} = 0.01\\) (a very rarely updated coordinate). With \\(\\eta = 0.001\\) and \\(\\lambda = 0.05\\), compute the decay this weight receives under AdamW and under Adam+L2. By what factor is the Adam+L2 decay larger? Then explain in one sentence why this is the *opposite* of what good regularization should do, given that this is a rarely-fired feature. (Hint: AdamW decay is \\(\\eta\\lambda\\theta\\); Adam+L2 decay is that divided by \\(\\sqrt{\\hat v}\\).)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Loshchilov & Hutter — "Decoupled Weight Decay Regularization"](https://arxiv.org/abs/1711.05101) — the paper that named the problem and introduced AdamW.
- [PyTorch docs — torch.optim.AdamW](https://pytorch.org/docs/stable/generated/torch.optim.AdamW.html) — the reference implementation and the exact decoupled update.
- [fast.ai — "AdamW and Super-convergence"](https://www.fast.ai/posts/2018-07-02-adam-weight-decay.html) — a hands-on walkthrough of why the coupled version hurt and how the fix landed.`,
      },
    ],
  },
  {
    slug: 'rmsprop-adaptive',
    title: 'RMSprop and per-coordinate rates',
    oneLiner: 'Give every parameter its own learning rate, set from how big its recent gradients have been. Steep directions self-throttle; flat ones speed up.',
    difficulty: 'intermediate',
    readMinutes: 9,
    sections: [
      {
        kind: 'prose',
        heading: 'Why one learning rate per model is too blunt',
        body: `Plain gradient descent uses a single scalar learning rate \\(\\eta\\) for the entire model. Every parameter, no matter how it behaves, gets multiplied by the same step size. On a well-conditioned problem that is fine. On the kind of stretched, anisotropic loss surfaces that real models produce, it is a straitjacket: the steepest direction dictates how large \\(\\eta\\) can safely be, and that ceiling is then imposed on every other direction too. A direction with gentle curvature — where you could safely take a step a hundred times larger — is forced to crawl at the pace set by the one steep direction. The result is the familiar zig-zag down a narrow valley: big bounces across the steep axis, microscopic progress along the flat one.

**RMSprop** breaks the single rate into one rate *per coordinate*. Instead of asking "how big a step is safe globally," it asks, for each parameter separately, "how big have this parameter's gradients been lately?" — and scales that parameter's step inversely. A coordinate that keeps producing large gradients gets a small step; a coordinate whose gradients are tiny gets a large step. The steep axis throttles itself; the flat axis opens up. The zig-zag collapses into a near-direct path to the bottom, and you no longer have to pick \\(\\eta\\) for the worst-conditioned direction.

The bookkeeping cost is one extra number per parameter — a running average of squared gradients, written \\(v\\) — and one decay hyperparameter \\(\\rho\\) (usually \\(0.9\\)). That small state is what lets RMSprop adapt the rate of every coordinate independently and continuously as training proceeds. It is the direct ancestor of Adam: bolt momentum onto RMSprop and you essentially have Adam.`,
      },
      {
        kind: 'prose',
        heading: "The intuition: a thermostat for every parameter",
        body: `Think of each parameter as having its own thermostat that watches the size of its gradients. When a parameter's gradient runs hot — large in magnitude, step after step — the thermostat turns its step size *down*. When the gradient runs cold — small or rare — the thermostat turns its step size *up*. The quantity the thermostat tracks is the running mean of the *squared* gradient, \\(v\\). Squaring does two things: it makes the measure care only about magnitude, not sign (a coordinate that oscillates \\(+5, -5, +5\\) has large gradients even though they average to zero), and it makes large gradients dominate the average, so a single big spike raises the reading sharply.

Now the key move: RMSprop divides each coordinate's step by \\(\\sqrt{v}\\). Why the square root, and why does this rescaling do the right thing? Because \\(\\sqrt{v}\\) is, roughly, the typical magnitude of that coordinate's recent gradient. Dividing the gradient by its own typical magnitude *normalizes* it — every coordinate's effective update lands in the same ballpark, regardless of whether its raw gradient was \\(0.001\\) or \\(1000\\). The steep coordinate, whose gradient is large, has a large \\(\\sqrt{v}\\), so dividing shrinks its step back to a sane size. The flat coordinate, whose gradient is tiny, has a tiny \\(\\sqrt{v}\\), so dividing *enlarges* its step. The two coordinates, which under plain GD moved at wildly different effective rates, now move in lockstep toward the minimum.

The "running" part matters as much as the squaring. RMSprop uses an *exponential* moving average — \\(v \\leftarrow \\rho v + (1-\\rho)g^2\\) — which weights recent gradients heavily and lets old ones fade. This is the cure for AdaGrad's famous flaw. AdaGrad accumulates the *sum* of all past squared gradients with no decay, so \\(v\\) only ever grows; over a long run the denominator \\(\\sqrt{v}\\) becomes enormous and every step shrinks toward zero, freezing training while the loss is still dropping. RMSprop's decaying average has no such ratchet: because old gradients are forgotten, \\(v\\) tracks the *recent* gradient scale and can shrink again if a coordinate quietens down, so the learning rate stays alive for the whole run. In the viz below, watch the two second-moment bars: the steep axis accumulates a large \\(v\\) and self-throttles, the shallow axis keeps a small \\(v\\) and accelerates, and the trajectory heads straight at the minimum instead of bouncing.`,
      },
      {
        kind: 'viz',
        component: 'RMSPropAdaptiveViz',
        heading: 'Vanilla GD zig-zag vs RMSprop on an anisotropic bowl — the bars show the running v per axis',
      },
      {
        kind: 'prose',
        heading: 'The update rule',
        body: `RMSprop keeps a per-coordinate running average of squared gradients, \\(v\\), and steps each parameter by the gradient divided by \\(\\sqrt{v}\\):

\\[
v_t \\leftarrow \\rho\\, v_{t-1} + (1-\\rho)\\, g_t^2, \\qquad
\\theta_t \\leftarrow \\theta_{t-1} - \\frac{\\eta}{\\sqrt{v_t} + \\epsilon}\\, g_t
\\]

Everything here is element-wise: \\(g_t^2\\), the division, and the update all act per coordinate. The decay \\(\\rho \\in [0,1)\\) sets the memory window — with \\(\\rho = 0.9\\) the average effectively spans the last \\(1/(1-\\rho) = 10\\) gradients, so \\(v\\) reflects the recent gradient scale rather than the whole history. The small constant \\(\\epsilon\\) (around \\(10^{-8}\\)) only guards against dividing by zero when a coordinate's gradients have been essentially nil.

Read the per-coordinate effective learning rate as \\(\\eta_{\\text{eff}} = \\eta / (\\sqrt{v_t} + \\epsilon)\\). For a coordinate whose squared gradient has averaged to \\(v\\), the typical update magnitude is \\(\\eta_{\\text{eff}} \\cdot |g| \\approx \\eta \\cdot |g| / \\sqrt{v} \\approx \\eta\\) — because \\(|g| \\approx \\sqrt{v}\\) for that coordinate, the magnitudes cancel and the effective step is roughly \\(\\eta\\) regardless of the raw gradient size. That cancellation is the normalization: RMSprop turns \\(\\eta\\) into a target *step size* rather than a multiplier on a gradient of unknown scale, which is why a single \\(\\eta\\) suddenly works across coordinates that differ by orders of magnitude.

Contrast the denominators. AdaGrad uses \\(\\sqrt{\\sum_{\\tau \\le t} g_\\tau^2}\\) — a monotonically growing sum — so its effective rate only ever decreases. RMSprop replaces that sum with the decaying average above, so the denominator can rise *and fall*. That single change converts AdaGrad's diminishing-then-frozen schedule into one that stays responsive indefinitely.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: RMSprop vs AdaGrad (the decay is the difference)',
        body: `# AdaGrad: v is an ever-growing SUM -> effective lr only shrinks, eventually freezes
v = zeros_like(theta)
for t in range(steps):
    g = grad(loss, theta)
    v = v + g * g                       # no decay: monotonically increasing
    theta = theta - eta * g / (sqrt(v) + eps)

# RMSprop: v is a decaying AVERAGE -> effective lr stays alive for the whole run
v = zeros_like(theta)
rho = 0.9
for t in range(steps):
    g = grad(loss, theta)
    v = rho * v + (1 - rho) * g * g     # forgets old gradients
    theta = theta - eta * g / (sqrt(v) + eps)

# Adam = RMSprop + momentum on the gradient (a running m) + bias correction.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: two coordinates, one rate, two effective steps',
        body: `Take the bowl \\(L = \\tfrac12(9x^2 + 0.3y^2)\\), so the gradient is \\((9x,\\, 0.3y)\\) — a steep \\(x\\) axis and a shallow \\(y\\) axis. Start at \\((1, 1)\\), \\(\\eta = 0.5\\), \\(\\rho = 0.9\\), \\(v_0 = 0\\), \\(\\epsilon\\) negligible.

Step 1 gradient is \\((9, 0.3)\\). Update the second moments: \\(v_x = 0.1 \\cdot 81 = 8.1\\), \\(v_y = 0.1 \\cdot 0.09 = 0.009\\). The effective rates diverge immediately: \\(\\eta/\\sqrt{v_x} = 0.5/2.846 \\approx 0.176\\) for \\(x\\), and \\(\\eta/\\sqrt{v_y} = 0.5/0.0949 \\approx 5.27\\) for \\(y\\) — a thirty-fold gap, automatically. The steps taken are \\(x{:}\\ 0.176 \\cdot 9 \\approx 1.58\\) and \\(y{:}\\ 5.27 \\cdot 0.3 \\approx 1.58\\). Notice they are *equal* in magnitude even though the raw gradients differed by a factor of thirty — the \\(\\sqrt{v}\\) division normalized them to the same step.

Compare plain GD on the same problem. To keep \\(x\\) stable you need \\(\\eta < 2/9 \\approx 0.22\\); push past that and the steep axis diverges. With \\(\\eta = 0.2\\), the \\(y\\) step is \\(0.2 \\cdot 0.3 = 0.06\\) — the flat axis crawls at a sixtieth of \\(x\\)'s pace, so it takes dozens of steps to close the \\(y\\) gap that RMSprop closed in one. The steep axis held the whole model hostage. RMSprop's per-coordinate denominator removes that coupling: each axis sets its own pace from its own gradient history, and both arrive at the minimum together.`,
      },
      {
        kind: 'prose',
        heading: 'Common mistakes',
        body: `**Setting \\(\\eta\\) as if it still multiplies a raw gradient.** After the \\(\\sqrt{v}\\) normalization, \\(\\eta\\) is roughly the *step size* per coordinate, not a gradient multiplier, so the good values are different — RMSprop typically wants \\(\\eta\\) around \\(10^{-3}\\), much smaller than a tuned plain-SGD rate on the same problem. *Fix:* re-tune \\(\\eta\\) from scratch when switching to RMSprop rather than porting the SGD value.

**Reaching for AdaGrad on a long training run.** AdaGrad's undecayed sum guarantees the effective rate decays to near zero, so on long runs it stalls with loss still dropping — the classic "training froze halfway" symptom. *Fix:* use RMSprop (or Adam) whose decaying \\(v\\) keeps the rate responsive; reserve AdaGrad for short, very sparse problems where its aggressive early decay is actually wanted.

**Forgetting \\(\\epsilon\\) lives *inside* the square root's neighborhood, not as a separate floor.** A coordinate that has been silent has \\(v \\approx 0\\); without \\(\\epsilon\\) the division explodes and that parameter takes a wild step the instant it first gets a gradient. *Fix:* keep \\(\\epsilon \\approx 10^{-8}\\) in the denominator \\(\\sqrt{v} + \\epsilon\\); never set it to exactly zero "to be pure."

**Assuming RMSprop fixes the *direction* of the step.** It only rescales each coordinate independently — it ignores off-diagonal curvature, so on a loss whose valley is rotated (not axis-aligned) RMSprop still zig-zags, because the diagonal \\(v\\) cannot see the coupling between coordinates. *Fix:* recognize RMSprop as a *diagonal* preconditioner; if cross-coordinate curvature dominates, you need a method that captures off-diagonal structure (K-FAC, Shampoo) or a reparameterization that axis-aligns the problem.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A coordinate has produced gradients \\(g = 4\\) on three consecutive steps. With \\(\\rho = 0.9\\) and \\(v_0 = 0\\), compute \\(v_1, v_2, v_3\\) and the effective learning rate \\(\\eta/\\sqrt{v_3}\\) for \\(\\eta = 0.01\\) (take \\(\\epsilon = 0\\)). Then state what \\(v\\) would do over the next thousand steps if this coordinate suddenly went silent (\\(g = 0\\)), and contrast that with what AdaGrad's accumulator would do over the same span. (Hint: \\(v_t = 0.9 v_{t-1} + 0.1 \\cdot 16\\); a decaying average of zeros decays toward zero, a sum of zeros holds constant.)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Hinton — Lecture 6e, "RMSprop"](https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf) — the original slides where RMSprop was proposed (never formally published as a paper).
- [Duchi, Hazan & Singer — "Adaptive Subgradient Methods"](https://www.jmlr.org/papers/v12/duchi11a.html) — AdaGrad, whose accumulation problem RMSprop fixes.
- [Ruder — "An overview of gradient descent optimization algorithms"](https://arxiv.org/abs/1609.04747) — places RMSprop, AdaGrad, and Adam in one clear lineage.`,
      },
    ],
  },
  {
    slug: 'natural-gradient',
    title: 'Natural gradient & Fisher information',
    oneLiner: 'The ordinary gradient is steepest descent with a round ruler. The natural gradient measures distance in the space of distributions, so it points where it actually matters.',
    difficulty: 'advanced',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'Steepest descent depends on how you measure distance',
        body: `"The gradient points in the direction of steepest ascent" is a half-truth, and the missing half is the whole story of the natural gradient. Steepest descent is the direction that drops the loss fastest *per unit of distance moved* — but "distance" has to be defined before "fastest" means anything. The ordinary gradient \\(\\nabla L\\) is steepest descent under **Euclidean** distance: it assumes moving parameter \\(\\theta_1\\) by \\(0.1\\) costs the same as moving \\(\\theta_2\\) by \\(0.1\\), because the ruler is round and the coordinates are treated as interchangeable units. That assumption is almost never appropriate for a model.

Consider what the parameters of a model actually *do*: they define a probability distribution over outputs. Two parameters can have the same numeric scale yet utterly different effects on that distribution — nudging one might barely change the model's predictions, while nudging the other by the same amount swings them dramatically. Measuring progress in raw parameter units treats these as equal moves when they are not. What you actually care about is how much the model's *output distribution* changes, not how far the parameter vector traveled. The right notion of distance lives in the space of distributions, and its natural metric is the **KL divergence** between the old and new distributions.

The **natural gradient** is steepest descent under that distributional metric instead of the Euclidean one. It asks: which direction drops the loss fastest per unit of *KL change* in the model's predictions? The answer rescales the ordinary gradient by the inverse of the **Fisher information matrix** — the local curvature of KL divergence. The effect is that directions which barely affect the output distribution get amplified, directions which violently affect it get damped, and the update points where it matters in *function* space rather than where it happens to point in *parameter* space.`,
      },
      {
        kind: 'prose',
        heading: 'The intuition: a ruler shaped like the model',
        body: `Picture standing on a hillside with a map, trying to walk downhill. The ordinary gradient is what you get if your map is drawn on a flat, square grid: you read off the steepest direction *on the map* and walk that way. But suppose the terrain is stretched — one map-inch east covers a mile of ground while one map-inch north covers ten feet. The steepest direction on the flat map is not the steepest direction on the actual hill; you will set off mostly along the cheap, stretched axis and make little real progress. To walk truly downhill you need a map whose distances reflect the real terrain. The natural gradient redraws the map so that distance means "how much the model's behavior changes," then takes the steepest step on *that* map.

The terrain here is the space of probability distributions the model can express, and the "stretch" is captured by the Fisher information matrix \\(F\\). \\(F\\) measures, locally, how much the output distribution moves when you wiggle the parameters: large Fisher entries mean a parameter has strong leverage on the predictions (a small wiggle moves the distribution a lot — a *steep* direction in distribution space), small Fisher entries mean weak leverage (you can move the parameter freely without changing much). The ordinary gradient ignores this entirely and treats every direction as having unit leverage. The natural gradient multiplies by \\(F^{-1}\\), which is exactly the "redraw the map" operation — it shrinks the step in high-leverage directions (so you do not overshoot the distribution) and stretches it in low-leverage ones (so you do not waste the step), producing a move that is uniform in the units that matter: KL change.

There is a second, deeper reason this is the *right* rescaling and not just a convenient one: the natural gradient is **invariant to how you parameterize the model**. Reparameterize — switch from variance to log-variance, swap one activation for an equivalent one, rescale a layer — and the ordinary gradient changes direction, because it lives in the arbitrary coordinate system you happened to choose. The natural gradient does not, because the KL divergence between two distributions does not care what symbols you used to write them down. Two practitioners using different parameterizations of the *same* model family take the *same* natural-gradient step. That invariance is the formal statement of "points where it actually matters": the update is a property of the function, not of the coordinates. In the viz, slide the anisotropy up and watch the Euclidean arrow lean further off-target toward the steep axis while the natural arrow, rescaled by the Fisher ellipse, keeps pointing straight at the minimum.`,
      },
      {
        kind: 'viz',
        component: 'NaturalGradientViz',
        heading: 'Euclidean step vs natural step on an anisotropic loss — the dashed ellipse is the local Fisher metric',
      },
      {
        kind: 'prose',
        heading: 'Fisher information and the natural-gradient update',
        body: `For a model \\(p_\\theta(x)\\), the **Fisher information matrix** is the expected outer product of the score (the gradient of the log-likelihood):

\\[
F(\\theta) = \\mathbb{E}_{x \\sim p_\\theta}\\!\\left[ \\nabla_\\theta \\log p_\\theta(x)\\, \\nabla_\\theta \\log p_\\theta(x)^\\top \\right]
\\]

\\(F\\) is symmetric positive semidefinite, and it has a clean geometric meaning: it is the second-order (Hessian) approximation of the KL divergence between nearby distributions. For a small step \\(\\Delta\\), the KL change is \\(\\mathrm{KL}(p_\\theta \\,\\|\\, p_{\\theta + \\Delta}) \\approx \\tfrac12 \\Delta^\\top F\\, \\Delta\\). So \\(F\\) is literally the metric tensor of distribution space — it converts a parameter step into the distributional distance it produces.

The natural gradient is defined by the constrained problem: drop the loss as fast as possible per unit of KL, i.e. minimize \\(\\nabla L^\\top \\Delta\\) subject to \\(\\tfrac12\\Delta^\\top F\\Delta = \\text{const}\\). Solving it gives

\\[
\\tilde\\nabla L = F^{-1}\\nabla L, \\qquad \\theta \\leftarrow \\theta - \\eta\\, F^{-1}\\nabla L.
\\]

The inverse Fisher \\(F^{-1}\\) is the rescaler. Where \\(F\\) is large (high leverage on the distribution), \\(F^{-1}\\) is small and the step is damped; where \\(F\\) is small (low leverage), \\(F^{-1}\\) is large and the step is amplified. If \\(F = I\\) — every direction has equal, unit leverage — the natural gradient *is* the ordinary gradient; the Euclidean ruler was correct only in that special isotropic case.

The structural parallel to Newton's method is worth seeing: Newton uses \\(H^{-1}\\nabla L\\) where \\(H\\) is the Hessian of the *loss*; the natural gradient uses \\(F^{-1}\\nabla L\\) where \\(F\\) is the curvature of the *KL divergence*. They coincide for some losses but differ in general, and the natural gradient has a key advantage: \\(F\\) is positive semidefinite *by construction* (it is an expected outer product), so unlike the raw Hessian it never produces an uphill step at a saddle. The catch is the same as Newton's — \\(F\\) is \\(n \\times n\\), so forming and inverting it is \\(O(n^2)\\) memory and \\(O(n^3)\\) time, hopeless at model scale, which is why practical methods (K-FAC, natural-gradient approximations in TRPO) approximate \\(F\\) with block or diagonal structure.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: natural-gradient step (exact, small-model sketch)',
        body: `# Exact natural gradient -- only feasible for small n (F is n x n).
g = grad(loss, theta)                 # ordinary gradient

# Fisher = E_x[ score score^T ] over samples from the MODEL's own distribution
F = zeros((n, n))
for x in samples_from(p_theta):       # note: model samples, not data labels
    s = grad(log_prob(x, theta), theta)   # the score vector
    F += outer(s, s)
F /= len(samples)

nat = solve(F + damp * I, g)          # F^{-1} g, with damping for stability  O(n^3)
theta = theta - eta * nat

# Scalable approximations replace the n x n solve:
#   K-FAC  -> block-diagonal Kronecker factorization of F
#   TRPO   -> conjugate-gradient solve of F x = g, never forming F`,
      },
      {
        kind: 'prose',
        heading: 'Worked: the natural step points where the gradient does not',
        body: `Take a Gaussian-output model whose loss near \\(\\theta = (\\theta_1, \\theta_2)\\) has Fisher \\(F = \\operatorname{diag}(100, 1)\\): coordinate \\(\\theta_1\\) has a hundred times the leverage on the output distribution that \\(\\theta_2\\) does. Suppose the ordinary gradient is \\(\\nabla L = (10, 10)\\) — equal raw pull on both coordinates.

The **Euclidean** step direction is just \\(-\\nabla L = (-10, -10)\\): forty-five degrees, equal movement in both coordinates. But that is wrong in distribution terms — moving \\(\\theta_1\\) by the same amount as \\(\\theta_2\\) changes the output distribution a hundred times more along the \\(\\theta_1\\) axis, so this step lurches the distribution sideways while the loss wanted balanced progress.

The **natural** step is \\(-F^{-1}\\nabla L = -\\operatorname{diag}(0.01, 1)(10, 10) = (-0.1, -10)\\). The high-leverage coordinate \\(\\theta_1\\) is damped by a factor of a hundred; the low-leverage \\(\\theta_2\\) is untouched. The step now moves almost entirely along \\(\\theta_2\\) — the direction where parameter motion is *cheap* in KL terms — and barely touches \\(\\theta_1\\), where a small parameter move would have caused a large, possibly destabilizing distributional jump. The two steps point in genuinely different directions: the Euclidean step is at \\(45°\\), the natural step is nearly along the \\(\\theta_2\\) axis. Per unit of KL change, the natural step drops the loss further, and — crucially — it would point the *same* way even if you had parameterized \\(\\theta_1\\) on a log scale, whereas the Euclidean step would have swung to a completely different angle. That is the invariance paying off.`,
      },
      {
        kind: 'prose',
        heading: 'Common mistakes',
        body: `**Estimating the Fisher from the data labels instead of the model's own samples.** The true Fisher is an expectation over \\(x \\sim p_\\theta\\) — samples drawn from the *model*. Using the empirical labels gives the *empirical Fisher*, a different matrix that can mis-rescale the step, especially early in training when the model and data distributions disagree. *Fix:* sample outputs from \\(p_\\theta\\) for the Fisher estimate, or use the Gauss–Newton/empirical-Fisher approximation knowingly, aware it is an approximation.

**Inverting \\(F\\) without damping.** \\(F\\) is positive *semi*definite, so it can be singular or near-singular (some directions have zero leverage), and \\(F^{-1}\\) then blows the step up. *Fix:* solve \\((F + \\lambda I)^{-1}\\nabla L\\) with a small damping \\(\\lambda\\) (a trust-region term); this is standard in K-FAC and TRPO and keeps the step finite when leverage vanishes.

**Forming \\(F\\) explicitly at scale.** \\(F\\) is \\(n \\times n\\); for any real model that matrix cannot be stored, let alone inverted. *Fix:* never materialize \\(F\\) — use a Kronecker-factored block approximation (K-FAC) or solve \\(F x = \\nabla L\\) with conjugate gradients using only Fisher-vector products (the approach TRPO takes), both of which avoid the \\(n \\times n\\) object entirely.

**Assuming the natural gradient is always worth its cost.** The invariance and conditioning benefits are real, but the per-step overhead of any Fisher approximation is large, and for many problems a cheap diagonal method (Adam) recovers most of the per-coordinate rescaling at a fraction of the cost. *Fix:* reach for natural-gradient methods where the payoff is established — policy optimization (TRPO/natural policy gradient), some second-order training research — and default to Adam elsewhere; do not pay for \\(F^{-1}\\) unless the problem rewards it.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `A model has Fisher \\(F = \\operatorname{diag}(25, 4)\\) at the current point and ordinary gradient \\(\\nabla L = (5, 2)\\). Compute the Euclidean descent direction \\(-\\nabla L\\) and the natural descent direction \\(-F^{-1}\\nabla L\\). By what factor is the first coordinate's step reduced relative to the second when you switch from Euclidean to natural? Then state, in one sentence, what the fact that \\(F\\) is diagonal here tells you about the coupling between the two parameters' effects on the output distribution. (Hint: \\(F^{-1} = \\operatorname{diag}(1/25, 1/4)\\).)`,
      },
      {
        kind: 'prose',
        heading: 'Further reading',
        body: `- [Amari — "Natural Gradient Works Efficiently in Learning"](https://ieeexplore.ieee.org/document/6790500) — the foundational paper introducing natural gradient and its parameterization invariance.
- [Martens — "New Insights and Perspectives on the Natural Gradient Method"](https://arxiv.org/abs/1412.1193) — the modern reference connecting natural gradient, Fisher, and Gauss–Newton.
- [Schulman et al. — "Trust Region Policy Optimization"](https://arxiv.org/abs/1502.05477) — natural gradient made scalable for reinforcement learning via Fisher-vector products.`,
      },
    ],
  },
];
