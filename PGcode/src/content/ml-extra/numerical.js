export const NUMERICAL_EXTRA = [
  {
    slug: 'condition-number',
    title: 'Condition number',
    oneLiner: 'How much a small wobble in the input can blow up in the output. The single number that predicts when a linear solve will betray you.',
    difficulty: 'intermediate',
    readMinutes: 10,
    sections: [
      {
        kind: 'prose',
        heading: 'Sensitivity, before any formula',
        body: `Suppose you solve a system \\(A x = b\\) and get an answer \\(x\\). Now nudge the right-hand side by a hair — measurement noise, rounding, a sensor that drifted in the last digit — so you really solve \\(A x' = b + \\delta b\\). The question that decides whether your answer means anything is: how big is \\(x' - x\\) compared to how big \\(\\delta b\\) was? If a one-part-in-a-million wobble in \\(b\\) moves \\(x\\) by one part in a million, the problem is **well-conditioned** and your answer is trustworthy. If that same tiny wobble moves \\(x\\) by ten percent, the problem is **ill-conditioned** and your answer is mostly noise dressed up as a number.

The **condition number** \\(\\kappa(A)\\) is exactly the worst-case amplification factor of that wobble. It is a property of the matrix \\(A\\) alone — it does not depend on \\(b\\), on your algorithm, or on the floating-point format. It tells you, before you compute anything, the largest factor by which a relative error in the input can grow into a relative error in the output. A condition number of \\(1\\) means perfect: errors pass through unmagnified. A condition number of \\(10^6\\) means you can lose six decimal digits of accuracy purely from the geometry of the problem, no matter how careful your solver is.

This separation matters because it splits "my answer is wrong" into two completely different diagnoses. Either the **algorithm** is unstable (a fixable bug — pick a better method), or the **problem** is ill-conditioned (not fixable by any algorithm — the information simply is not there). The condition number is how you tell which one you are looking at.`,
      },
      {
        kind: 'math',
        heading: 'The definition',
        body: `For an invertible matrix \\(A\\), the condition number with respect to a norm is

\\[
\\kappa(A) = \\lVert A \\rVert \\cdot \\lVert A^{-1} \\rVert
\\]

In the \\(2\\)-norm this reduces to a ratio of singular values:

\\[
\\kappa_2(A) = \\frac{\\sigma_{\\max}(A)}{\\sigma_{\\min}(A)}
\\]

where \\(\\sigma_{\\max}\\) and \\(\\sigma_{\\min}\\) are the largest and smallest singular values. For a symmetric positive-definite matrix the singular values equal the eigenvalues, so \\(\\kappa_2(A) = \\lambda_{\\max} / \\lambda_{\\min}\\).

The key bound it produces: if \\(A x = b\\) and \\(A(x + \\delta x) = b + \\delta b\\), then

\\[
\\frac{\\lVert \\delta x \\rVert}{\\lVert x \\rVert} \\;\\le\\; \\kappa(A)\\,\\frac{\\lVert \\delta b \\rVert}{\\lVert b \\rVert}
\\]

Relative output error is at most \\(\\kappa(A)\\) times relative input error. That single inequality is the whole reason the number is worth computing.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: a 2×2 that lies to you',
        body: `Take the matrix

\\[
A = \\begin{pmatrix} 1 & 1 \\\\ 1 & 1.0001 \\end{pmatrix}
\\]

The two rows are *almost* parallel — geometrically, the two lines \\(x_1 + x_2 = b_1\\) and \\(x_1 + 1.0001 x_2 = b_2\\) cross at a very shallow angle, so the intersection point slides a long way when you barely move either line. That shallow angle is ill-conditioning, made visible.

Solve \\(A x = b\\) with \\(b = (2, 2)\\). The exact answer is \\(x = (2, 0)\\). Now perturb to \\(b = (2, 2.0001)\\) — a change of one part in twenty thousand in the second entry. The new solution is \\(x = (1, 1)\\). The input moved by \\(0.005\\%\\); the output moved by a full unit in each coordinate — roughly \\(70\\%\\) in relative norm. The amplification is about \\(14{,}000\\times\\).

Check it against \\(\\kappa\\). The singular values of \\(A\\) are approximately \\(\\sigma_{\\max} \\approx 2.0\\) and \\(\\sigma_{\\min} \\approx 0.00005\\), giving \\(\\kappa_2(A) \\approx 40{,}000\\). Our observed amplification of \\(14{,}000\\) sits comfortably under that worst-case ceiling, exactly as the inequality promises. The matrix did not malfunction and neither did the solver — the problem itself converts a rounding-level wobble in \\(b\\) into a wrong answer, and \\(\\kappa\\) told us to expect roughly four lost digits before we ran anything.`,
      },
      {
        kind: 'prose',
        heading: 'The rule of thumb every numericist carries',
        body: `If \\(\\kappa(A) \\approx 10^k\\), expect to lose about \\(k\\) decimal digits of accuracy in the solution, on top of whatever your algorithm loses. Double-precision floating point gives you roughly \\(16\\) significant decimal digits to start with. So a condition number of \\(10^8\\) leaves you about \\(8\\) trustworthy digits; a condition number of \\(10^{16}\\) leaves you essentially none — the answer is numerically indistinguishable from noise.

This is why \\(\\kappa\\) is the first thing to check when a linear solve, a least-squares fit, or a Newton step produces a suspicious answer. \\(\\texttt{numpy.linalg.cond(A)}\\) costs one SVD and tells you immediately whether the problem is salvageable. A value near \\(1\\) to \\(10^3\\) is healthy; \\(10^6\\) to \\(10^{10}\\) means proceed with caution and watch your digits; anything past \\(10^{12}\\) in double precision means the problem as posed cannot be solved accurately and you must reformulate — rescale the variables, drop a near-redundant column, add regularization, or switch to a higher-precision arithmetic.

Condition number also explains why optimization slows to a crawl on stretched bowls. Gradient descent on a quadratic with Hessian \\(H\\) needs a number of iterations that scales linearly with \\(\\kappa(H)\\): the same ratio of largest to smallest curvature that makes a linear solve lose digits makes an optimizer zig-zag down a narrow valley. The condition number is one idea wearing two hats — numerical accuracy in a solve, convergence speed in an optimizer.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Measuring and feeling the condition number',
        body: `import numpy as np

A = np.array([[1.0, 1.0],
              [1.0, 1.0001]])

print("condition number:", np.linalg.cond(A))   # ~ 4.0e4

b  = np.array([2.0, 2.0])
bp = np.array([2.0, 2.0001])       # 0.005% change in one entry

x  = np.linalg.solve(A, b)
xp = np.linalg.solve(A, bp)

rel_in  = np.linalg.norm(bp - b) / np.linalg.norm(b)
rel_out = np.linalg.norm(xp - x) / np.linalg.norm(x)

print("x      =", x)               # [2. 0.]
print("x'     =", xp)              # [1. 1.]
print("relative input  error:", rel_in)    # ~ 3.5e-5
print("relative output error:", rel_out)    # ~ 0.7
print("amplification:", rel_out / rel_in)   # ~ 1.4e4  (below kappa)

# The amplification stays under kappa(A). No solver can do better:
# the lost digits are a property of A, not of np.linalg.solve.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: blaming the solver for an ill-conditioned problem.** When a least-squares fit returns wild coefficients, the instinct is to swap algorithms — try a different decomposition, bump the precision, add iterations. None of that helps if \\(\\kappa\\) is \\(10^{14}\\): the information needed to pin down the answer is not in the data. The fix lives at the *problem* level — center and scale your features so columns have comparable magnitude (this alone can drop \\(\\kappa\\) by many orders), remove a near-duplicate column, or add ridge regularization \\(\\lambda I\\) which replaces \\(\\sigma_{\\min}\\) with \\(\\sigma_{\\min} + \\lambda\\) and directly caps the condition number. Always compute \\(\\kappa\\) *before* you start debugging the solver.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Consider the diagonal matrix \\(A = \\operatorname{diag}(1000,\\ 1,\\ 0.001)\\). (1) Write down \\(\\kappa_2(A)\\) directly from the entries — for a diagonal matrix the singular values are the absolute values of the diagonal. (2) Roughly how many decimal digits of accuracy would you expect to lose solving \\(A x = b\\) in double precision? (3) You rescale each row by dividing by its diagonal entry, turning \\(A\\) into the identity. What is \\(\\kappa\\) now, and what does this tell you about why feature scaling matters before fitting a linear model? (4) Does rescaling change the *true* solution \\(x\\), or only the conditioning of the computation? Explain in one sentence.`,
      },
      {
        kind: 'prose',
        heading: 'What to take away',
        body: `The condition number is the amplification factor from input error to output error, equal to \\(\\sigma_{\\max} / \\sigma_{\\min}\\) in the \\(2\\)-norm. A value of \\(10^k\\) costs you about \\(k\\) decimal digits. It is a property of the problem, not the algorithm, so it separates "use a better method" from "this cannot be solved as posed." Reach for it first whenever a solve, a fit, or an optimizer behaves worse than the math says it should — one SVD tells you whether to debug your code or reformulate your problem.`,
      },
    ],
  },
  {
    slug: 'iterative-solvers',
    title: 'Iterative solvers',
    oneLiner: 'Stop trying to invert the matrix. Guess, measure the error, correct, repeat — until the residual is small enough to stop caring.',
    difficulty: 'intermediate',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'Why not just invert the matrix',
        body: `To solve \\(A x = b\\) you were taught to compute \\(x = A^{-1} b\\), or more honestly to run Gaussian elimination. Both are **direct** methods: a fixed sequence of arithmetic that lands on the exact answer (up to rounding) in a known number of operations. For an \\(n \\times n\\) matrix that count is about \\(n^3 / 3\\) operations and \\(n^2\\) numbers of storage. At \\(n = 1000\\) that is fine. At \\(n = 10^7\\) — the size of a finite-element mesh, a recommendation graph, or a discretized PDE — \\(n^3\\) is \\(10^{21}\\) operations and \\(n^2\\) is \\(10^{14}\\) numbers. Both are absurd.

The escape is that large systems are almost never dense. A matrix from a physical problem is **sparse**: each row has a handful of nonzeros because each unknown couples to only its neighbors. Direct elimination destroys that sparsity — it *fills in* zeros as it works, ballooning storage. **Iterative** methods never touch the matrix as a whole. They only ever ask the matrix one question: "given a vector \\(v\\), what is \\(A v\\)?" For a sparse matrix that matrix-vector product costs only as many operations as there are nonzeros, so a single iteration is cheap, and you do as many iterations as you need to reach the accuracy you want.

That is the whole trade. Direct methods give you the exact answer at a fixed, often unaffordable cost. Iterative methods give you an *approximate* answer whose accuracy you dial up by spending more iterations, at a per-iteration cost set by the sparsity. For huge structured problems iterative wins outright; for small dense ones direct is simpler and you should use it.`,
      },
      {
        kind: 'prose',
        heading: 'The splitting idea behind Jacobi and Gauss–Seidel',
        body: `The simplest iterative methods come from a trick called **matrix splitting**. Write \\(A = M - N\\) where \\(M\\) is something easy to invert. Then \\(A x = b\\) becomes \\(M x = N x + b\\), which suggests the iteration

\\[
M x^{(k+1)} = N x^{(k)} + b
\\]

Start from any guess \\(x^{(0)}\\), plug it into the right side, solve the easy system on the left to get \\(x^{(1)}\\), and repeat. If the iteration converges, the limit satisfies \\(M x = N x + b\\), i.e. \\(A x = b\\) — the right answer.

**Jacobi** picks \\(M = D\\), the diagonal of \\(A\\). Inverting a diagonal is just dividing by each diagonal entry, so each step is: for every equation, solve for its own variable assuming all the others are frozen at last iteration's values. **Gauss–Seidel** picks \\(M\\) as the lower-triangular part of \\(A\\), which means it reuses each updated value *immediately* within the same sweep instead of waiting for the next one. Gauss–Seidel typically converges about twice as fast as Jacobi for the same problem, for free, because it propagates information across the unknowns within a single pass.

Both converge when \\(A\\) is **diagonally dominant** — each diagonal entry larger in magnitude than the sum of the other entries in its row — or symmetric positive-definite. That condition is exactly what physical problems tend to satisfy, which is why these methods, despite being the oldest in the book, still run inside production solvers as smoothers and preconditioners.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: three Jacobi sweeps by hand',
        body: `Solve the \\(2 \\times 2\\) system

\\[
\\begin{pmatrix} 4 & 1 \\\\ 1 & 3 \\end{pmatrix}
\\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix}
=
\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}
\\]

The matrix is diagonally dominant (\\(4 > 1\\) and \\(3 > 1\\)), so Jacobi will converge. The exact answer is \\(x_1 = 1/11 \\approx 0.0909\\), \\(x_2 = 7/11 \\approx 0.6364\\).

The Jacobi update solves each equation for its own variable:

\\[
x_1^{(k+1)} = \\frac{1 - x_2^{(k)}}{4}, \\qquad x_2^{(k+1)} = \\frac{2 - x_1^{(k)}}{3}
\\]

Start at \\(x^{(0)} = (0, 0)\\):

- Sweep 1: \\(x_1 = (1 - 0)/4 = 0.25\\), \\(x_2 = (2 - 0)/3 = 0.6667\\).
- Sweep 2: \\(x_1 = (1 - 0.6667)/4 = 0.0833\\), \\(x_2 = (2 - 0.25)/3 = 0.5833\\).
- Sweep 3: \\(x_1 = (1 - 0.5833)/4 = 0.1042\\), \\(x_2 = (2 - 0.0833)/3 = 0.6389\\).
- Sweep 4: \\(x_1 = (1 - 0.6389)/4 = 0.0903\\), \\(x_2 = (2 - 0.1042)/3 = 0.6319\\).

After four sweeps \\(x \\approx (0.090, 0.632)\\) against the true \\((0.091, 0.636)\\) — three-decimal accuracy from arithmetic a child could do, no matrix inversion anywhere. Each sweep shrinks the error by roughly the same constant factor (here about \\(0.14\\) per sweep), which is the hallmark of linear convergence: the number of correct digits grows linearly with the number of sweeps.`,
      },
      {
        kind: 'prose',
        heading: 'Conjugate gradient — the one that actually scales',
        body: `Jacobi and Gauss–Seidel are easy to understand but slow: their convergence rate degrades as the condition number grows, and on a stiff problem they can crawl. The workhorse for symmetric positive-definite systems is **conjugate gradient (CG)**, a Krylov-subspace method that is dramatically smarter about which direction to step.

CG reframes solving \\(A x = b\\) as *minimizing* the quadratic \\(f(x) = \\tfrac{1}{2} x^\\top A x - b^\\top x\\), whose gradient is \\(\\nabla f = A x - b\\), the negative **residual**. So the minimizer of \\(f\\) is exactly the solution of the linear system. CG descends this bowl, but instead of steepest descent — which zig-zags badly on stretched bowls, as the condition-number lesson showed — it picks search directions that are *conjugate* with respect to \\(A\\): each new direction does not undo progress made along previous ones. The payoff is that on an \\(n \\times n\\) system CG reaches the exact answer in at most \\(n\\) steps in exact arithmetic, and in practice gets close in far fewer.

The convergence rate depends on the square root of the condition number — CG needs about \\(\\sqrt{\\kappa(A)}\\) iterations to a fixed accuracy, versus \\(\\kappa(A)\\) for steepest descent. That square root is enormous in practice: a condition number of \\(10^6\\) means roughly a thousand CG iterations instead of a million steepest-descent steps. Wrapping a **preconditioner** \\(M \\approx A\\) around CG (solving \\(M^{-1} A x = M^{-1} b\\) instead) shrinks the effective condition number further and is what makes CG fast on real problems. Every entry to CG is one matrix-vector product, so the per-iteration cost stays proportional to the number of nonzeros.`,
      },
      {
        kind: 'ascii',
        heading: 'Pseudo-code: conjugate gradient',
        body: `def conjugate_gradient(A, b, x0, tol=1e-8, max_iter=1000):
    x = x0
    r = b - A @ x          # residual = how wrong we are
    p = r.copy()           # first search direction
    rs_old = r @ r
    for k in range(max_iter):
        Ap    = A @ p              # the only matrix touch per step
        alpha = rs_old / (p @ Ap)  # optimal step along p
        x     = x + alpha * p
        r     = r - alpha * Ap     # update residual cheaply
        rs_new = r @ r
        if sqrt(rs_new) < tol:     # residual small enough -> stop
            break
        beta = rs_new / rs_old     # conjugacy correction
        p    = r + beta * p        # next direction, A-conjugate to all prior
        rs_old = rs_new
    return x`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: stopping on the step size instead of the residual.** The honest convergence test is the **residual** \\(\\lVert b - A x \\rVert\\) — how much the current guess violates the actual equations — usually checked relative to \\(\\lVert b \\rVert\\). A tempting shortcut is to stop when the *update* \\(\\lVert x^{(k+1)} - x^{(k)} \\rVert\\) gets small, but on an ill-conditioned problem the iterate can crawl in tiny steps while still being far from the solution, so a small step does not imply a small error. Worse, on a non-convergent split the step can shrink while the residual stays large or grows. Always gate on the relative residual, and always cap the iteration count so a non-converging run terminates instead of spinning forever.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Take the diagonally dominant system \\(\\begin{pmatrix} 3 & 1 \\\\ 1 & 2 \\end{pmatrix} x = \\begin{pmatrix} 5 \\\\ 5 \\end{pmatrix}\\), whose exact solution is \\(x = (1, 2)\\). (1) Write the Jacobi update equations \\(x_1^{(k+1)} = \\dots\\) and \\(x_2^{(k+1)} = \\dots\\). (2) Starting from \\(x^{(0)} = (0, 0)\\), compute two Jacobi sweeps by hand and report the residual \\(\\lVert b - A x^{(2)} \\rVert\\). (3) Now do one Gauss–Seidel sweep from \\((0,0)\\): update \\(x_1\\) first, then immediately use that new \\(x_1\\) when updating \\(x_2\\). Is the result closer to \\((1, 2)\\) than the first Jacobi sweep was? (4) In one sentence, explain why Gauss–Seidel pulled ahead.`,
      },
      {
        kind: 'prose',
        heading: 'What to take away',
        body: `Iterative solvers replace "invert the matrix once at \\(O(n^3)\\)" with "multiply by the matrix many times at the cost of its nonzeros." Jacobi and Gauss–Seidel come from splitting \\(A = M - N\\) and converge for diagonally dominant or SPD systems; Gauss–Seidel reuses fresh values and beats Jacobi for free. Conjugate gradient is the scalable choice for SPD systems, converging in about \\(\\sqrt{\\kappa}\\) iterations by stepping along \\(A\\)-conjugate directions, and gets faster still with a preconditioner. Stop on the relative residual, never on the step size, and always cap the iteration count.`,
      },
    ],
  },
  {
    slug: 'automatic-differentiation',
    title: 'Automatic differentiation',
    oneLiner: 'Not symbolic, not finite differences — the third way that gives exact gradients of any program at the cost of a constant factor over evaluating it.',
    difficulty: 'intermediate',
    readMinutes: 11,
    sections: [
      {
        kind: 'prose',
        heading: 'Three ways to get a derivative, and why two of them are bad',
        body: `Backpropagation is automatic differentiation, and automatic differentiation is neither of the two methods you would reach for by instinct. It is worth seeing why both instincts fail before meeting the thing that works.

The first instinct is **symbolic differentiation** — the algebra you did by hand, the thing Mathematica does: apply the chain rule and product rule to a formula and get a new formula for the derivative. It is exact, but it suffers **expression swell**: differentiating a deeply nested function produces an output formula that is exponentially larger than the input. A neural network is a composition of millions of operations; its symbolic derivative would be a formula too large to store, let alone evaluate.

The second instinct is **finite differences** — approximate \\(f'(x)\\) by \\(\\frac{f(x + h) - f(x)}{h}\\) for some tiny \\(h\\). Simple, works on any black-box function, and *wrong* in two ways at once. Pick \\(h\\) too large and the approximation error dominates; pick \\(h\\) too small and catastrophic cancellation in the subtraction \\(f(x+h) - f(x)\\) destroys your significant digits (the floating-point lesson's nightmare). There is no good \\(h\\), only a least-bad one, and even that gives you a handful of correct digits. Worse, computing the gradient of a function with \\(n\\) inputs needs \\(n + 1\\) function evaluations — hopeless when \\(n\\) is a billion.

**Automatic differentiation (AD)** is the third way. It is exact to machine precision like symbolic, applies to any program like finite differences, and computes the full gradient at a cost of a small constant times one function evaluation regardless of how many inputs there are. That last property is the entire reason deep learning is feasible.`,
      },
      {
        kind: 'prose',
        heading: 'The key insight: a program is a composition',
        body: `Any numerical program — no matter how many branches, loops, and function calls — ultimately reduces to a sequence of elementary operations: add, multiply, \\(\\exp\\), \\(\\sin\\), and so on. Each elementary operation has a derivative you already know. AD's insight is that you never need the symbolic derivative of the *whole* program; you only need the local derivative of each elementary step, and then you stitch them together with the chain rule numerically as you go.

Picture the program as a **computational graph**: nodes are intermediate values, edges carry one value into the next operation. Evaluating the program is a forward sweep through this graph. AD attaches, to each edge, the *local* derivative of the operation it feeds — a single number computed at the current point. The chain rule then says the derivative of the output with respect to any input is the product of local derivatives along the path connecting them, summed over all paths. AD is nothing more than bookkeeping that computes those products and sums efficiently.

There are two directions to sweep. **Forward mode** propagates derivatives from inputs to output alongside the values, answering "how does the output change as I wiggle *this one input*." **Reverse mode** — backpropagation — does a forward pass to record all the values, then sweeps backward from the output, answering "how does the output change as I wiggle *every input*," all in one backward sweep. For a function with many inputs and one output — exactly a neural network and its scalar loss — reverse mode computes the entire gradient in a single backward pass. That asymmetry is why training uses reverse mode.`,
      },
      {
        kind: 'math',
        heading: 'Dual numbers — forward mode in one object',
        body: `Forward-mode AD has a beautiful implementation: **dual numbers**. Extend each real number \\(a\\) into a pair \\(a + b\\,\\varepsilon\\) where \\(\\varepsilon\\) is a formal symbol with \\(\\varepsilon^2 = 0\\). The first component carries the value, the second carries the derivative. Arithmetic on dual numbers automatically applies the differentiation rules:

\\[
(a + b\\varepsilon) + (c + d\\varepsilon) = (a + c) + (b + d)\\varepsilon
\\]

\\[
(a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon
\\]

The \\(\\varepsilon\\) coefficient of the product is \\(ad + bc\\) — exactly the product rule. For any elementary function, \\(f(a + b\\varepsilon) = f(a) + b\\,f'(a)\\,\\varepsilon\\), which is the chain rule. So to differentiate \\(f\\) at \\(x\\), evaluate \\(f\\) on the dual number \\(x + 1\\cdot\\varepsilon\\) using overloaded arithmetic; the value falls out in the real part and \\(f'(x)\\) falls out in the \\(\\varepsilon\\) part, exact and free. No formula manipulation, no step size.`,
      },
      {
        kind: 'prose',
        heading: 'Worked: reverse mode on f(x, y) = x·y + sin(x)',
        body: `Differentiate \\(f(x, y) = x y + \\sin(x)\\) at \\(x = 2, y = 3\\) by reverse mode, by hand. The true gradient is \\(\\partial f/\\partial x = y + \\cos(x)\\) and \\(\\partial f/\\partial y = x\\), so at \\((2, 3)\\) it is \\((3 + \\cos 2,\\ 2) \\approx (2.584,\\ 2)\\).

**Forward pass** — compute and record each intermediate:

- \\(v_1 = x = 2\\), \\(v_2 = y = 3\\).
- \\(v_3 = v_1 \\cdot v_2 = 6\\).
- \\(v_4 = \\sin(v_1) = \\sin 2 \\approx 0.909\\).
- \\(v_5 = v_3 + v_4 \\approx 6.909 = f\\).

**Backward pass** — propagate the adjoint \\(\\bar v = \\partial f / \\partial v\\), starting from \\(\\bar v_5 = 1\\):

- \\(v_5 = v_3 + v_4\\): the sum sends its adjoint to both parents, so \\(\\bar v_3 = 1\\), \\(\\bar v_4 = 1\\).
- \\(v_4 = \\sin(v_1)\\): local derivative \\(\\cos(v_1)\\), so \\(\\bar v_1 \\mathrel{+}= \\bar v_4 \\cos(2) \\approx 1 \\cdot (-0.416) = -0.416\\).
- \\(v_3 = v_1 v_2\\): local derivatives are \\(v_2\\) and \\(v_1\\), so \\(\\bar v_1 \\mathrel{+}= \\bar v_3 \\cdot v_2 = 1 \\cdot 3 = 3\\) and \\(\\bar v_2 \\mathrel{+}= \\bar v_3 \\cdot v_1 = 1 \\cdot 2 = 2\\).

Collect: \\(\\bar v_1 = -0.416 + 3 = 2.584\\) and \\(\\bar v_2 = 2\\). That is \\((\\partial f/\\partial x, \\partial f/\\partial y) = (2.584, 2)\\), matching the hand calculus exactly. Notice \\(\\bar v_1\\) accumulated contributions from *two* paths — through \\(\\sin\\) and through the product — which is the chain rule's sum-over-paths showing up as an accumulating \\(\\mathrel{+}=\\) on the adjoint.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'A 30-line reverse-mode engine',
        body: `import math

class Var:
    def __init__(self, value, parents=()):
        self.value = value
        self.grad  = 0.0
        self._parents = parents        # list of (parent_var, local_derivative)

    def __add__(self, o):
        return Var(self.value + o.value, [(self, 1.0), (o, 1.0)])

    def __mul__(self, o):
        return Var(self.value * o.value, [(self, o.value), (o, self.value)])

    def sin(self):
        return Var(math.sin(self.value), [(self, math.cos(self.value))])

    def backward(self, seed=1.0):
        self.grad += seed
        for parent, local in self._parents:
            parent.backward(seed * local)   # chain rule: multiply, accumulate

x = Var(2.0)
y = Var(3.0)
f = x * y + x.sin()        # f = x*y + sin(x)
f.backward()

print("f      =", f.value)   # 6.909
print("df/dx  =", x.grad)    # 2.584  == 3 + cos(2)
print("df/dy  =", y.grad)    # 2.0
# Same machinery, scaled to millions of Vars, is what PyTorch autograd does.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: confusing AD with finite differences.** A surprising number of people believe frameworks like PyTorch compute gradients by nudging each parameter and re-running the forward pass — finite differences. They do not. AD is **exact** (no \\(h\\), no truncation error, no cancellation) and costs a *constant* multiple of one forward pass for the *whole* gradient, while finite differences would cost one extra forward pass *per parameter* and still be approximate. If you ever find yourself reaching for \\(\\frac{f(x+h) - f(x)}{h}\\) to check a gradient, that is fine as a unit test (gradient checking with a well-chosen \\(h \\approx 10^{-5}\\)), but never as the production path — and never assume the framework is doing it for you.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `Let \\(f(x) = (x + 1)(x + 2)\\) and differentiate at \\(x = 3\\) using **dual numbers**. (1) Form the dual input \\(3 + 1\\varepsilon\\). (2) Compute \\((3 + 1\\varepsilon) + 1 = 4 + 1\\varepsilon\\) and \\((3 + 1\\varepsilon) + 2 = 5 + 1\\varepsilon\\). (3) Multiply the two duals using the rule \\((a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon\\) and read off the value in the real part and \\(f'(3)\\) in the \\(\\varepsilon\\) part. (4) Verify against the calculus: \\(f'(x) = 2x + 3\\). (5) In one sentence, explain why this required no step size \\(h\\) and lost no precision, unlike a finite-difference estimate.`,
      },
      {
        kind: 'prose',
        heading: 'What to take away',
        body: `Automatic differentiation is the exact, scalable third way between symbolic differentiation (exact but explodes in size) and finite differences (general but approximate and expensive). It works because every program is a composition of elementary operations with known local derivatives, stitched by the chain rule numerically. Forward mode (dual numbers) is cheap when there are few inputs; reverse mode (backpropagation) computes the full gradient of a many-input, single-output function in one backward pass, which is exactly what training a neural network needs. It is not finite differences, and it is the reason gradient-based learning scales to billions of parameters.`,
      },
    ],
  },
  {
    slug: 'monte-carlo-integration',
    title: 'Monte Carlo integration',
    oneLiner: 'When the integral has no formula and the dimension is too high to grid, throw random darts and average. Error falls like 1/√N regardless of dimension.',
    difficulty: 'intermediate',
    readMinutes: 10,
    sections: [
      {
        kind: 'prose',
        heading: 'Integration as an average',
        body: `Most integrals that matter in machine learning have no closed form and live in dimensions far too high to grid. An expectation over a posterior, the normalizing constant of a probability model, the expected reward of a policy — each is an integral \\(\\int f(x)\\,dx\\) you cannot solve by hand and cannot tile with a grid, because a grid of just \\(10\\) points per axis in \\(20\\) dimensions is \\(10^{20}\\) points. That exponential blowup is the **curse of dimensionality**, and it kills every deterministic quadrature rule the moment the dimension climbs.

Monte Carlo integration sidesteps the curse with one reframing: **an integral is an average in disguise.** The integral of \\(f\\) over a region of volume \\(V\\) equals \\(V\\) times the *average value* of \\(f\\) over that region. And you can estimate an average the way you estimate any average — sample points at random and take the mean. Throw \\(N\\) random darts into the region, evaluate \\(f\\) at each, average the results, multiply by the volume. That is the whole method.

The magic is in how the error behaves. A deterministic grid in \\(d\\) dimensions needs \\(N\\) points to achieve error \\(\\sim N^{-1/d}\\) — useless for large \\(d\\). Monte Carlo's error falls like \\(1/\\sqrt{N}\\) **regardless of dimension**. The \\(d\\) has vanished from the exponent. In one dimension that is worse than a good grid; in fifty dimensions it is the only thing that works at all. Monte Carlo trades a slow-but-dimension-blind convergence rate for the ability to function where everything else has died.`,
      },
      {
        kind: 'math',
        heading: 'The estimator and its error',
        body: `To estimate \\(I = \\int_\\Omega f(x)\\,dx\\) over a region \\(\\Omega\\) of volume \\(V\\), draw \\(N\\) points \\(x_1, \\dots, x_N\\) uniformly from \\(\\Omega\\) and form

\\[
\\hat I_N = V \\cdot \\frac{1}{N} \\sum_{i=1}^{N} f(x_i)
\\]

This estimator is **unbiased**: its expected value is exactly \\(I\\), for any \\(N\\). Its error is governed by the variance. By the central limit theorem the standard error is

\\[
\\operatorname{SE}(\\hat I_N) = \\frac{V \\sigma_f}{\\sqrt{N}}
\\]

where \\(\\sigma_f\\) is the standard deviation of \\(f\\) over \\(\\Omega\\). Two consequences fall straight out. First, the error shrinks as \\(1/\\sqrt{N}\\) — to halve the error you must *quadruple* the samples, and the exponent never involves the dimension \\(d\\). Second, the error is proportional to \\(\\sigma_f\\): the more \\(f\\) varies across the region, the noisier the estimate. That second fact is the entire motivation for variance-reduction tricks like importance sampling, which reshape *where* you sample so that \\(\\sigma_f\\) effectively drops without changing \\(N\\).`,
      },
      {
        kind: 'prose',
        heading: 'Worked: estimating π by throwing darts',
        body: `The canonical demonstration. Inscribe a quarter circle of radius \\(1\\) inside the unit square \\([0,1] \\times [0,1]\\). The square has area \\(1\\); the quarter circle has area \\(\\pi/4 \\approx 0.7854\\). So the fraction of the square covered by the quarter circle is \\(\\pi/4\\). If you scatter random points uniformly in the square and count what fraction land inside the circle (\\(x^2 + y^2 \\le 1\\)), that fraction estimates \\(\\pi/4\\), and four times it estimates \\(\\pi\\).

Walk a tiny run by hand. Throw ten points and suppose eight land inside the circle. The estimate is \\(\\hat\\pi = 4 \\cdot 8/10 = 3.2\\) — in the right neighborhood from ten darts, but crude. The standard error here is large because \\(N\\) is tiny.

Now feel the \\(1/\\sqrt{N}\\) law concretely. With \\(N = 100\\) the typical error is around \\(\\pm 0.16\\); to cut that to \\(\\pm 0.016\\) you do not need \\(10\\times\\) more darts, you need \\(100\\times\\) — ten thousand darts — because error scales with \\(1/\\sqrt{N}\\) and \\(\\sqrt{100} = 10\\). Push to a million darts and you expect roughly \\(\\pm 0.0016\\), about three correct digits. The slow grind toward accuracy — every extra digit costs \\(100\\times\\) the work — is the price of dimension-independence. For estimating \\(\\pi\\) in two dimensions that price is silly; a grid would crush it. The method earns its keep only when the dimension makes grids impossible, and then this same slow rate is the best rate available.`,
      },
      {
        kind: 'code',
        language: 'python',
        heading: 'Monte Carlo π, and watching the error fall',
        body: `import numpy as np

def estimate_pi(N, rng):
    pts = rng.random((N, 2))            # N points uniform in [0,1]^2
    inside = (pts[:, 0]**2 + pts[:, 1]**2) <= 1.0
    return 4.0 * inside.mean()           # fraction inside * 4

rng = np.random.default_rng(0)
for N in [100, 10_000, 1_000_000]:
    est = estimate_pi(N, rng)
    err = abs(est - np.pi)
    print(f"N={N:>9}  est={est:.5f}  error={err:.5f}")

# typical output -- error falls roughly like 1/sqrt(N):
#   N=      100  est=3.16000  error=0.01841
#   N=    10000  est=3.13760  error=0.00399
#   N=  1000000  est=3.14117  error=0.00043
# 100x more samples -> about 10x less error, exactly the sqrt law.`,
      },
      {
        kind: 'prose',
        heading: 'Variance reduction: the real game',
        body: `Because the error is \\(V\\sigma_f / \\sqrt{N}\\), there are two levers: raise \\(N\\) (brute force, expensive) or lower \\(\\sigma_f\\) (clever, free per-sample). Variance reduction works the second lever and is where practical Monte Carlo lives.

**Importance sampling** is the headline technique. Instead of sampling uniformly, sample from a distribution \\(q(x)\\) that concentrates points where \\(\\lvert f \\rvert\\) is large, then reweight each sample by \\(f(x)/q(x)\\) to keep the estimator unbiased. If \\(q\\) is shaped like \\(\\lvert f \\rvert\\), the reweighted samples have nearly constant value, \\(\\sigma_f\\) collapses, and you reach the same accuracy with orders of magnitude fewer samples. This is exactly how rare-event probabilities and high-dimensional Bayesian expectations get estimated in practice — and it is why a careless choice of sampling distribution can *increase* variance if \\(q\\) puts little mass where \\(f\\) is large.

Other standard levers: **stratified sampling** (split the region into cells and sample each, killing the variance from coarse imbalance), **control variates** (subtract a correlated function whose integral you know, then add it back), and **antithetic variates** (pair each sample with its mirror so their errors partly cancel). All four leave the estimate unbiased and only shrink \\(\\sigma_f\\). For high-dimensional posteriors where even importance sampling struggles, the field moves to **Markov chain Monte Carlo** — but that builds on the same core idea that an integral is an average you can sample.`,
      },
      {
        kind: 'callout',
        tone: 'note',
        body: `**Common mistake: expecting linear payoff from more samples.** The reflex is "my estimate is twice as noisy as I want, so I will double the samples." That buys only a \\(\\sqrt{2} \\approx 1.41\\times\\) reduction in error, not \\(2\\times\\) — because error scales as \\(1/\\sqrt{N}\\), halving it requires \\(4\\times\\) the samples and cutting it tenfold requires \\(100\\times\\). When a Monte Carlo estimate is too noisy and the sample budget is already large, the answer is almost never "add more samples" — it is variance reduction (importance sampling, control variates, stratification). Reshaping *where* you sample can drop the error by factors that no affordable increase in \\(N\\) would match.`,
      },
      {
        kind: 'prose',
        heading: 'Exercise',
        body: `You want to estimate \\(I = \\int_0^1 e^{x}\\,dx\\) (true value \\(e - 1 \\approx 1.718\\)) by Monte Carlo: draw \\(x_i\\) uniformly on \\([0,1]\\) and average \\(e^{x_i}\\) (here \\(V = 1\\)). (1) With \\(N = 4\\) samples \\(x = 0.1, 0.4, 0.6, 0.9\\), compute \\(\\hat I_4\\). (2) Your estimate has standard error about \\(0.14\\) at \\(N = 100\\); how many samples do you need to bring it to \\(0.014\\)? (3) Would importance sampling with \\(q(x) \\propto e^{x}\\) raise or lower the variance, and why? (4) In one sentence, state why Monte Carlo is a poor choice for *this* one-dimensional integral but the right choice for a fifty-dimensional one.`,
      },
      {
        kind: 'prose',
        heading: 'What to take away',
        body: `Monte Carlo integration turns an integral into an average and estimates it by sampling: scatter \\(N\\) random points, average \\(f\\), multiply by the volume. The estimator is unbiased and its error falls like \\(1/\\sqrt{N}\\) independent of dimension — slow in low dimensions, but the only survivor in high ones where grids face the curse of dimensionality. To halve the error you quadruple the samples, so the real leverage is variance reduction: importance sampling and friends lower \\(\\sigma_f\\) by reshaping where you sample, buying accuracy that brute-force \\(N\\) cannot afford. It underpins Bayesian inference, reinforcement learning, and any expectation too high-dimensional to compute exactly.`,
      },
    ],
  },
];
