-- 72: add the React & Frontend module so /learn/react-frontend/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 28 slots it after Web Fundamentals (position 27).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'react-frontend',
  'React & Frontend',
  'How React actually renders — components and JSX, props and one-way data flow, state and hooks, the virtual DOM and reconciliation, and effects for data fetching — built from intuition with interactive visuals and JSX you can read and run.',
  28,
  'Atom'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
