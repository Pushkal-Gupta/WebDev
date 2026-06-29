-- 64: add the Databases module so /learn/databases/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 20 slots it after the other CS-core modules (calculus = 16, system-design = 100).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'databases',
  'Databases',
  'The relational model, indexing with B+ trees, ACID transactions, and normalization — built from intuition with interactive visuals and runnable SQL.',
  20,
  'Database'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
