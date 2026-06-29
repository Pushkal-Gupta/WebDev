-- 67: add the Python language module so /learn/python-language/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 23 slots it after the Computer Networks module (= 22), continuing the CS-core block.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'python-language',
  'Python',
  'Variables and types, control flow, functions and scope, and the core data structures — learned by editing and running real code in the browser, with interactive visuals for the parts that are hard to picture.',
  23,
  'Code2'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
