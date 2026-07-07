-- 76: add the Testing & Software Engineering module so /learn/testing-swe/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 32 slots it after Web Security (position 31).

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'testing-swe',
  'Testing & Software Engineering',
  'How working engineers keep code correct as it changes — unit tests and the red-green-refactor loop of TDD, the testing pyramid from fast unit checks up to slow end-to-end runs, test doubles and dependency injection for isolating a unit, and coverage plus CI pipelines that gate every push — built from intuition with interactive visuals and runnable test examples.',
  32,
  'FlaskConical'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
