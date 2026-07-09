-- 83: add the Functional Programming module so /learn/functional-programming/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 39 slots it after the most recent learn modules (compilers, distributed systems,
-- data engineering). Covers the FP paradigm — pure functions and immutability, higher-order
-- functions and composition, recursion and lazy evaluation, and algebraic data types with
-- pattern matching — the ideas behind Haskell, ML, and the functional core of modern languages.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'functional-programming',
  'Functional Programming',
  'Programs as the composition and evaluation of pure functions — no side effects, no mutable state, no surprises. Pure functions and immutability for referential transparency you can reason about, higher-order functions with map/filter/reduce and closures and currying for composition, recursion and lazy evaluation for describing infinite streams and elegant algorithms, and algebraic data types with pattern matching and Option/Result to make illegal states unrepresentable and banish null — with interactive purity, map-reduce pipeline, call-stack, and Maybe-chain visualizations.',
  39,
  'FunctionSquare'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
