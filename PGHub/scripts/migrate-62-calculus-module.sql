-- 62: add the Calculus module so /learn/calculus/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 16 slots it after the math-flavoured modules (math = 2, system-design = 100).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'calculus',
  'Calculus',
  'Limits, derivatives, the chain rule, and integration as area — built from intuition with interactive visuals.',
  16,
  'TrendingUp'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
