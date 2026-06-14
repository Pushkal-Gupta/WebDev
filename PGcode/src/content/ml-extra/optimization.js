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
];
