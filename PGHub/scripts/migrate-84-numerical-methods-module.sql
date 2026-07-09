-- 84: add the Numerical Methods module so /learn/numerical-methods/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 40 slots it after the most recent learn modules. Distinct from the calculus
-- and linear-algebra modules (those build the exact math); this one is about computing
-- those results in finite-precision arithmetic — rounding error and conditioning, root
-- finding, interpolation and quadrature, and solving linear systems robustly.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'numerical-methods',
  'Numerical Methods',
  'How real math gets computed on a machine that only holds a finite number of digits — floating-point rounding, machine epsilon, catastrophic cancellation, conditioning versus stability; root finding from robust bisection to quadratically convergent Newton-Raphson; polynomial interpolation, the Runge phenomenon, and trapezoid versus Simpson quadrature; and solving linear systems with Gaussian elimination, LU factorization, pivoting, condition numbers, and iterative methods — with interactive Newton, bisection, quadrature, and cancellation visualizations.',
  40,
  'Sigma'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
